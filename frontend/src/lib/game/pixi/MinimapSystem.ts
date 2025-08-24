import * as PIXI from 'pixi.js';
import { Camera } from './Camera';

export interface MinimapConfig {
  worldWidth: number;
  worldHeight: number;
}

export class MinimapSystem {
  private uiContainer: PIXI.Container;
  private camera: Camera;
  private config: MinimapConfig;
  
  private minimapContainer: PIXI.Container;
  private minimapBackground: PIXI.Graphics;
  private minimapViewport: PIXI.Graphics;
  private minimapObjects: Map<string, PIXI.Graphics> = new Map();
  
  private debugContainer: PIXI.Container;
  private debugText: PIXI.Text;
  
  private isMinimapVisible: boolean = false;
  private isDebugVisible: boolean = false;
  
  private readonly minimapWidth = 200;
  private readonly minimapHeight = 150;
  private readonly minimapPadding = 10;

  constructor(uiContainer: PIXI.Container, camera: Camera, config: MinimapConfig) {
    this.uiContainer = uiContainer;
    this.camera = camera;
    this.config = config;
    
    this.setupMinimap();
    this.setupDebugInfo();
  }

  async initialize(): Promise<void> {
    this.updateMinimap();
    this.updateDebugInfo();
  }

  private setupMinimap(): void {
    this.minimapContainer = new PIXI.Container();
    this.minimapContainer.visible = this.isMinimapVisible;
    
    // Position in bottom-right corner
    this.minimapContainer.x = 800 - this.minimapWidth - this.minimapPadding;
    this.minimapContainer.y = 600 - this.minimapHeight - this.minimapPadding;
    
    // Background
    this.minimapBackground = new PIXI.Graphics();
    this.minimapBackground.beginFill(0x000000, 0.8);
    this.minimapBackground.drawRoundedRect(0, 0, this.minimapWidth, this.minimapHeight, 8);
    this.minimapBackground.endFill();
    
    // Border
    this.minimapBackground.lineStyle(2, 0x4A90E2, 0.8);
    this.minimapBackground.drawRoundedRect(0, 0, this.minimapWidth, this.minimapHeight, 8);
    
    this.minimapContainer.addChild(this.minimapBackground);
    
    // Viewport indicator
    this.minimapViewport = new PIXI.Graphics();
    this.minimapContainer.addChild(this.minimapViewport);
    
    this.uiContainer.addChild(this.minimapContainer);
  }

  private setupDebugInfo(): void {
    this.debugContainer = new PIXI.Container();
    this.debugContainer.visible = this.isDebugVisible;
    
    // Position in top-right corner
    this.debugContainer.x = 600;
    this.debugContainer.y = 20;
    
    // Background
    const debugBackground = new PIXI.Graphics();
    debugBackground.beginFill(0x000000, 0.7);
    debugBackground.drawRoundedRect(0, 0, 180, 120, 5);
    debugBackground.endFill();
    this.debugContainer.addChild(debugBackground);
    
    // Debug text
    this.debugText = new PIXI.Text('', {
      fontSize: 10,
      fill: 0xFFFFFF,
      fontFamily: 'Monaco, monospace'
    });
    this.debugText.x = 10;
    this.debugText.y = 10;
    this.debugContainer.addChild(this.debugText);
    
    this.uiContainer.addChild(this.debugContainer);
  }

  setTerrain(terrainData: any): void {
    // Update minimap with terrain information
    this.updateMinimap();
  }

  private updateMinimap(): void {
    if (!this.isMinimapVisible) return;
    
    // Clear existing minimap objects
    this.minimapObjects.forEach(obj => {
      this.minimapContainer.removeChild(obj);
      obj.destroy();
    });
    this.minimapObjects.clear();
    
    // Calculate scale factors
    const scaleX = (this.minimapWidth - 20) / this.config.worldWidth;
    const scaleY = (this.minimapHeight - 20) / this.config.worldHeight;
    
    // Update viewport indicator
    this.updateViewportIndicator(scaleX, scaleY);
    
    // Add world objects to minimap (this would be populated by the TerritoryManager)
    // For now, we'll add placeholder elements
    this.addMinimapElement('player', { x: this.config.worldWidth / 2, y: this.config.worldHeight / 2 }, 0x4A90E2, scaleX, scaleY);
  }

  private updateViewportIndicator(scaleX: number, scaleY: number): void {
    const cameraPos = this.camera.getPosition();
    const zoom = this.camera.getZoom();
    const viewportWidth = this.camera.getViewportWidth() / zoom;
    const viewportHeight = this.camera.getViewportHeight() / zoom;
    
    const x = (cameraPos.x - viewportWidth / 2) * scaleX + 10;
    const y = (cameraPos.y - viewportHeight / 2) * scaleY + 10;
    const width = viewportWidth * scaleX;
    const height = viewportHeight * scaleY;
    
    this.minimapViewport.clear();
    this.minimapViewport.lineStyle(2, 0xFFFFFF, 0.8);
    this.minimapViewport.drawRect(
      Math.max(10, Math.min(x, this.minimapWidth - 10)),
      Math.max(10, Math.min(y, this.minimapHeight - 10)),
      Math.max(1, Math.min(width, this.minimapWidth - x)),
      Math.max(1, Math.min(height, this.minimapHeight - y))
    );
  }

