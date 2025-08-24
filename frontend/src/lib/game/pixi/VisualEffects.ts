import * as PIXI from 'pixi.js';

export interface ScreenShakeOptions {
  intensity: number;
  duration: number;
  fadeOut?: boolean;
  direction?: 'horizontal' | 'vertical' | 'both';
}

export interface TrailEffectOptions {
  length: number;
  fadeSpeed: number;
  color?: number;
  alpha?: number;
  blur?: number;
}

export class VisualEffectsManager {
  private static instance: VisualEffectsManager;
  private app: PIXI.Application;
  private effectsContainer: PIXI.Container;
  private screenShake: ScreenShake;
  private trailManager: TrailManager;
  private filterManager: FilterManager;
  
  private constructor(app: PIXI.Application) {
    this.app = app;
    this.effectsContainer = new PIXI.Container();
    app.stage.addChild(this.effectsContainer);
    
    this.screenShake = new ScreenShake(app);
    this.trailManager = new TrailManager();
    this.filterManager = new FilterManager(app);
  }
  
  static getInstance(app?: PIXI.Application): VisualEffectsManager {
    if (!VisualEffectsManager.instance && app) {
      VisualEffectsManager.instance = new VisualEffectsManager(app);
    }
    return VisualEffectsManager.instance;
  }
  
  update(deltaTime: number): void {
    this.screenShake.update(deltaTime);
    this.trailManager.update(deltaTime);
    this.filterManager.update(deltaTime);
  }
  
  // Screen shake effects
  shakeScreen(options: ScreenShakeOptions): void {
    this.screenShake.shake(options);
  }
  
  // Shader effects for special abilities using built-in filters
  applyAbilityEffect(target: PIXI.DisplayObject, abilityType: string): void {
    switch (abilityType) {
      case 'fire':
        this.filterManager.applyFireEffect(target);
        break;
      case 'ice':
        this.filterManager.applyIceEffect(target);
        break;
      case 'electric':
        this.filterManager.applyElectricEffect(target);
        break;
      case 'poison':
        this.filterManager.applyPoisonEffect(target);
        break;
      case 'holy':
        this.filterManager.applyHolyEffect(target);
        break;
      case 'dark':
        this.filterManager.applyDarkEffect(target);
        break;
    }
  }
  
  removeAbilityEffect(target: PIXI.DisplayObject): void {
    this.filterManager.removeEffects(target);
  }
  
  // Bloom effects using color matrix approximation
  addBloom(target: PIXI.DisplayObject, intensity: number = 1.5, threshold: number = 0.5): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.brightness(intensity, false);
    colorMatrix.contrast(1.2, false);
    
    if (!target.filters) target.filters = [];
    target.filters.push(colorMatrix);
  }
  
  // Trail effects for movement
  createTrail(sprite: PIXI.Sprite, options: TrailEffectOptions): string {
    return this.trailManager.createTrail(sprite, options, this.effectsContainer);
  }
  
  removeTrail(id: string): void {
    this.trailManager.removeTrail(id);
  }
  
  // Shockwave effect using displacement filter
  createShockwave(position: { x: number; y: number }, radius: number = 200): void {
    const shockwaveContainer = new PIXI.Container();
    this.app.stage.addChild(shockwaveContainer);
    
    // Create circular gradient for displacement
    const graphics = new PIXI.Graphics();
    const gradient = new PIXI.FillGradient(0, 0, radius * 2, radius * 2);
    gradient.addColorStop(0, 0xffffff);
    gradient.addColorStop(0.5, 0x808080);
    gradient.addColorStop(1, 0x000000);
    
    graphics.circle(radius, radius, radius);
    graphics.fill({ color: 0xffffff, alpha: 1 });
    
    const renderTexture = PIXI.RenderTexture.create({ width: radius * 2, height: radius * 2 });
    this.app.renderer.render({ container: graphics, target: renderTexture });
    
    const displacementSprite = new PIXI.Sprite(renderTexture);
    displacementSprite.anchor.set(0.5);
    displacementSprite.position.set(position.x, position.y);
    shockwaveContainer.addChild(displacementSprite);
    
    const displacementFilter = new PIXI.DisplacementFilter({
      sprite: displacementSprite,
      scale: 0
    });
    
    this.app.stage.filters = this.app.stage.filters || [];
    this.app.stage.filters.push(displacementFilter);
    
    // Animate the shockwave
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      displacementFilter.scale = Math.sin(progress * Math.PI) * 50;
      displacementSprite.scale.set(1 + progress);
      displacementSprite.alpha = 1 - progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Clean up
        const index = this.app.stage.filters.indexOf(displacementFilter);
        if (index > -1) {
          this.app.stage.filters.splice(index, 1);
        }
        shockwaveContainer.destroy(true);
        renderTexture.destroy(true);
      }
    };
    
    animate();
  }
  
  // Glitch effect using color matrix
  applyGlitchEffect(duration: number = 500): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    const noiseFilter = new PIXI.NoiseFilter(0.1);
    
    this.app.stage.filters = this.app.stage.filters || [];
    this.app.stage.filters.push(colorMatrix, noiseFilter);
    
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Random color channel shifts
      colorMatrix.matrix[0] = 1 + (Math.random() - 0.5) * 0.5;
      colorMatrix.matrix[6] = 1 + (Math.random() - 0.5) * 0.5;
      colorMatrix.matrix[12] = 1 + (Math.random() - 0.5) * 0.5;
      
      noiseFilter.noise = Math.random() * 0.5;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove filters
        const colorIndex = this.app.stage.filters.indexOf(colorMatrix);
        const noiseIndex = this.app.stage.filters.indexOf(noiseFilter);
        if (colorIndex > -1) this.app.stage.filters.splice(colorIndex, 1);
        if (noiseIndex > -1) this.app.stage.filters.splice(noiseIndex, 1);
      }
    };
    
    animate();
  }
  
  // Flash effect for hits or pickups
  flashScreen(color: number = 0xffffff, duration: number = 200, alpha: number = 0.5): void {
    const flash = new PIXI.Graphics();
    flash.rect(0, 0, this.app.screen.width, this.app.screen.height);
    flash.fill({ color, alpha });
    
    this.app.stage.addChild(flash);
    
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      flash.alpha = alpha * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        flash.destroy();
      }
    };
    
    animate();
  }
}

