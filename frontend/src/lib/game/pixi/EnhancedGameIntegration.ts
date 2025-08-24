import * as PIXI from 'pixi.js';
import { ParticleManager, AdvancedParticleEffects } from './AdvancedParticleEffects';
import { AdvancedAudioSystem } from './AdvancedAudioSystem';
import { AdvancedCollisionSystem, InteractiveZone, TerrainObstacle } from './AdvancedCollisionSystem';
import { VisualEffectsManager } from './VisualEffects';
import { GameEventsSystem } from './GameEventsSystem';

export class EnhancedGameManager {
  private app: PIXI.Application;
  private particleManager: ParticleManager;
  private audioSystem: AdvancedAudioSystem;
  private collisionSystem: AdvancedCollisionSystem;
  private visualEffects: VisualEffectsManager;
  private gameEvents: GameEventsSystem;
  
  constructor(app: PIXI.Application) {
    this.app = app;
    
    // Initialize all enhanced systems
    this.particleManager = ParticleManager.getInstance(app.stage);
    this.audioSystem = AdvancedAudioSystem.getAdvancedInstance();
    this.collisionSystem = new AdvancedCollisionSystem(
      new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height)
    );
    this.visualEffects = VisualEffectsManager.getInstance(app);
    this.gameEvents = GameEventsSystem.getInstance(app);
    
    // Set up collision layers
    this.setupCollisionLayers();
    
