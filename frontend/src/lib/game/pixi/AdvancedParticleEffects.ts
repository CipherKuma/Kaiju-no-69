import * as PIXI from 'pixi.js';
import { ParticleEmitter, ParticleConfig } from './ParticleSystem';

export interface EnhancedParticleConfig extends ParticleConfig {
  blendMode?: PIXI.BLEND_MODES;
  emissionShape?: {
    type: 'circle' | 'rectangle' | 'ring';
    radius?: number;
    width?: number;
    height?: number;
    innerRadius?: number;
  };
  angleSpread?: number;
  velocityVariance?: { x: number; y: number };
  scaleVariance?: number;
  turbulence?: { strength: number; frequency: number };
}

export class AdvancedParticleEmitter extends ParticleEmitter {
  private enhancedConfig: EnhancedParticleConfig;
  
  constructor(config: EnhancedParticleConfig) {
    super(config);
    this.enhancedConfig = config;
    if (config.blendMode) {
      this.blendMode = config.blendMode;
    }
  }
  
  protected emitParticle(): void {
    const particle = super['emitParticle']();
    
    if (this.enhancedConfig.emissionShape) {
      const shape = this.enhancedConfig.emissionShape;
      let offsetX = 0, offsetY = 0;
      
      switch (shape.type) {
        case 'circle':
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * (shape.radius || 50);
          offsetX = Math.cos(angle) * radius;
          offsetY = Math.sin(angle) * radius;
          break;
          
        case 'rectangle':
          offsetX = (Math.random() - 0.5) * (shape.width || 100);
          offsetY = (Math.random() - 0.5) * (shape.height || 100);
          break;
          
        case 'ring':
          const ringAngle = Math.random() * Math.PI * 2;
          const ringRadius = (shape.innerRadius || 30) + Math.random() * ((shape.radius || 50) - (shape.innerRadius || 30));
          offsetX = Math.cos(ringAngle) * ringRadius;
          offsetY = Math.sin(ringAngle) * ringRadius;
          break;
      }
      
      if (particle) {
        particle.x += offsetX;
        particle.y += offsetY;
      }
    }
  }
}