class ScreenShake {
  private app: PIXI.Application;
  private shakeAmount: { x: number; y: number } = { x: 0, y: 0 };
  private shakeDecay: number = 0;
  private originalPosition: { x: number; y: number } = { x: 0, y: 0 };
  private isShaking: boolean = false;
  private direction: 'horizontal' | 'vertical' | 'both' = 'both';
  
  constructor(app: PIXI.Application) {
    this.app = app;
  }
  
  shake(options: ScreenShakeOptions): void {
    if (!this.isShaking) {
      this.originalPosition = {
        x: this.app.stage.x,
        y: this.app.stage.y
      };
    }
    
    this.isShaking = true;
    this.shakeAmount = {
      x: options.direction === 'vertical' ? 0 : options.intensity,
      y: options.direction === 'horizontal' ? 0 : options.intensity
    };
    this.shakeDecay = options.fadeOut !== false ? options.intensity / options.duration : 0;
    this.direction = options.direction || 'both';
    
    setTimeout(() => {
      this.stop();
    }, options.duration);
  }
  
  update(deltaTime: number): void {
    if (!this.isShaking) return;
    
    const shakeX = (Math.random() - 0.5) * 2 * this.shakeAmount.x;
    const shakeY = (Math.random() - 0.5) * 2 * this.shakeAmount.y;
    
    this.app.stage.x = this.originalPosition.x + shakeX;
    this.app.stage.y = this.originalPosition.y + shakeY;
    
    if (this.shakeDecay > 0) {
      this.shakeAmount.x = Math.max(0, this.shakeAmount.x - this.shakeDecay * deltaTime);
      this.shakeAmount.y = Math.max(0, this.shakeAmount.y - this.shakeDecay * deltaTime);
    }
  }
  
  stop(): void {
    this.isShaking = false;
    this.app.stage.x = this.originalPosition.x;
    this.app.stage.y = this.originalPosition.y;
  }
}

class TrailManager {
  private trails: Map<string, Trail> = new Map();
  private nextId: number = 0;
  
  createTrail(sprite: PIXI.Sprite, options: TrailEffectOptions, container: PIXI.Container): string {
    const id = `trail_${this.nextId++}`;
    const trail = new Trail(sprite, options, container);
    this.trails.set(id, trail);
    return id;
  }
  
  removeTrail(id: string): void {
    const trail = this.trails.get(id);
    if (trail) {
      trail.destroy();
      this.trails.delete(id);
    }
  }
  
  update(deltaTime: number): void {
    this.trails.forEach(trail => trail.update(deltaTime));
  }
}

class Trail {
  private sprite: PIXI.Sprite;
  private options: TrailEffectOptions;
  private container: PIXI.Container;
  private trailContainer: PIXI.Container;
  private trailSprites: { sprite: PIXI.Sprite; age: number }[] = [];
  private lastPosition: { x: number; y: number };
  
  constructor(sprite: PIXI.Sprite, options: TrailEffectOptions, container: PIXI.Container) {
    this.sprite = sprite;
    this.options = options;
    this.container = container;
    this.trailContainer = new PIXI.Container();
    container.addChildAt(this.trailContainer, 0);
    
    this.lastPosition = { x: sprite.x, y: sprite.y };
  }
  