    // Preload assets
    this.preloadAssets();
  }
  
  private setupCollisionLayers(): void {
    // Create collision layers
    this.collisionSystem.createLayer('kaiju', ['kaiju', 'obstacles', 'triggers']);
    this.collisionSystem.createLayer('obstacles', ['kaiju']);
    this.collisionSystem.createLayer('triggers', ['kaiju']);
    this.collisionSystem.createLayer('shadows', ['shadows']);
  }
  
  private async preloadAssets(): Promise<void> {
    // Preload audio
    await this.audioSystem.preloadAdvancedSounds();
    await this.audioSystem.preloadGameSounds();
    await this.audioSystem.preloadMusic();
    
    // Load particle textures
    await this.loadParticleTextures();
  }
  
  private async loadParticleTextures(): Promise<void> {
    const textures = [
      '/assets/particles/star.png',
      '/assets/particles/smoke.png',
      '/assets/particles/spark.png',
      '/assets/particles/glow.png',
      '/assets/particles/confetti.png',
      '/assets/particles/leaf.png',
      '/assets/particles/snowflake.png'
    ];
    
    for (const url of textures) {
      await PIXI.Assets.load(url);
    }
  }
  
  // Example: Create a Kaiju with all enhanced features
  createEnhancedKaiju(id: string, position: { x: number; y: number }): EnhancedKaiju {
    const kaiju = new EnhancedKaiju(id, this);
    kaiju.position.set(position.x, position.y);
    
    // Add magical aura particle effect
    const auraEffect = AdvancedParticleEffects.createKaijuAuraEffect(
      PIXI.Texture.from('/assets/particles/glow.png'),
      0x9400d3 // Purple aura
    );
    this.particleManager.createEffect(`${id}_aura`, auraEffect, position);
    
    // Add shadow collision
    this.collisionSystem.addAdvancedObject(kaiju, 'kaiju');
    
    // Add movement trail
    const trailId = this.visualEffects.createTrail(kaiju.sprite, {
      length: 10,
      fadeSpeed: 2,
      color: 0x9400d3,
      alpha: 0.3
    });
    kaiju.trailId = trailId;
    
    return kaiju;
  }
  
  // Example: Execute a trade with full effects
  executeTradeWithEffects(
    kaiju: EnhancedKaiju,
    tradeSize: 'small' | 'medium' | 'large',
    profit: number
  ): void {
    // Play trade execution sound
    this.audioSystem.playTradeExecutionSound(tradeSize);
    
    // Create trade burst particle effect
    const burstEffect = AdvancedParticleEffects.createTradeBurstEffect(
      PIXI.Texture.from('/assets/particles/star.png')
    );
    this.particleManager.createEffect(
      `trade_burst_${Date.now()}`,
      burstEffect,
      kaiju.position
    );
    
    // Apply visual effect based on trade size
    if (tradeSize === 'large') {
      this.visualEffects.shakeScreen({
        intensity: 10,
        duration: 500,
        direction: 'both'
      });
      this.visualEffects.createShockwave(kaiju.position, 200);
    }
    
    // Play profit/loss sound
    this.audioSystem.playTradeResultSound(profit > 0);
    
    // Trigger celebration for big trades
    if (profit > 1000000) {
      this.gameEvents.triggerCelebration('big_trade_success', { value: profit });
    }
    
    // Show trade notification
    this.gameEvents.showNotification({
      id: `trade_${Date.now()}`,
      message: `Trade executed! ${profit > 0 ? 'Profit' : 'Loss'}: $${Math.abs(profit).toLocaleString()}`,
      type: profit > 0 ? 'success' : 'warning',
      duration: 3000,
      position: 'bottom'
    });
  }
  
  // Example: Switch biome with full environmental effects
  switchBiome(biome: string): void {
    // Switch audio ambience
    this.audioSystem.switchBiome(biome);
    
    // Clear existing environmental particles
    this.particleManager.clearAll();
    
    // Add biome-specific particles
    switch (biome) {
      case 'forest':
        // Add fireflies
        const firefliesEffect = AdvancedParticleEffects.createFirefliesEffect(
          PIXI.Texture.from('/assets/particles/glow.png')
        );
        this.particleManager.createEffect('fireflies', firefliesEffect, { x: 0, y: 0 });
        break;
        
      case 'arctic':
        // Add snow
        const snowEffect = AdvancedParticleEffects.createSnowEffect(
          PIXI.Texture.from('/assets/particles/snowflake.png')
        );
        this.particleManager.createEffect('snow', snowEffect, { x: 400, y: -50 });
        break;
    }
    
    // Apply biome-specific visual filters
    switch (biome) {
      case 'desert':
        // Add heat shimmer effect
        const colorMatrix = new PIXI.ColorMatrixFilter();
        colorMatrix.brightness(1.1, false);
        colorMatrix.contrast(1.2, false);
        this.app.stage.filters = [colorMatrix];
        break;
        
      case 'arctic':
        // Add cold blue tint
        const coldMatrix = new PIXI.ColorMatrixFilter();
        coldMatrix.tint(0xccddff, true);
        this.app.stage.filters = [coldMatrix];
        break;
    }
  }
  
  // Example: Create interactive zones
  createTradingZone(position: { x: number; y: number }, size: { width: number; height: number }): void {
    const zone: InteractiveZone = {
      id: 'trading_zone',
      shape: { type: 'rectangle', width: size.width, height: size.height },
      position,
      onEnter: (entity) => {
        // Apply trading boost
        this.visualEffects.addBloom(entity as any, 1.2, 0.5);
        this.audioSystem.playUISound('success');
      },
      onExit: (entity) => {
        // Remove trading boost
        this.visualEffects.removeAbilityEffect(entity as any);
      },
      onStay: (entity, deltaTime) => {
        // Continuous trading bonus
      },
      isActive: true
    };
    
    this.collisionSystem.addInteractiveZone(zone);
  }
  
  // Example: Add terrain obstacles
  addLavaPool(position: { x: number; y: number }): void {
    const obstacle: TerrainObstacle = {
      id: `lava_${Date.now()}`,
      shape: { type: 'circle', radius: 50 },
      position,
      isPassable: true,
      terrainType: 'lava',
      damage: 10
    };
    
    this.collisionSystem.addTerrainObstacle(obstacle);
    
    // Add lava particle effect
    const lavaEffect = AdvancedParticleEffects.createFireEffect(
      PIXI.Texture.from('/assets/particles/spark.png')
    );
    this.particleManager.createEffect(`lava_effect_${obstacle.id}`, lavaEffect, position);
  }
  
  update(deltaTime: number): void {
    // Update all systems
    this.particleManager.update(deltaTime);
    this.audioSystem.update(deltaTime);
    this.collisionSystem.update(deltaTime);
    this.visualEffects.update(deltaTime);
    this.gameEvents.update(deltaTime);
    
    // Performance monitoring
    const particleCount = this.particleManager.getParticleCount();
    if (particleCount > 800) {
      console.warn(`High particle count: ${particleCount}`);
    }
  }
}

