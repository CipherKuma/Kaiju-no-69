import * as PIXI from 'pixi.js';
import { BiomeType } from './TerritoryManager';

export interface EnvironmentConfig {
  worldWidth: number;
  worldHeight: number;
  enableParticles?: boolean;
}

export class EnvironmentSystem {
  private container: PIXI.Container;
  private config: EnvironmentConfig;
  private currentBiome: BiomeType = 'earth';
  
  // Day/Night system
  private dayNightOverlay: PIXI.Graphics;
  private currentTimeOfDay: number = 12; // 24-hour format
  private dayNightSpeed: number = 0.1; // Speed multiplier for day/night cycle
  private isMarketHours: boolean = true;
  
  // Weather system
  private weatherContainer: PIXI.Container;
  private weatherParticles: PIXI.Container;
  private currentWeather: 'clear' | 'rain' | 'storm' | 'fog' | 'snow' = 'clear';
  private weatherIntensity: number = 0;
  private volatilityLevel: number = 0.3; // 0-1 scale
  
  // Ambient effects
  private ambientContainer: PIXI.Container;
  private floatingElements: PIXI.Sprite[] = [];
  private fogLayer: PIXI.Graphics;

  constructor(worldContainer: PIXI.Container, config: EnvironmentConfig) {
    this.container = new PIXI.Container();
    this.config = config;
    worldContainer.addChild(this.container);
    
    // Set z-index to render above terrain but below characters
    this.container.zIndex = -500;
    
    this.setupDayNightSystem();
    this.setupWeatherSystem();
    this.setupAmbientEffects();
  }

  async initialize(): Promise<void> {
    this.updateDayNightCycle(0);
    this.updateWeather(0);
  }

  private setupDayNightSystem(): void {
    this.dayNightOverlay = new PIXI.Graphics();
    this.container.addChild(this.dayNightOverlay);
  }

  private setupWeatherSystem(): void {
    this.weatherContainer = new PIXI.Container();
    // Use regular Container instead of ParticleContainer to avoid API issues
    this.weatherParticles = new PIXI.Container();
    
    this.weatherContainer.addChild(this.weatherParticles);
    this.container.addChild(this.weatherContainer);
  }

  private setupAmbientEffects(): void {
    this.ambientContainer = new PIXI.Container();
    this.fogLayer = new PIXI.Graphics();
    
    this.ambientContainer.addChild(this.fogLayer);
    this.container.addChild(this.ambientContainer);
    
    this.createFloatingElements();
  }

  private createFloatingElements(): void {
    const elementCount = 20;
    
    for (let i = 0; i < elementCount; i++) {
      const element = this.createFloatingElement();
      if (element) {
        this.floatingElements.push(element);
        this.ambientContainer.addChild(element);
      }
    }
  }

  private createFloatingElement(): PIXI.Sprite | null {
    // Create procedural floating elements based on biome
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    
    ctx.globalAlpha = 0.4;
    
    switch (this.currentBiome) {
      case 'fire':
        // Floating embers
        const fireGradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        fireGradient.addColorStop(0, '#FF6B35');
        fireGradient.addColorStop(1, '#FF8E53');
        ctx.fillStyle = fireGradient;
        ctx.fillRect(0, 0, 16, 16);
        break;
        
      case 'water':
        // Water droplets
        ctx.fillStyle = '#4A90E2';
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'earth':
        // Floating leaves/dust
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(8, 8, 7, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'air':
        // Wind wisps
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, 8);
        ctx.quadraticCurveTo(8, 4, 14, 8);
        ctx.quadraticCurveTo(8, 12, 2, 8);
        ctx.stroke();
        break;
        
      default:
        return null;
    }
    
    const texture = PIXI.Texture.from(canvas);
    const sprite = new PIXI.Sprite(texture);
    
    sprite.x = Math.random() * this.config.worldWidth;
    sprite.y = Math.random() * this.config.worldHeight;
    sprite.alpha = 0.3 + Math.random() * 0.3;
    sprite.scale.set(0.5 + Math.random() * 0.5);
    
    return sprite;
  }

  setBiome(biome: BiomeType): void {
    this.currentBiome = biome;
    
    // Clear existing floating elements
    this.floatingElements.forEach(element => {
      this.ambientContainer.removeChild(element);
      element.destroy();
    });
    this.floatingElements = [];
    
    // Create new biome-appropriate elements
    this.createFloatingElements();
    
    // Update weather patterns based on biome
    this.updateWeatherForBiome();
  }

  private updateWeatherForBiome(): void {
    switch (this.currentBiome) {
      case 'fire':
        this.currentWeather = this.volatilityLevel > 0.7 ? 'storm' : 'clear';
        break;
      case 'water':
        this.currentWeather = this.volatilityLevel > 0.5 ? 'rain' : 'fog';
        break;
      case 'earth':
        this.currentWeather = this.volatilityLevel > 0.6 ? 'storm' : 'clear';
        break;
      case 'air':
        this.currentWeather = this.volatilityLevel > 0.4 ? 'fog' : 'clear';
        break;
    }
  }

  startDayNightCycle(): void {
    // Sync with market hours (assuming market opens at 9:30 AM ET)
    const now = new Date();
    const marketOpen = 9.5; // 9:30 AM
    const marketClose = 16; // 4:00 PM
    
    const currentHour = now.getHours() + now.getMinutes() / 60;
    this.currentTimeOfDay = currentHour;
    this.isMarketHours = currentHour >= marketOpen && currentHour <= marketClose;
  }

