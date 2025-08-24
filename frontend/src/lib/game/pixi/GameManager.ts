import * as PIXI from 'pixi.js';
import { EventEmitter } from 'events';
import { AssetLoader } from './AssetLoader';
import { AudioManager } from './AudioManager';
import { Camera } from './Camera';
import { CollisionSystem } from './CollisionSystem';
import { TouchControls, GestureEvent } from './TouchControls';
import { ParticleEmitter, ParticleEffects } from './ParticleSystem';
import { KaijuSprite } from './KaijuSprite';
import { AnimationManager } from './AnimationManager';

export interface GameConfig {
  worldWidth: number;
  worldHeight: number;
  enableAudio?: boolean;
  enableTouch?: boolean;
  enableParticles?: boolean;
  debugMode?: boolean;
}

export class GameManager {
  protected app: PIXI.Application;
  protected world: PIXI.Container;
  protected ui: PIXI.Container;
  protected camera: Camera;
  protected collisionSystem: CollisionSystem;
  protected touchControls?: TouchControls;
  protected assetLoader: AssetLoader;
  protected audioManager: AudioManager;
  protected animationManager: AnimationManager;
  private particleEmitters: Map<string, ParticleEmitter> = new Map();
  private kaijuSprites: Map<string, KaijuSprite> = new Map();
  private config: GameConfig;
  private isInitialized: boolean = false;
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor(app: PIXI.Application, config: GameConfig) {
    this.app = app;
    this.config = config;

    this.world = new PIXI.Container();
    this.ui = new PIXI.Container();

    this.app.stage.addChild(this.world);
    this.app.stage.addChild(this.ui);

    this.camera = new Camera(this.app, this.world, {
      worldWidth: config.worldWidth,
      worldHeight: config.worldHeight,
      viewportWidth: this.app.canvas.width,
      viewportHeight: this.app.canvas.height,
      smoothing: 0.1,
    });
    
    // Set initial zoom to show more of the world
    this.camera.setZoom(0.8, true);

    this.collisionSystem = new CollisionSystem();
    this.assetLoader = AssetLoader.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.animationManager = AnimationManager.getInstance();

    if (config.enableTouch) {
      this.setupTouchControls();
    }

    if (config.debugMode) {
      this.collisionSystem.enableDebug(this.app);
    }

    this.setupCollisionLayers();
    this.setupGameLoop();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadAssets();

    if (this.config.enableAudio) {
      await this.audioManager.preloadGameSounds();
      await this.audioManager.preloadMusic();
    }

    this.isInitialized = true;
  }

  private async loadAssets(): Promise<void> {
    await this.assetLoader.preloadKaijuAssets([
      '1',
      '2',
      '3',
    ]);

    if (this.config.enableParticles) {
      await this.assetLoader.preloadEffects();
    }
  }

  private setupTouchControls(): void {
    this.touchControls = new TouchControls(this.app);
    
    this.touchControls.on('gesture', (event: GestureEvent) => {
      this.handleGesture(event);
    });

    // Zoom functionality disabled
    // this.touchControls.on('zoom', (event: GestureEvent) => {
    //   if (event.data?.delta) {
    //     this.camera.zoomIn(event.data.delta);
    //   }
    // });
  }

  private handleGesture(event: GestureEvent): void {
    switch (event.type) {
      case 'tap':
        this.handleTap(event.position);
        break;
      case 'double-tap':
        this.handleDoubleTap(event.position);
        break;
      case 'long-press':
        this.handleLongPress(event.position);
        break;
      case 'pan':
        this.handlePan(event.data);
        break;
      case 'pinch':
        // Pinch zoom disabled
        // this.handlePinch(event.data);
        break;
      case 'swipe':
        this.handleSwipe(event.data);
        break;
    }
  }

  private handleTap(position: { x: number; y: number }): void {
    const worldPos = this.camera.screenToWorld(position.x, position.y);
    this.emit('tap', worldPos);
    
    if (this.config.enableAudio) {
      this.audioManager.playButtonClick();
    }
  }

  private handleDoubleTap(position: { x: number; y: number }): void {
    const worldPos = this.camera.screenToWorld(position.x, position.y);
    this.camera.moveTo(worldPos.x, worldPos.y);
    this.emit('double-tap', worldPos);
  }

  private handleLongPress(position: { x: number; y: number }): void {
    const worldPos = this.camera.screenToWorld(position.x, position.y);
    this.emit('long-press', worldPos);
  }

  private handlePan(data: { delta: { x: number; y: number } }): void {
    const deltaX = -data.delta.x / this.camera.getZoom();
    const deltaY = -data.delta.y / this.camera.getZoom();
    
    const currentPos = this.camera.getPosition();
    this.camera.moveTo(currentPos.x + deltaX, currentPos.y + deltaY);
  }

  private handlePinch(data: { scale: number }): void {
    const scaleDelta = (data.scale - 1) * 0.1;
    this.camera.zoomIn(scaleDelta);
  }

  private handleSwipe(data: { direction: string; velocity: { x: number; y: number } }): void {
    this.emit('swipe', { direction: data.direction, velocity: data.velocity });
  }

  private setupCollisionLayers(): void {
    this.collisionSystem.createLayer('kaiju', ['environment', 'other-kaiju']);
    this.collisionSystem.createLayer('environment', ['kaiju']);
    this.collisionSystem.createLayer('other-kaiju', ['kaiju']);
    this.collisionSystem.createLayer('effects', []);
  }

  private setupGameLoop(): void {
    this.app.ticker.add((delta) => {
      this.update(delta.deltaTime);
    });
  }

