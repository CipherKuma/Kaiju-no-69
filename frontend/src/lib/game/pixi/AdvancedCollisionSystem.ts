import * as PIXI from 'pixi.js';
import { CollisionSystem, Collidable } from './CollisionSystem';

export type CollisionShape = 
  | { type: 'rectangle'; width: number; height: number; offset?: { x: number; y: number } }
  | { type: 'circle'; radius: number; offset?: { x: number; y: number } }
  | { type: 'polygon'; points: PIXI.Point[]; offset?: { x: number; y: number } }
  | { type: 'shadow'; baseWidth: number; baseHeight: number; shadowScale: number };

export interface AdvancedCollidable extends Collidable {
  getCollisionShape(): CollisionShape;
  collisionMask?: number;
  collisionCategory?: number;
  isTrigger?: boolean;
  onTriggerEnter?: (other: AdvancedCollidable) => void;
  onTriggerExit?: (other: AdvancedCollidable) => void;
  onTriggerStay?: (other: AdvancedCollidable) => void;
}

export interface TerrainObstacle {
  id: string;
  shape: CollisionShape;
  position: { x: number; y: number };
  isPassable: boolean;
  terrainType: 'wall' | 'water' | 'lava' | 'cliff' | 'barrier';
  damage?: number;
}

export interface InteractiveZone {
  id: string;
  shape: CollisionShape;
  position: { x: number; y: number };
  onEnter?: (entity: AdvancedCollidable) => void;
  onExit?: (entity: AdvancedCollidable) => void;
  onStay?: (entity: AdvancedCollidable, deltaTime: number) => void;
  isActive: boolean;
  metadata?: any;
}

export class AdvancedCollisionSystem extends CollisionSystem {
  private triggerStates: Map<string, Set<string>> = new Map();
  private terrainObstacles: Map<string, TerrainObstacle> = new Map();
  private interactiveZones: Map<string, InteractiveZone> = new Map();
  private quadTree: QuadTree;
  
  constructor(worldBounds: PIXI.Rectangle, cellSize: number = 100) {
    super(cellSize);
    this.quadTree = new QuadTree(worldBounds, 4, 10);
  }
  
  addAdvancedObject(object: AdvancedCollidable, layerName: string): void {
    super.addObject(object, layerName);
    this.quadTree.insert(object);
  }
  
  removeAdvancedObject(object: AdvancedCollidable, layerName: string): void {
    super.removeObject(object, layerName);
    this.quadTree.remove(object);
    
    // Clean up trigger states
    this.triggerStates.delete(object.id);
    this.triggerStates.forEach(states => states.delete(object.id));
  }
  
  addTerrainObstacle(obstacle: TerrainObstacle): void {
    this.terrainObstacles.set(obstacle.id, obstacle);
  }
  
  removeTerrainObstacle(id: string): void {
    this.terrainObstacles.delete(id);
  }
  
  addInteractiveZone(zone: InteractiveZone): void {
    this.interactiveZones.set(zone.id, zone);
  }
  
  removeInteractiveZone(id: string): void {
    this.interactiveZones.delete(id);
  }
  
  update(deltaTime: number = 1/60): void {
    // Update quad tree
    this.quadTree.clear();
    this.layers.forEach(layer => {
      layer.objects.forEach(object => {
        if (!object.isStatic) {
          this.quadTree.insert(object as AdvancedCollidable);
        }
      });
    });
    
    // Check collisions
    this.checkAdvancedCollisions();
    
    // Check interactive zones
    this.checkInteractiveZones(deltaTime);
    
    // Update trigger states
    this.updateTriggerStates();
  }
  
  private checkAdvancedCollisions(): void {
    const checkedPairs = new Set<string>();
    
    this.layers.forEach((layer, layerName) => {
      layer.objects.forEach(obj1 => {
        const object1 = obj1 as AdvancedCollidable;
        const bounds1 = object1.getBounds();
        
        // Get nearby objects from quad tree
        const nearbyObjects = this.quadTree.retrieve(bounds1);
        
        nearbyObjects.forEach(obj2 => {
          const object2 = obj2 as AdvancedCollidable;
          if (object1 === object2) return;
          
          const pairKey = this.getPairKey(object1.id, object2.id);
          if (checkedPairs.has(pairKey)) return;
          checkedPairs.add(pairKey);
          
          // Check collision masks
          if (object1.collisionMask && object2.collisionCategory) {
            if (!(object1.collisionMask & object2.collisionCategory)) return;
          }
          
          if (this.testAdvancedCollision(object1, object2)) {
            if (object1.isTrigger || object2.isTrigger) {
              this.handleTriggerCollision(object1, object2);
            } else {
              object1.onCollision?.(object2);
              object2.onCollision?.(object1);
            }
          }
        });
        
        // Check terrain collisions
        this.checkTerrainCollisions(object1);
      });
    });
  }
  