  update(deltaTime: number): void {
    // Check if sprite moved
    const dx = this.sprite.x - this.lastPosition.x;
    const dy = this.sprite.y - this.lastPosition.y;
    const moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    
    if (moved) {
      // Create new trail sprite
      const trailSprite = new PIXI.Sprite(this.sprite.texture);
      trailSprite.x = this.sprite.x;
      trailSprite.y = this.sprite.y;
      trailSprite.scale = this.sprite.scale;
      trailSprite.rotation = this.sprite.rotation;
      trailSprite.anchor = this.sprite.anchor;
      trailSprite.alpha = this.options.alpha || 0.5;
      
      if (this.options.color !== undefined) {
        trailSprite.tint = this.options.color;
      }
      
      if (this.options.blur) {
        const blurFilter = new PIXI.BlurFilter({
          kernelSize: 5,
          quality: 2
        });
        trailSprite.filters = [blurFilter];
      }
      
      this.trailContainer.addChild(trailSprite);
      this.trailSprites.push({ sprite: trailSprite, age: 0 });
      
      this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
    }
    
    // Update existing trail sprites
    for (let i = this.trailSprites.length - 1; i >= 0; i--) {
      const trail = this.trailSprites[i];
      trail.age += deltaTime * this.options.fadeSpeed;
      
      if (trail.age >= 1) {
        trail.sprite.destroy();
        this.trailSprites.splice(i, 1);
      } else {
        trail.sprite.alpha = (this.options.alpha || 0.5) * (1 - trail.age);
      }
    }
    
    // Limit trail length
    while (this.trailSprites.length > this.options.length) {
      const oldest = this.trailSprites.shift();
      oldest?.sprite.destroy();
    }
  }
  
  destroy(): void {
    this.trailSprites.forEach(trail => trail.sprite.destroy());
    this.trailContainer.destroy();
  }
}

class FilterManager {
  private app: PIXI.Application;
  private activeFilters: Map<PIXI.DisplayObject, PIXI.Filter[]> = new Map();
  private animatedFilters: Map<PIXI.Filter, () => void> = new Map();
  
  constructor(app: PIXI.Application) {
    this.app = app;
  }
  
  applyFireEffect(target: PIXI.DisplayObject): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.brightness(1.3, false);
    colorMatrix.tint(0xff6600, true);
    
    this.addFilter(target, colorMatrix);
    
    // Animate the brightness
    const animate = () => {
      colorMatrix.brightness(1.3 + Math.sin(performance.now() * 0.003) * 0.2, false);
    };
    this.animatedFilters.set(colorMatrix, animate);
  }
  
  applyIceEffect(target: PIXI.DisplayObject): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.tint(0x88ccff, true);
    colorMatrix.contrast(1.3, false);
    
    this.addFilter(target, colorMatrix);
  }
  
  applyElectricEffect(target: PIXI.DisplayObject): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.brightness(1.5, false);
    colorMatrix.tint(0xffff00, true);
    
    this.addFilter(target, colorMatrix);
    
    // Add flickering effect
    const animate = () => {
      const flicker = Math.random() > 0.8;
      colorMatrix.brightness(flicker ? 2 : 1.3, false);
    };
    this.animatedFilters.set(colorMatrix, animate);
  }
  
  applyPoisonEffect(target: PIXI.DisplayObject): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.tint(0x88ff88, true);
    colorMatrix.saturate(1.5, false);
    
    this.addFilter(target, colorMatrix);
  }
  
  applyHolyEffect(target: PIXI.DisplayObject): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.brightness(1.8, false);
    colorMatrix.tint(0xffffaa, true);
    colorMatrix.contrast(1.2, false);
    
    this.addFilter(target, colorMatrix);
  }
  
  applyDarkEffect(target: PIXI.DisplayObject): void {
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.brightness(0.7, false);
    colorMatrix.tint(0x660066, true);
    colorMatrix.desaturate();
    
    this.addFilter(target, colorMatrix);
  }
  
  private addFilter(target: PIXI.DisplayObject, ...filters: PIXI.Filter[]): void {
    if (!target.filters) target.filters = [];
    target.filters.push(...filters);
    
    const existing = this.activeFilters.get(target) || [];
    this.activeFilters.set(target, [...existing, ...filters]);
  }
  
  removeEffects(target: PIXI.DisplayObject): void {
    const filters = this.activeFilters.get(target);
    if (filters && target.filters) {
      filters.forEach(filter => {
        const index = target.filters!.indexOf(filter);
        if (index > -1) {
          target.filters!.splice(index, 1);
        }
        this.animatedFilters.delete(filter);
      });
    }
    this.activeFilters.delete(target);
  }
  
  update(deltaTime: number): void {
    // Update animated filters
    this.animatedFilters.forEach(animate => animate());
  }
}