  addMinimapElement(id: string, worldPos: { x: number; y: number }, color: number, scaleX?: number, scaleY?: number): void {
    if (!this.isMinimapVisible) return;
    
    const sx = scaleX || (this.minimapWidth - 20) / this.config.worldWidth;
    const sy = scaleY || (this.minimapHeight - 20) / this.config.worldHeight;
    
    const element = new PIXI.Graphics();
    element.beginFill(color, 0.8);
    element.drawCircle(0, 0, 3);
    element.endFill();
    
    element.x = worldPos.x * sx + 10;
    element.y = worldPos.y * sy + 10;
    
    this.minimapContainer.addChild(element);
    this.minimapObjects.set(id, element);
  }

  removeMinimapElement(id: string): void {
    const element = this.minimapObjects.get(id);
    if (element) {
      this.minimapContainer.removeChild(element);
      element.destroy();
      this.minimapObjects.delete(id);
    }
  }

  updateMinimapElement(id: string, worldPos: { x: number; y: number }): void {
    const element = this.minimapObjects.get(id);
    if (element) {
      const scaleX = (this.minimapWidth - 20) / this.config.worldWidth;
      const scaleY = (this.minimapHeight - 20) / this.config.worldHeight;
      
      element.x = worldPos.x * scaleX + 10;
      element.y = worldPos.y * scaleY + 10;
    }
  }

  private updateDebugInfo(): void {
    if (!this.isDebugVisible) return;
    
    const cameraPos = this.camera.getPosition();
    const zoom = this.camera.getZoom();
    const fps = PIXI.Ticker.shared.deltaMS ? 1000 / PIXI.Ticker.shared.deltaMS : 0;
    
    const debugInfo = [
      `FPS: ${fps.toFixed(1)}`,
      `Camera: ${cameraPos.x.toFixed(0)}, ${cameraPos.y.toFixed(0)}`,
      `Zoom: ${zoom.toFixed(2)}`,
      `Objects: ${this.minimapObjects.size}`,
      `Memory: ${this.getMemoryUsage()}MB`,
      `Renderer: ${this.uiContainer.parent ? 'WebGL' : 'Canvas'}`,
    ];
    
    this.debugText.text = debugInfo.join('\n');
  }

  private getMemoryUsage(): string {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
    }
    return 'N/A';
  }

  toggle(): void {
    this.isMinimapVisible = !this.isMinimapVisible;
    this.minimapContainer.visible = this.isMinimapVisible;
    
    if (this.isMinimapVisible) {
      this.updateMinimap();
    }
  }

  toggleDebugStats(): void {
    this.isDebugVisible = !this.isDebugVisible;
    this.debugContainer.visible = this.isDebugVisible;
    
    if (this.isDebugVisible) {
      this.updateDebugInfo();
    }
  }

  update(deltaTime: number): void {
    if (this.isMinimapVisible) {
      const scaleX = (this.minimapWidth - 20) / this.config.worldWidth;
      const scaleY = (this.minimapHeight - 20) / this.config.worldHeight;
      this.updateViewportIndicator(scaleX, scaleY);
    }
    
    if (this.isDebugVisible) {
      // Update debug info every few frames to avoid performance impact
      if (Math.floor(Date.now() / 100) % 5 === 0) {
        this.updateDebugInfo();
      }
    }
  }

  resize(width: number, height: number): void {
    // Reposition minimap and debug info based on new screen size
    this.minimapContainer.x = width - this.minimapWidth - this.minimapPadding;
    this.minimapContainer.y = height - this.minimapHeight - this.minimapPadding;
    
    this.debugContainer.x = width - 200;
  }

  show(): void {
    this.isMinimapVisible = true;
    this.minimapContainer.visible = true;
    this.updateMinimap();
  }

  hide(): void {
    this.isMinimapVisible = false;
    this.minimapContainer.visible = false;
  }

  showDebug(): void {
    this.isDebugVisible = true;
    this.debugContainer.visible = true;
    this.updateDebugInfo();
  }

  hideDebug(): void {
    this.isDebugVisible = false;
    this.debugContainer.visible = false;
  }

  destroy(): void {
    this.minimapObjects.forEach(obj => obj.destroy());
    this.minimapObjects.clear();
    
    this.minimapContainer.destroy(true);
    this.debugContainer.destroy(true);
  }
}