  private testAdvancedCollision(object1: AdvancedCollidable, object2: AdvancedCollidable): boolean {
    const shape1 = object1.getCollisionShape();
    const shape2 = object2.getCollisionShape();
    const pos1 = object1.getBounds();
    const pos2 = object2.getBounds();
    
    // Handle shadow-to-shadow collision
    if (shape1.type === 'shadow' && shape2.type === 'shadow') {
      return this.testShadowCollision(
        pos1, shape1,
        pos2, shape2
      );
    }
    
    // Handle different shape combinations
    if (shape1.type === 'circle' && shape2.type === 'circle') {
      return this.testCircleCollision(
        { x: pos1.x + pos1.width/2, y: pos1.y + pos1.height/2 },
        shape1.radius,
        { x: pos2.x + pos2.width/2, y: pos2.y + pos2.height/2 },
        shape2.radius
      );
    }
    
    if (shape1.type === 'polygon' || shape2.type === 'polygon') {
      return this.testPolygonCollision(object1, object2);
    }
    
    // Default to AABB collision
    return super['testCollision'](object1, object2);
  }
  
  private testShadowCollision(
    pos1: PIXI.Rectangle, 
    shadow1: Extract<CollisionShape, { type: 'shadow' }>,
    pos2: PIXI.Rectangle,
    shadow2: Extract<CollisionShape, { type: 'shadow' }>
  ): boolean {
    // Shadow collision uses ellipse at the base of entities
    const ellipse1 = {
      x: pos1.x + pos1.width / 2,
      y: pos1.y + pos1.height,
      radiusX: shadow1.baseWidth * shadow1.shadowScale / 2,
      radiusY: shadow1.baseHeight * shadow1.shadowScale / 2
    };
    
    const ellipse2 = {
      x: pos2.x + pos2.width / 2,
      y: pos2.y + pos2.height,
      radiusX: shadow2.baseWidth * shadow2.shadowScale / 2,
      radiusY: shadow2.baseHeight * shadow2.shadowScale / 2
    };
    
    return this.testEllipseCollision(ellipse1, ellipse2);
  }
  
  private testEllipseCollision(
    e1: { x: number; y: number; radiusX: number; radiusY: number },
    e2: { x: number; y: number; radiusX: number; radiusY: number }
  ): boolean {
    const dx = e2.x - e1.x;
    const dy = e2.y - e1.y;
    
    const a = (dx * dx) / ((e1.radiusX + e2.radiusX) * (e1.radiusX + e2.radiusX));
    const b = (dy * dy) / ((e1.radiusY + e2.radiusY) * (e1.radiusY + e2.radiusY));
    
    return a + b <= 1;
  }
  
  private testPolygonCollision(object1: AdvancedCollidable, object2: AdvancedCollidable): boolean {
    // Simplified SAT (Separating Axis Theorem) implementation
    // For now, fall back to bounding box
    return super['testCollision'](object1, object2);
  }
  
  private checkTerrainCollisions(object: AdvancedCollidable): void {
    const bounds = object.getBounds();
    
    this.terrainObstacles.forEach(obstacle => {
      if (this.testShapeCollision(bounds, object.getCollisionShape(), obstacle.position, obstacle.shape)) {
        if (!obstacle.isPassable) {
          // Handle collision response
          object.onCollision?.({
            id: obstacle.id,
            getBounds: () => new PIXI.Rectangle(
              obstacle.position.x,
              obstacle.position.y,
              0, 0
            ),
            collisionGroup: 'terrain'
          });
        }
        
        // Apply terrain damage if applicable
        if (obstacle.damage && obstacle.damage > 0) {
          (object as any).takeDamage?.(obstacle.damage);
        }
      }
    });
  }
  
  private checkInteractiveZones(deltaTime: number): void {
    this.layers.forEach(layer => {
      layer.objects.forEach(obj => {
        const object = obj as AdvancedCollidable;
        const bounds = object.getBounds();
        
        this.interactiveZones.forEach(zone => {
          if (!zone.isActive) return;
          
          const isInZone = this.testShapeCollision(
            bounds,
            object.getCollisionShape(),
            zone.position,
            zone.shape
          );
          
          const wasInZone = this.triggerStates.get(object.id)?.has(zone.id) || false;
          
          if (isInZone && !wasInZone) {
            // Entity entered zone
            zone.onEnter?.(object);
            if (!this.triggerStates.has(object.id)) {
              this.triggerStates.set(object.id, new Set());
            }
            this.triggerStates.get(object.id)!.add(zone.id);
          } else if (!isInZone && wasInZone) {
            // Entity exited zone
            zone.onExit?.(object);
            this.triggerStates.get(object.id)?.delete(zone.id);
          } else if (isInZone && wasInZone) {
            // Entity staying in zone
            zone.onStay?.(object, deltaTime);
          }
        });
      });
    });
  }
  
