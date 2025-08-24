import * as PIXI from 'pixi.js';

export interface Collidable {
  id: string;
  getBounds(): PIXI.Rectangle;
  onCollision?: (other: Collidable) => void;
  collisionGroup?: string;
  isStatic?: boolean;
}

export interface CollisionLayer {
  name: string;
  objects: Set<Collidable>;
  collidesWidth: string[];
}

export class CollisionSystem {
  private layers: Map<string, CollisionLayer> = new Map();
  private spatialHash: Map<string, Set<Collidable>> = new Map();
  private cellSize: number = 100;
  private debugMode: boolean = false;
  private debugGraphics?: PIXI.Graphics;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  createLayer(name: string, collidesWidth: string[] = []): void {
    this.layers.set(name, {
      name,
      objects: new Set(),
      collidesWidth,
    });
  }

  addObject(object: Collidable, layerName: string): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      console.warn(`Layer ${layerName} does not exist`);
      return;
    }

    layer.objects.add(object);
    this.updateSpatialHash(object);
  }

  removeObject(object: Collidable, layerName: string): void {
    const layer = this.layers.get(layerName);
    if (!layer) return;

    layer.objects.delete(object);
    this.removefromSpatialHash(object);
  }

  private updateSpatialHash(object: Collidable): void {
    if (!object || typeof object.getBounds !== 'function') {
      console.warn('Invalid object passed to updateSpatialHash:', object);
      return;
    }
    
    try {
      const bounds = object.getBounds();
      const cells = this.getCellsForBounds(bounds);

      cells.forEach(cell => {
        if (!this.spatialHash.has(cell)) {
          this.spatialHash.set(cell, new Set());
        }
        this.spatialHash.get(cell)!.add(object);
      });
    } catch (error) {
      console.warn('Failed to update spatial hash for object:', error);
    }
  }

  private removefromSpatialHash(object: Collidable): void {
    this.spatialHash.forEach(cell => {
      cell.delete(object);
    });
  }

  private getCellsForBounds(bounds: PIXI.Rectangle): string[] {
    const cells: string[] = [];
    const minX = Math.floor(bounds.x / this.cellSize);
    const minY = Math.floor(bounds.y / this.cellSize);
    const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(`${x},${y}`);
      }
    }

    return cells;
  }

  update(): void {
    this.spatialHash.clear();

    this.layers.forEach(layer => {
      layer.objects.forEach(object => {
        if (!object.isStatic) {
          this.updateSpatialHash(object);
        }
      });
    });

    this.checkCollisions();

    if (this.debugMode && this.debugGraphics) {
      this.drawDebug();
    }
  }

  private checkCollisions(): void {
    const checkedPairs = new Set<string>();

    this.layers.forEach((layer, layerName) => {
      layer.objects.forEach(object1 => {
        const bounds1 = object1.getBounds();
        const cells = this.getCellsForBounds(bounds1);
        const nearbyObjects = new Set<Collidable>();

        cells.forEach(cell => {
          const cellObjects = this.spatialHash.get(cell);
          if (cellObjects) {
            cellObjects.forEach(obj => nearbyObjects.add(obj));
          }
        });

        nearbyObjects.forEach(object2 => {
          if (object1 === object2) return;

          const pairKey = this.getPairKey(object1.id, object2.id);
          if (checkedPairs.has(pairKey)) return;
          checkedPairs.add(pairKey);

          const object2LayerName = this.getObjectLayer(object2);
          if (!object2LayerName || !layer.collidesWidth.includes(object2LayerName)) return;

          if (this.testCollision(object1, object2)) {
            object1.onCollision?.(object2);
            object2.onCollision?.(object1);
          }
        });
      });
    });
  }

  private getObjectLayer(object: Collidable): string | null {
    for (const [layerName, layer] of this.layers) {
      if (layer.objects.has(object)) {
        return layerName;
      }
    }
    return null;
  }

  private getPairKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }

  private testCollision(object1: Collidable, object2: Collidable): boolean {
    const bounds1 = object1.getBounds();
    const bounds2 = object2.getBounds();

    return (
      bounds1.x < bounds2.x + bounds2.width &&
      bounds1.x + bounds1.width > bounds2.x &&
      bounds1.y < bounds2.y + bounds2.height &&
      bounds1.y + bounds1.height > bounds2.y
    );
  }

  testCircleCollision(
    pos1: { x: number; y: number },
    radius1: number,
    pos2: { x: number; y: number },
    radius2: number
  ): boolean {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius1 + radius2;
  }

  raycast(
    start: { x: number; y: number },
    direction: { x: number; y: number },
    maxDistance: number,
    layerName?: string
  ): { object: Collidable; point: { x: number; y: number }; distance: number } | null {
    let closestHit: { object: Collidable; point: { x: number; y: number }; distance: number } | null = null;
    let minDistance = maxDistance;

    const layers = layerName ? [this.layers.get(layerName)] : Array.from(this.layers.values());

    layers.forEach(layer => {
      if (!layer) return;

      layer.objects.forEach(object => {
        const bounds = object.getBounds();
        const hit = this.rayRectIntersection(start, direction, bounds);

        if (hit && hit.distance < minDistance) {
          minDistance = hit.distance;
          closestHit = {
            object,
            point: hit.point,
            distance: hit.distance,
          };
        }
      });
    });

    return closestHit;
  }

  private rayRectIntersection(
    start: { x: number; y: number },
    direction: { x: number; y: number },
    rect: PIXI.Rectangle
  ): { point: { x: number; y: number }; distance: number } | null {
    const invDirX = 1 / direction.x;
    const invDirY = 1 / direction.y;

    const t1 = (rect.x - start.x) * invDirX;
    const t2 = (rect.x + rect.width - start.x) * invDirX;
    const t3 = (rect.y - start.y) * invDirY;
    const t4 = (rect.y + rect.height - start.y) * invDirY;

    const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    if (tMax < 0 || tMin > tMax) {
      return null;
    }

    const t = tMin < 0 ? tMax : tMin;
    const point = {
      x: start.x + direction.x * t,
      y: start.y + direction.y * t,
    };

    return { point, distance: t };
  }

  enableDebug(app: PIXI.Application): void {
    this.debugMode = true;
    this.debugGraphics = new PIXI.Graphics();
    app.stage.addChild(this.debugGraphics);
  }

  disableDebug(): void {
    this.debugMode = false;
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = undefined;
    }
  }

  private drawDebug(): void {
    if (!this.debugGraphics) return;

    this.debugGraphics.clear();

    this.spatialHash.forEach((objects, cell) => {
      const [x, y] = cell.split(',').map(Number);
      this.debugGraphics.rect(
        x * this.cellSize,
        y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      this.debugGraphics.stroke({ color: 0x00ff00, alpha: 0.3, width: 1 });
    });

    this.layers.forEach(layer => {
      layer.objects.forEach(object => {
        const bounds = object.getBounds();
        this.debugGraphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.debugGraphics.stroke({ color: 0xff0000, alpha: 0.5, width: 2 });
      });
    });
  }

  clear(): void {
    this.layers.clear();
    this.spatialHash.clear();
  }
}