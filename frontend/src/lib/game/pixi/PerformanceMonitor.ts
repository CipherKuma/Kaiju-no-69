import * as PIXI from 'pixi.js';

export class PerformanceMonitor {
  private app: PIXI.Application;
  private fpsText?: PIXI.Text;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;
  private enabled: boolean = false;
  private displayContainer?: PIXI.Container;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  enable(showDisplay: boolean = false): void {
    this.enabled = true;

    if (showDisplay) {
      this.createDisplay();
    }
  }

  disable(): void {
    this.enabled = false;
    this.removeDisplay();
  }

  private createDisplay(): void {
    if (this.displayContainer) return;

    this.displayContainer = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 100, 30);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    
    this.fpsText = new PIXI.Text({
      text: 'FPS: 0',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0x00ff00,
      },
    });
    this.fpsText.x = 5;
    this.fpsText.y = 5;

    this.displayContainer.addChild(bg, this.fpsText);
    this.displayContainer.x = 10;
    this.displayContainer.y = 10;

    this.app.stage.addChild(this.displayContainer);
  }

  private removeDisplay(): void {
    if (this.displayContainer) {
      this.app.stage.removeChild(this.displayContainer);
      this.displayContainer.destroy(true);
      this.displayContainer = undefined;
      this.fpsText = undefined;
    }
  }

  update(): void {
    if (!this.enabled) return;

    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastTime = currentTime;

      if (this.fpsText) {
        this.fpsText.text = `FPS: ${this.fps}`;
        
        if (this.fps >= 55) {
          this.fpsText.style.fill = 0x00ff00;
        } else if (this.fps >= 30) {
          this.fpsText.style.fill = 0xffff00;
        } else {
          this.fpsText.style.fill = 0xff0000;
        }
      }

      if (this.fps < 30) {
        console.warn(`Low FPS detected: ${this.fps}`);
      }
    }
  }

  getFPS(): number {
    return this.fps;
  }

  getMetrics(): {
    fps: number;
    drawCalls: number;
    textureCount: number;
    spriteCount: number;
  } {
    const renderer = this.app.renderer as PIXI.Renderer;
    
    return {
      fps: this.fps,
      drawCalls: renderer.renderPipes ? renderer.renderPipes.batch?.drawCalls || 0 : 0,
      textureCount: PIXI.TexturePool ? Object.keys(PIXI.TexturePool).length : 0,
      spriteCount: this.countSprites(this.app.stage),
    };
  }

  private countSprites(container: PIXI.Container): number {
    let count = 0;
    
    container.children.forEach(child => {
      if (child instanceof PIXI.Sprite) {
        count++;
      }
      if (child instanceof PIXI.Container) {
        count += this.countSprites(child);
      }
    });

    return count;
  }

  destroy(): void {
    this.disable();
  }
}