  private testShapeCollision(
    bounds1: PIXI.Rectangle,
    shape1: CollisionShape,
    pos2: { x: number; y: number },
    shape2: CollisionShape
  ): boolean {
    // Simplified shape collision testing
    // For complex shapes, consider using a physics library
    const rect1 = bounds1;
    const rect2 = new PIXI.Rectangle(pos2.x, pos2.y, 100, 100); // Default size
    
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
  
  private handleTriggerCollision(object1: AdvancedCollidable, object2: AdvancedCollidable): void {
    const triggerId = object1.isTrigger ? object1.id : object2.id;
    const otherId = object1.isTrigger ? object2.id : object1.id;
    const trigger = object1.isTrigger ? object1 : object2;
    const other = object1.isTrigger ? object2 : object1;
    
    if (!this.triggerStates.has(otherId)) {
      this.triggerStates.set(otherId, new Set());
    }
    
    const states = this.triggerStates.get(otherId)!;
    const wasTriggered = states.has(triggerId);
    
    if (!wasTriggered) {
      states.add(triggerId);
      trigger.onTriggerEnter?.(other);
    } else {
      trigger.onTriggerStay?.(other);
    }
  }
  
  private updateTriggerStates(): void {
    // Clean up trigger states for objects that are no longer colliding
    this.triggerStates.forEach((states, objectId) => {
      states.forEach(triggerId => {
        // Check if still colliding
        let stillColliding = false;
        
        this.layers.forEach(layer => {
          const object = Array.from(layer.objects).find(o => o.id === objectId) as AdvancedCollidable;
          const trigger = Array.from(layer.objects).find(o => o.id === triggerId) as AdvancedCollidable;
          
          if (object && trigger && this.testAdvancedCollision(object, trigger)) {
            stillColliding = true;
          }
        });
        
        if (!stillColliding) {
          states.delete(triggerId);
          // Find trigger object and call onTriggerExit
          this.layers.forEach(layer => {
            const trigger = Array.from(layer.objects).find(o => o.id === triggerId) as AdvancedCollidable;
            const object = Array.from(layer.objects).find(o => o.id === objectId) as AdvancedCollidable;
            if (trigger && object) {
              trigger.onTriggerExit?.(object);
            }
          });
        }
      });
    });
  }
  
  private getPairKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }
}

// Simple QuadTree implementation for spatial optimization
class QuadTree {
  private bounds: PIXI.Rectangle;
  private maxObjects: number;
  private maxLevels: number;
  private level: number;
  private objects: AdvancedCollidable[] = [];
  private nodes: QuadTree[] = [];
  
  constructor(bounds: PIXI.Rectangle, maxObjects: number = 4, maxLevels: number = 10, level: number = 0) {
    this.bounds = bounds;
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
  }
  
  clear(): void {
    this.objects = [];
    this.nodes.forEach(node => node.clear());
    this.nodes = [];
  }
  
  split(): void {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;
    
    this.nodes[0] = new QuadTree(
      new PIXI.Rectangle(x + subWidth, y, subWidth, subHeight),
      this.maxObjects, this.maxLevels, this.level + 1
    );
    this.nodes[1] = new QuadTree(
      new PIXI.Rectangle(x, y, subWidth, subHeight),
      this.maxObjects, this.maxLevels, this.level + 1
    );
    this.nodes[2] = new QuadTree(
      new PIXI.Rectangle(x, y + subHeight, subWidth, subHeight),
      this.maxObjects, this.maxLevels, this.level + 1
    );
    this.nodes[3] = new QuadTree(
      new PIXI.Rectangle(x + subWidth, y + subHeight, subWidth, subHeight),
      this.maxObjects, this.maxLevels, this.level + 1
    );
  }
  
  getIndex(bounds: PIXI.Rectangle): number {
    let index = -1;
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
    
    const topQuadrant = bounds.y < horizontalMidpoint && bounds.y + bounds.height < horizontalMidpoint;
    const bottomQuadrant = bounds.y > horizontalMidpoint;
    
    if (bounds.x < verticalMidpoint && bounds.x + bounds.width < verticalMidpoint) {
      if (topQuadrant) index = 1;
      else if (bottomQuadrant) index = 2;
    } else if (bounds.x > verticalMidpoint) {
      if (topQuadrant) index = 0;
      else if (bottomQuadrant) index = 3;
    }
    
    return index;
  }
  
  insert(object: AdvancedCollidable): void {
    if (this.nodes.length > 0) {
      const index = this.getIndex(object.getBounds());
      if (index !== -1) {
        this.nodes[index].insert(object);
        return;
      }
    }
    
    this.objects.push(object);
    
    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }
      
      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i].getBounds());
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }
  
  retrieve(bounds: PIXI.Rectangle): AdvancedCollidable[] {
    const returnObjects: AdvancedCollidable[] = [];
    const index = this.getIndex(bounds);
    
    if (index !== -1 && this.nodes.length > 0) {
      returnObjects.push(...this.nodes[index].retrieve(bounds));
    }
    
    returnObjects.push(...this.objects);
    
    return returnObjects;
  }
  
  remove(object: AdvancedCollidable): boolean {
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
      return true;
    }
    
    if (this.nodes.length > 0) {
      const nodeIndex = this.getIndex(object.getBounds());
      if (nodeIndex !== -1) {
        return this.nodes[nodeIndex].remove(object);
      }
    }
    
    return false;
  }
}