  private update(deltaTime: number): void {
    this.camera.update(deltaTime);
    this.collisionSystem.update();
    
    this.kaijuSprites.forEach(kaiju => {
      kaiju.update(deltaTime);
    });

    this.particleEmitters.forEach(emitter => {
      emitter.update(deltaTime);
    });
  }

  createKaiju(id: string, position: { x: number; y: number }): KaijuSprite {
    // Map kaiju ID to available assets (1, 2, or 3)
    const kaijuNumber = ((parseInt(id) || id.charCodeAt(0)) % 3) + 1;
    const textureKey = `kaiju-${kaijuNumber}`;
    
    // Try to get the loaded texture
    const texture = this.assetLoader.getAsset(textureKey) as PIXI.Texture;
    
    const kaiju = new KaijuSprite({
      id,
      position,
      scale: 0.08,
      usePixelArt: false, // Use actual loaded textures
      texture: texture || undefined,
      renderer: this.app.renderer,
    });

    // Verify kaiju was created properly before adding to world
    if (!kaiju || kaiju.children.length === 0) {
      console.error('KaijuSprite was not created properly:', id);
      // Create a fallback sprite to prevent null errors
      const fallback = new PIXI.Container();
      const placeholder = new PIXI.Graphics();
      placeholder.beginFill(0xff0000);
      placeholder.drawCircle(0, 0, 25);
      placeholder.endFill();
      fallback.addChild(placeholder);
      fallback.position.set(position.x, position.y);
      this.world.addChild(fallback);
      return kaiju;
    }

    // Safely add the kaiju to the world
    try {
      if (kaiju && this.world) {
        this.world.addChild(kaiju);
        this.kaijuSprites.set(id, kaiju);
        
        // Only add to collision system if bounds are valid
        try {
          const bounds = kaiju.getBounds();
          if (bounds && bounds.width > 0 && bounds.height > 0) {
            this.collisionSystem.addObject(kaiju, 'kaiju');
          }
        } catch (e) {
          console.warn('Could not add kaiju to collision system:', e);
        }
      }
    } catch (error) {
      console.error('Failed to add kaiju to world:', error);
    }

    if (this.config.enableAudio) {
      this.audioManager.playKaijuSound('spawn');
    }

    return kaiju;
  }

  removeKaiju(id: string): void {
    const kaiju = this.kaijuSprites.get(id);
    if (kaiju) {
      this.world.removeChild(kaiju);
      this.collisionSystem.removeObject(kaiju, 'kaiju');
      this.kaijuSprites.delete(id);
      kaiju.destroy();
    }
  }

  createParticleEffect(
    id: string,
    type: 'fire' | 'smoke' | 'sparkle' | 'trail' | 'explosion',
    position: { x: number; y: number }
  ): ParticleEmitter | null {
    if (!this.config.enableParticles) return null;

    const texture = this.assetLoader.getAsset(`particle-${type}`);
    if (!texture) {
      console.warn(`Particle texture not found for type: ${type}`);
      return null;
    }

    let emitter: ParticleEmitter;
    
    switch (type) {
      case 'fire':
        emitter = ParticleEffects.createFireEffect(texture);
        break;
      case 'smoke':
        emitter = ParticleEffects.createSmokeEffect(texture);
        break;
      case 'sparkle':
        emitter = ParticleEffects.createSparkleEffect(texture);
        break;
      case 'trail':
        emitter = ParticleEffects.createTrailEffect(texture);
        break;
      case 'explosion':
        emitter = ParticleEffects.createExplosionEffect(texture);
        break;
      default:
        return null;
    }

    emitter.setPosition(position.x, position.y);
    emitter.start();
    
    this.world.addChild(emitter);
    this.particleEmitters.set(id, emitter);

    return emitter;
  }

  followKaiju(kaijuId: string): void {
    const kaiju = this.kaijuSprites.get(kaijuId);
    if (kaiju) {
      this.camera.follow(kaiju);
    }
  }

  unfollowKaiju(): void {
    this.camera.unfollow();
  }

  shakeCamera(intensity: number = 10, duration: number = 0.5): void {
    this.camera.shake(intensity, duration);
  }

  playMusic(track: 'menu' | 'game' | 'battle' | 'victory'): void {
    if (this.config.enableAudio) {
      this.audioManager.playMusic(`${track}-theme`);
    }
  }

  getKaiju(id: string): KaijuSprite | undefined {
    return this.kaijuSprites.get(id);
  }

  getCamera(): Camera {
    return this.camera;
  }

  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  getCollisionSystem(): CollisionSystem {
    return this.collisionSystem;
  }

  resize(width: number, height: number): void {
    this.camera.resize(width, height);
  }

  // EventEmitter delegate methods
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }

  off(event: string | symbol, listener?: (...args: any[]) => void): this {
    if (listener) {
      this.eventEmitter.off(event, listener);
    } else {
      // If no listener provided, remove all listeners for this event
      this.eventEmitter.removeAllListeners(event);
    }
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.once(event, listener);
    return this;
  }

  removeAllListeners(event?: string | symbol): this {
    this.eventEmitter.removeAllListeners(event);
    return this;
  }

  destroy(): void {
    // Clean up event emitter
    this.eventEmitter.removeAllListeners();
    
    this.touchControls?.destroy();
    this.kaijuSprites.forEach(kaiju => kaiju.destroy());
    this.particleEmitters.forEach(emitter => emitter.destroy());
    this.collisionSystem.clear();
    this.world.destroy(true);
    this.ui.destroy(true);
  }
}