export class AdvancedParticleEffects {
  // Trade execution burst effect
  static createTradeBurstEffect(texture: PIXI.Texture): AdvancedParticleEmitter {
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 0.3, max: 0.8 },
      speed: { min: 200, max: 400 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      rotation: { min: -0.5, max: 0.5 },
      emission: { rate: 0, burst: 30 },
      blendMode: PIXI.BLEND_MODES.ADD,
      emissionShape: {
        type: 'circle',
        radius: 10
      },
      color: {
        start: 0x00ff00, // Green for successful trades
        end: 0x00ffff,
      },
    });
  }
  
  // Magical aura effect for Kaiju
  static createKaijuAuraEffect(texture: PIXI.Texture, color: number = 0x9400d3): AdvancedParticleEmitter {
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 1, max: 2 },
      speed: { min: 10, max: 30 },
      scale: { start: 0.3, end: 0.8 },
      alpha: { start: 0.6, end: 0 },
      rotation: { min: -0.1, max: 0.1 },
      emission: { rate: 15 },
      gravity: -30,
      blendMode: PIXI.BLEND_MODES.SCREEN,
      emissionShape: {
        type: 'ring',
        innerRadius: 40,
        radius: 60
      },
      color: {
        start: color,
        end: color,
      },
    });
  }
  
  // Environmental fireflies effect
  static createFirefliesEffect(texture: PIXI.Texture): AdvancedParticleEmitter {
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 5, max: 10 },
      speed: { min: 5, max: 20 },
      scale: { start: 0.1, end: 0.2 },
      alpha: { start: 0, end: 0 },
      rotation: { min: 0, max: 0 },
      emission: { rate: 2 },
      blendMode: PIXI.BLEND_MODES.ADD,
      emissionShape: {
        type: 'rectangle',
        width: 800,
        height: 600
      },
      color: {
        start: 0xffff66,
        end: 0xffffcc,
      },
    });
  }
  
  // Snow effect
  static createSnowEffect(texture: PIXI.Texture): AdvancedParticleEmitter {
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 5, max: 8 },
      speed: { min: 20, max: 50 },
      scale: { start: 0.3, end: 0.5 },
      alpha: { start: 0.8, end: 0.3 },
      rotation: { min: -0.02, max: 0.02 },
      emission: { rate: 20 },
      gravity: 30,
      wind: { x: 20, y: 5 },
      emissionShape: {
        type: 'rectangle',
        width: 1000,
        height: 10
      },
    });
  }
  
  // Damage/impact particles
  static createImpactEffect(texture: PIXI.Texture, severity: 'light' | 'medium' | 'heavy' = 'medium'): AdvancedParticleEmitter {
    const configs = {
      light: {
        burst: 15,
        speed: { min: 50, max: 150 },
        scale: { start: 0.5, end: 0.1 },
        color: { start: 0xffff00, end: 0xff6600 }
      },
      medium: {
        burst: 30,
        speed: { min: 100, max: 250 },
        scale: { start: 0.8, end: 0.2 },
        color: { start: 0xff6600, end: 0xff0000 }
      },
      heavy: {
        burst: 50,
        speed: { min: 150, max: 350 },
        scale: { start: 1.2, end: 0.3 },
        color: { start: 0xff0000, end: 0x660000 }
      }
    };
    
    const config = configs[severity];
    
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 0.3, max: 0.8 },
      speed: config.speed,
      scale: config.scale,
      alpha: { start: 1, end: 0 },
      rotation: { min: -0.5, max: 0.5 },
      emission: { rate: 0, burst: config.burst },
      gravity: 200,
      blendMode: PIXI.BLEND_MODES.ADD,
      emissionShape: {
        type: 'circle',
        radius: 20
      },
      color: config.color,
    });
  }
  
  // Territory celebration effect
  static createCelebrationEffect(texture: PIXI.Texture): AdvancedParticleEmitter {
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 2, max: 4 },
      speed: { min: 100, max: 300 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 1, end: 0 },
      rotation: { min: -0.3, max: 0.3 },
      emission: { rate: 0, burst: 100 },
      gravity: 150,
      blendMode: PIXI.BLEND_MODES.NORMAL,
      emissionShape: {
        type: 'rectangle',
        width: 400,
        height: 50
      },
      color: {
        start: Math.random() > 0.5 ? 0xff0000 : (Math.random() > 0.5 ? 0x00ff00 : 0x0000ff),
        end: 0xffffff,
      },
    });
  }
  
  // Magical portal effect
  static createPortalEffect(texture: PIXI.Texture): AdvancedParticleEmitter {
    return new AdvancedParticleEmitter({
      texture,
      lifetime: { min: 1, max: 2 },
      speed: { min: 0, max: 50 },
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      rotation: { min: -0.2, max: 0.2 },
      emission: { rate: 50 },
      blendMode: PIXI.BLEND_MODES.ADD,
      emissionShape: {
        type: 'ring',
        innerRadius: 30,
        radius: 40
      },
      color: {
        start: 0x9932cc,
        end: 0x4b0082,
      },
    });
  }
}

// Particle Manager for performance optimization
export class ParticleManager {
  private static instance: ParticleManager;
  private activeEmitters: Map<string, AdvancedParticleEmitter> = new Map();
  private particleContainer: PIXI.Container;
  private maxParticles: number = 1000;
  private currentParticleCount: number = 0;
  
  constructor(container: PIXI.Container) {
    this.particleContainer = container;
  }
  
  static getInstance(container?: PIXI.Container): ParticleManager {
    if (!ParticleManager.instance && container) {
      ParticleManager.instance = new ParticleManager(container);
    }
    return ParticleManager.instance;
  }
  
  createEffect(id: string, effect: AdvancedParticleEmitter, position: { x: number; y: number }): void {
    if (this.currentParticleCount >= this.maxParticles) {
      console.warn('Particle limit reached, skipping effect');
      return;
    }
    
    if (this.activeEmitters.has(id)) {
      this.removeEffect(id);
    }
    
    effect.setPosition(position.x, position.y);
    this.particleContainer.addChild(effect);
    this.activeEmitters.set(id, effect);
    effect.start();
  }
  
  updateEffectPosition(id: string, position: { x: number; y: number }): void {
    const effect = this.activeEmitters.get(id);
    if (effect) {
      effect.setPosition(position.x, position.y);
    }
  }
  
  removeEffect(id: string): void {
    const effect = this.activeEmitters.get(id);
    if (effect) {
      effect.stop();
      this.particleContainer.removeChild(effect);
      effect.destroy();
      this.activeEmitters.delete(id);
    }
  }
  
  update(delta: number): void {
    this.currentParticleCount = 0;
    
    this.activeEmitters.forEach((emitter) => {
      emitter.update(delta);
      this.currentParticleCount += emitter.children.length;
    });
  }
  
  clearAll(): void {
    this.activeEmitters.forEach((effect, id) => {
      this.removeEffect(id);
    });
  }
  
  getParticleCount(): number {
    return this.currentParticleCount;
  }
}