// Example enhanced Kaiju class
class EnhancedKaiju implements PIXI.DisplayObject {
  id: string;
  sprite: PIXI.Sprite;
  position: PIXI.Point;
  trailId?: string;
  private gameManager: EnhancedGameManager;
  
  // PIXI.DisplayObject properties
  transform: PIXI.Transform = new PIXI.Transform();
  alpha: number = 1;
  visible: boolean = true;
  renderable: boolean = true;
  parent: PIXI.Container | null = null;
  worldAlpha: number = 1;
  filterArea: PIXI.Rectangle | null = null;
  filters: PIXI.Filter[] | null = null;
  isSprite: boolean = false;
  isMask: boolean = false;
  _bounds: PIXI.Bounds = new PIXI.Bounds();
  _mask: PIXI.Container | PIXI.MaskData | null = null;
  destroyed: boolean = false;
  
  constructor(id: string, gameManager: EnhancedGameManager) {
    this.id = id;
    this.gameManager = gameManager;
    this.sprite = new PIXI.Sprite();
    this.position = new PIXI.Point();
  }
  
  // Implement required methods
  destroy(_options?: any): void {
    this.destroyed = true;
    if (this.trailId) {
      this.gameManager['visualEffects'].removeTrail(this.trailId);
    }
    this.sprite.destroy();
  }
  
  render(_renderer: PIXI.Renderer): void {
    // Rendering handled by sprite
  }
  
  removeChild(..._children: PIXI.DisplayObject[]): PIXI.DisplayObject[] {
    return [];
  }
  
  // Collision implementation
  getBounds(): PIXI.Rectangle {
    return new PIXI.Rectangle(
      this.position.x - 25,
      this.position.y - 25,
      50,
      50
    );
  }
  
  getCollisionShape() {
    return {
      type: 'shadow' as const,
      baseWidth: 40,
      baseHeight: 20,
      shadowScale: 1
    };
  }
  
  onCollision(other: any): void {
    // Handle collision
    this.gameManager['visualEffects'].flashScreen(0xff0000, 200, 0.3);
  }
  
  // Special abilities
  activateAbility(abilityType: string): void {
    this.gameManager['visualEffects'].applyAbilityEffect(this.sprite, abilityType);
    this.gameManager['audioSystem'].play(`ability-${abilityType}`, { volume: 0.6 });
  }
}

// Usage example in your game
export function setupEnhancedGame(app: PIXI.Application): EnhancedGameManager {
  const gameManager = new EnhancedGameManager(app);
  
  // Create some Kaiju
  const kaiju1 = gameManager.createEnhancedKaiju('kaiju_1', { x: 100, y: 100 });
  const kaiju2 = gameManager.createEnhancedKaiju('kaiju_2', { x: 300, y: 200 });
  
  // Set up biome
  gameManager.switchBiome('forest');
  
  // Create interactive zones
  gameManager.createTradingZone({ x: 200, y: 150 }, { width: 200, height: 200 });
  
  // Add terrain obstacles
  gameManager.addLavaPool({ x: 400, y: 300 });
  
  // Game loop
  app.ticker.add((ticker) => {
    gameManager.update(ticker.deltaMS);
  });
  
  return gameManager;
}