import * as PIXI from 'pixi.js';

export interface ParticleConfig {
  texture: PIXI.Texture;
  lifetime: { min: number; max: number };
  speed: { min: number; max: number };
  scale: { start: number; end: number };
  alpha: { start: number; end: number };
  rotation: { min: number; max: number };
  emission: {
    rate: number;
    burst?: number;
  };
  gravity?: number;
  wind?: { x: number; y: number };
  color?: {
    start: number;
    end: number;
  };
}

export class Particle extends PIXI.Sprite {
  public velocity: { x: number; y: number } = { x: 0, y: 0 };
  public lifetime: number = 0;
  public maxLifetime: number = 0;
  public startScale: number = 1;
  public endScale: number = 1;
  public startAlpha: number = 1;
  public endAlpha: number = 0;
  public rotationSpeed: number = 0;
  public startColor?: number;
  public endColor?: number;

  update(delta: number, gravity: number = 0, wind?: { x: number; y: number }): boolean {
    this.lifetime += delta;
    
    if (this.lifetime >= this.maxLifetime) {
      return false;
    }

    const progress = this.lifetime / this.maxLifetime;

    this.velocity.y += gravity * delta;
    if (wind) {
      this.velocity.x += wind.x * delta;
      this.velocity.y += wind.y * delta;
    }

    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.rotation += this.rotationSpeed * delta;

    const scale = this.lerp(this.startScale, this.endScale, progress);
    this.scale.set(scale);

    this.alpha = this.lerp(this.startAlpha, this.endAlpha, progress);

    if (this.startColor !== undefined && this.endColor !== undefined) {
      this.tint = this.lerpColor(this.startColor, this.endColor, progress);
    }

    return true;
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private lerpColor(start: number, end: number, t: number): number {
    const r1 = (start >> 16) & 0xff;
    const g1 = (start >> 8) & 0xff;
    const b1 = start & 0xff;

    const r2 = (end >> 16) & 0xff;
    const g2 = (end >> 8) & 0xff;
    const b2 = end & 0xff;

    const r = Math.round(this.lerp(r1, r2, t));
    const g = Math.round(this.lerp(g1, g2, t));
    const b = Math.round(this.lerp(b1, b2, t));

    return (r << 16) | (g << 8) | b;
  }
}

export class ParticleEmitter extends PIXI.Container {
  private config: ParticleConfig;
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private emissionTimer: number = 0;
  private active: boolean = false;
  private position: { x: number; y: number } = { x: 0, y: 0 };

  constructor(config: ParticleConfig) {
    super();
    this.config = config;
  }

  start(): void {
    this.active = true;
    
    if (this.config.emission.burst) {
      for (let i = 0; i < this.config.emission.burst; i++) {
        this.emitParticle();
      }
    }
  }

  stop(): void {
    this.active = false;
  }

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  private emitParticle(): void {
    let particle = this.particlePool.pop();
    
    if (!particle) {
      particle = new Particle(this.config.texture);
    }

    particle.x = this.position.x;
    particle.y = this.position.y;

    const angle = Math.random() * Math.PI * 2;
    const speed = this.random(this.config.speed.min, this.config.speed.max);
    particle.velocity.x = Math.cos(angle) * speed;
    particle.velocity.y = Math.sin(angle) * speed;

    particle.lifetime = 0;
    particle.maxLifetime = this.random(this.config.lifetime.min, this.config.lifetime.max);
    
    particle.startScale = this.config.scale.start;
    particle.endScale = this.config.scale.end;
    particle.scale.set(particle.startScale);

    particle.startAlpha = this.config.alpha.start;
    particle.endAlpha = this.config.alpha.end;
    particle.alpha = particle.startAlpha;

    particle.rotationSpeed = this.random(this.config.rotation.min, this.config.rotation.max);
    particle.rotation = Math.random() * Math.PI * 2;

    if (this.config.color) {
      particle.startColor = this.config.color.start;
      particle.endColor = this.config.color.end;
      particle.tint = particle.startColor;
    }

    this.particles.push(particle);
    this.addChild(particle);
  }

  update(delta: number): void {
    if (this.active && this.config.emission.rate > 0) {
      this.emissionTimer += delta;
      const emissionInterval = 1 / this.config.emission.rate;
      
      while (this.emissionTimer >= emissionInterval) {
        this.emitParticle();
        this.emissionTimer -= emissionInterval;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (!particle.update(delta, this.config.gravity, this.config.wind)) {
        this.removeChild(particle);
        this.particles.splice(i, 1);
        this.particlePool.push(particle);
      }
    }
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  destroy(): void {
    this.particles.forEach(particle => particle.destroy());
    this.particlePool.forEach(particle => particle.destroy());
    this.particles = [];
    this.particlePool = [];
    super.destroy(true);
  }
}

export class ParticleEffects {
  static createFireEffect(texture: PIXI.Texture): ParticleEmitter {
    return new ParticleEmitter({
      texture,
      lifetime: { min: 0.5, max: 1.5 },
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 1, end: 0 },
      rotation: { min: -0.1, max: 0.1 },
      emission: { rate: 20 },
      gravity: -50,
      color: {
        start: 0xff6600,
        end: 0xffff00,
      },
    });
  }

  static createSmokeEffect(texture: PIXI.Texture): ParticleEmitter {
    return new ParticleEmitter({
      texture,
      lifetime: { min: 1, max: 2 },
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 1.5 },
      alpha: { start: 0.6, end: 0 },
      rotation: { min: -0.05, max: 0.05 },
      emission: { rate: 10 },
      gravity: -20,
      wind: { x: 10, y: 0 },
      color: {
        start: 0x666666,
        end: 0x333333,
      },
    });
  }

  static createSparkleEffect(texture: PIXI.Texture): ParticleEmitter {
    return new ParticleEmitter({
      texture,
      lifetime: { min: 0.5, max: 1 },
      speed: { min: 50, max: 100 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      rotation: { min: -0.2, max: 0.2 },
      emission: { rate: 0, burst: 20 },
    });
  }

  static createTrailEffect(texture: PIXI.Texture): ParticleEmitter {
    return new ParticleEmitter({
      texture,
      lifetime: { min: 0.3, max: 0.5 },
      speed: { min: 0, max: 10 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.8, end: 0 },
      rotation: { min: 0, max: 0 },
      emission: { rate: 30 },
    });
  }

  static createExplosionEffect(texture: PIXI.Texture): ParticleEmitter {
    return new ParticleEmitter({
      texture,
      lifetime: { min: 0.5, max: 1 },
      speed: { min: 100, max: 300 },
      scale: { start: 1.5, end: 0.5 },
      alpha: { start: 1, end: 0 },
      rotation: { min: -0.3, max: 0.3 },
      emission: { rate: 0, burst: 50 },
      gravity: 200,
      color: {
        start: 0xffff00,
        end: 0xff0000,
      },
    });
  }
}