import * as PIXI from 'pixi.js';

export interface CameraOptions {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  smoothing?: number;
  bounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

export class Camera {
  private app: PIXI.Application;
  private world: PIXI.Container;
  private target?: PIXI.DisplayObject;
  private targetPosition: { x: number; y: number } = { x: 0, y: 0 };
  private currentPosition: { x: number; y: number } = { x: 0, y: 0 };
  private smoothing: number;
  private viewportWidth: number;
  private viewportHeight: number;
  private worldWidth: number;
  private worldHeight: number;
  private bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  private zoom: number = 1;
  private targetZoom: number = 1;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTime: number = 0;

  constructor(app: PIXI.Application, world: PIXI.Container, options: CameraOptions) {
    this.app = app;
    this.world = world;
    this.smoothing = options.smoothing ?? 0.1;
    this.viewportWidth = options.viewportWidth;
    this.viewportHeight = options.viewportHeight;
    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;

    this.bounds = {
      minX: options.bounds?.minX ?? 0,
      maxX: options.bounds?.maxX ?? options.worldWidth - options.viewportWidth,
      minY: options.bounds?.minY ?? 0,
      maxY: options.bounds?.maxY ?? options.worldHeight - options.viewportHeight,
    };

    this.centerCamera();
  }

  follow(target: PIXI.DisplayObject): void {
    this.target = target;
  }

  unfollow(): void {
    this.target = undefined;
  }

  setPosition(x: number, y: number): void {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
    this.currentPosition.x = x;
    this.currentPosition.y = y;
    this.updateWorldPosition();
  }

  moveTo(x: number, y: number, instant: boolean = false): void {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
    
    if (instant) {
      this.currentPosition.x = x;
      this.currentPosition.y = y;
      this.updateWorldPosition();
    }
  }

  setZoom(zoom: number, instant: boolean = false): void {
    this.targetZoom = Math.max(0.5, Math.min(3, zoom));
    
    if (instant) {
      this.zoom = this.targetZoom;
      this.world.scale.set(this.zoom);
    }
  }

  zoomIn(amount: number = 0.1): void {
    this.setZoom(this.targetZoom + amount);
  }

  zoomOut(amount: number = 0.1): void {
    this.setZoom(this.targetZoom - amount);
  }

  shake(intensity: number = 10, duration: number = 0.5): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration * 1000;
    this.shakeTime = 0;
  }

  update(delta: number): void {
    if (this.target) {
      const targetWorldX = this.target.x - this.viewportWidth / 2 / this.zoom;
      const targetWorldY = this.target.y - this.viewportHeight / 2 / this.zoom;
      
      this.targetPosition.x = targetWorldX;
      this.targetPosition.y = targetWorldY;
    }

    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * this.smoothing;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * this.smoothing;

    this.currentPosition.x = this.clamp(
      this.currentPosition.x,
      this.bounds.minX / this.zoom,
      this.bounds.maxX / this.zoom
    );
    this.currentPosition.y = this.clamp(
      this.currentPosition.y,
      this.bounds.minY / this.zoom,
      this.bounds.maxY / this.zoom
    );

    if (Math.abs(this.zoom - this.targetZoom) > 0.001) {
      this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
      this.world.scale.set(this.zoom);
    }

    let shakeX = 0;
    let shakeY = 0;
    
    if (this.shakeDuration > 0) {
      this.shakeTime += delta;
      
      if (this.shakeTime < this.shakeDuration) {
        const progress = this.shakeTime / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - progress);
        
        shakeX = (Math.random() - 0.5) * currentIntensity;
        shakeY = (Math.random() - 0.5) * currentIntensity;
      } else {
        this.shakeDuration = 0;
        this.shakeTime = 0;
      }
    }

    this.world.x = -this.currentPosition.x * this.zoom + shakeX;
    this.world.y = -this.currentPosition.y * this.zoom + shakeY;
  }

  private updateWorldPosition(): void {
    this.world.x = -this.currentPosition.x * this.zoom;
    this.world.y = -this.currentPosition.y * this.zoom;
  }

  private centerCamera(): void {
    const centerX = this.worldWidth / 2 - this.viewportWidth / 2;
    const centerY = this.worldHeight / 2 - this.viewportHeight / 2;
    this.setPosition(centerX, centerY);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.world.x) / this.zoom,
      y: (screenY - this.world.y) / this.zoom,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.zoom + this.world.x,
      y: worldY * this.zoom + this.world.y,
    };
  }

  isInViewport(object: PIXI.DisplayObject, padding: number = 0): boolean {
    const bounds = object.getBounds();
    const screenBounds = {
      x: bounds.x * this.zoom + this.world.x,
      y: bounds.y * this.zoom + this.world.y,
      width: bounds.width * this.zoom,
      height: bounds.height * this.zoom,
    };

    return (
      screenBounds.x + screenBounds.width + padding >= 0 &&
      screenBounds.x - padding <= this.viewportWidth &&
      screenBounds.y + screenBounds.height + padding >= 0 &&
      screenBounds.y - padding <= this.viewportHeight
    );
  }

  getVisibleBounds(): PIXI.Rectangle {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.viewportWidth, this.viewportHeight);
    
    return new PIXI.Rectangle(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    );
  }

  setBounds(bounds: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  }): void {
    if (bounds.minX !== undefined) this.bounds.minX = bounds.minX;
    if (bounds.maxX !== undefined) this.bounds.maxX = bounds.maxX;
    if (bounds.minY !== undefined) this.bounds.minY = bounds.minY;
    if (bounds.maxY !== undefined) this.bounds.maxY = bounds.maxY;
  }

  resize(viewportWidth: number, viewportHeight: number): void {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    
    this.bounds.maxX = Math.max(0, this.worldWidth - viewportWidth);
    this.bounds.maxY = Math.max(0, this.worldHeight - viewportHeight);
  }

  getPosition(): { x: number; y: number } {
    return { ...this.currentPosition };
  }

  getZoom(): number {
    return this.zoom;
  }

  getViewportWidth(): number {
    return this.viewportWidth;
  }

  getViewportHeight(): number {
    return this.viewportHeight;
  }
}