  startWeatherSystem(): void {
    this.updateWeatherForBiome();
  }

  setVolatility(level: number): void {
    this.volatilityLevel = Math.max(0, Math.min(1, level));
    this.weatherIntensity = this.volatilityLevel;
    this.updateWeatherForBiome();
  }

  private updateDayNightCycle(deltaTime: number): void {
    // Progress time based on delta (sped up for demonstration)
    this.currentTimeOfDay += (deltaTime * this.dayNightSpeed) / 1000;
    if (this.currentTimeOfDay >= 24) {
      this.currentTimeOfDay -= 24;
    }
    
    // Calculate lighting based on time of day
    const dayProgress = this.currentTimeOfDay / 24;
    const lightLevel = Math.sin(dayProgress * Math.PI * 2);
    
    // Create day/night overlay
    this.dayNightOverlay.clear();
    
    let overlayAlpha = 0;
    let overlayColor = 0x000000;
    
    if (lightLevel < 0) {
      // Night time
      overlayAlpha = Math.abs(lightLevel) * 0.6;
      overlayColor = 0x1a1a2e;
    } else if (lightLevel < 0.3) {
      // Dawn/dusk
      overlayAlpha = (0.3 - lightLevel) * 0.3;
      overlayColor = 0xFF6B35; // Orange tint
    }
    
    // Market hours affect lighting intensity
    if (!this.isMarketHours) {
      overlayAlpha += 0.2;
    }
    
    this.dayNightOverlay.beginFill(overlayColor, overlayAlpha);
    this.dayNightOverlay.drawRect(0, 0, this.config.worldWidth, this.config.worldHeight);
    this.dayNightOverlay.endFill();
  }

  private updateWeather(deltaTime: number): void {
    // Clear existing weather particles
    // Clear existing weather particles - use proper method for ParticleContainer
    this.weatherParticles.removeChildren();
    
    if (this.currentWeather === 'clear') return;
    
    const particleCount = Math.floor(this.weatherIntensity * 200);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createWeatherParticle();
      if (particle) {
        this.weatherParticles.addChild(particle);
      }
    }
  }

  private createWeatherParticle(): PIXI.Sprite | null {
    let texture: PIXI.Texture;
    
    // Create weather particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d')!;
    
    switch (this.currentWeather) {
      case 'rain':
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(1, 0, 2, 4);
        break;
        
      case 'storm':
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, 0, 4, 4);
        break;
        
      case 'fog':
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fillRect(0, 0, 4, 4);
        break;
        
      case 'snow':
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2, 2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      default:
        return null;
    }
    
    texture = PIXI.Texture.from(canvas);
    const sprite = new PIXI.Sprite(texture);
    
    sprite.x = Math.random() * this.config.worldWidth;
    sprite.y = Math.random() * this.config.worldHeight;
    sprite.alpha = 0.3 + Math.random() * 0.4;
    
    return sprite;
  }

  private updateFog(): void {
    if (this.currentWeather !== 'fog') {
      this.fogLayer.clear();
      return;
    }
    
    this.fogLayer.clear();
    
    const fogIntensity = this.weatherIntensity * 0.3;
    const time = Date.now() * 0.001;
    
    // Create animated fog effect
    for (let i = 0; i < 5; i++) {
      const x = (Math.sin(time * 0.5 + i) * 100) + this.config.worldWidth * (i / 5);
      const y = (Math.cos(time * 0.3 + i) * 50) + this.config.worldHeight * 0.5;
      const radius = 100 + Math.sin(time + i) * 20;
      
      this.fogLayer.beginFill(0xCCCCCC, fogIntensity);
      this.fogLayer.drawCircle(x, y, radius);
      this.fogLayer.endFill();
    }
  }

  private updateFloatingElements(deltaTime: number): void {
    this.floatingElements.forEach((element, index) => {
      // Floating motion
      const time = Date.now() * 0.001;
      const baseY = element.y;
      
      element.y = baseY + Math.sin(time + index) * 2;
      element.x += Math.cos(time * 0.5 + index) * 0.5;
      
      // Wrap around screen
      if (element.x > this.config.worldWidth) {
        element.x = -element.width;
      } else if (element.x < -element.width) {
        element.x = this.config.worldWidth;
      }
      
      if (element.y > this.config.worldHeight) {
        element.y = -element.height;
      } else if (element.y < -element.height) {
        element.y = this.config.worldHeight;
      }
      
      // Fade in and out
      element.alpha = 0.3 + Math.sin(time * 0.7 + index) * 0.2;
    });
  }

  update(deltaTime: number): void {
    this.updateDayNightCycle(deltaTime);
    this.updateWeather(deltaTime);
    this.updateFog();
    this.updateFloatingElements(deltaTime);
  }

  getCurrentTimeOfDay(): number {
    return this.currentTimeOfDay;
  }

  getWeather(): string {
    return this.currentWeather;
  }

  getVolatility(): number {
    return this.volatilityLevel;
  }

  isMarketOpen(): boolean {
    return this.isMarketHours;
  }

  destroy(): void {
    this.floatingElements.forEach(element => element.destroy());
    this.floatingElements = [];
    
    this.weatherParticles.destroy();
    this.container.destroy(true);
  }
}