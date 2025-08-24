import * as PIXI from 'pixi.js';
import { EventEmitter } from 'events';
import { GameManager, GameConfig } from './GameManager';
import { TerrainRenderer } from './TerrainRenderer';
import { ShadowSprite } from './ShadowSprite';
import { InteractiveZone } from './InteractiveZone';
import { EnvironmentSystem } from './EnvironmentSystem';
import { MinimapSystem } from './MinimapSystem';
import { TradeExecution, ChatMessage, Position } from '@/types/models';

export type BiomeType = 'fire' | 'water' | 'earth' | 'air';

export interface InteractiveZoneConfig {
  type: 'chat' | 'trading' | 'statistics';
  position: { x: number; y: number };
}

export interface TerritoryConfig extends GameConfig {
  chunkSize?: number;
  viewDistance?: number;
}

export class TerritoryManager extends GameManager {
  private terrainRenderer: TerrainRenderer;
  private shadowSprites: Map<string, ShadowSprite> = new Map();
  private playerShadows: Map<string, ShadowSprite> = new Map(); // Other players' shadows
  private userShadow: ShadowSprite | null = null;
  private interactiveZones: Map<string, InteractiveZone> = new Map();
  private environmentSystem: EnvironmentSystem;
  private minimapSystem: MinimapSystem;
  private currentBiome: BiomeType = 'earth';
  private territoryConfig: TerritoryConfig;
  private realtimeUnsubscribeFunctions: (() => void)[] = [];
  private tapHandler?: (worldPos: { x: number; y: number }) => void;
  private userShadowMoveCallback: ((position: Position) => void) | null = null;
  private tradeEffects: Map<string, PIXI.Container> = new Map();
  private chatBubbles: Map<string, PIXI.Container> = new Map();

  constructor(app: PIXI.Application, config: TerritoryConfig) {
    super(app, config);
    this.territoryConfig = config;
    
    this.terrainRenderer = new TerrainRenderer(this.world, {
      worldWidth: config.worldWidth,
      worldHeight: config.worldHeight,
      chunkSize: config.chunkSize || 256,
      viewDistance: config.viewDistance || 2
    });
    
    this.environmentSystem = new EnvironmentSystem(this.world, config);
    this.minimapSystem = new MinimapSystem(this.ui, this.camera, config);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.loadTerritoryAssets();
    await this.terrainRenderer.initialize();
    await this.environmentSystem.initialize();
    await this.minimapSystem.initialize();
  }

  private async loadTerritoryAssets(): Promise<void> {
    // Load biome textures
    await this.assetLoader.loadBiomeAssets(['fire', 'water', 'earth', 'air']);
    
    // Load shadow assets
    await this.assetLoader.loadShadowAssets();
    
    // Load interactive zone assets
    await this.assetLoader.loadInteractiveZoneAssets();
    
    // Load environment assets (weather, particles, etc.)
    await this.assetLoader.loadEnvironmentAssets();
  }

  async createTerritory(kaijuId: string, biome: BiomeType): Promise<void> {
    this.currentBiome = biome;
    
    // Generate terrain based on biome
    await this.terrainRenderer.generateTerrain(biome);
    
    // Set environment theme
    this.environmentSystem.setBiome(biome);
    
    // Update minimap
    this.minimapSystem.setTerrain(this.terrainRenderer.getTerrainData());
  }
  
  async createMixedTerritory(kaijuId: string): Promise<void> {
    // Default biome for environment
    this.currentBiome = 'earth';
    
    // Generate mixed terrain with all biomes
    await this.terrainRenderer.generateMixedTerrain();
    
    // Set neutral environment theme
    this.environmentSystem.setBiome('earth');
    
    // Update minimap
    this.minimapSystem.setTerrain(this.terrainRenderer.getTerrainData());
  }

  createShadowFigures(kaijuId: string, count: number = 3): ShadowSprite[] {
    const shadows: ShadowSprite[] = [];
    const kaiju = this.getKaiju(kaijuId);
    
    if (!kaiju) {
      console.warn(`Cannot create shadows - Kaiju ${kaijuId} not found`);
      return shadows;
    }

    const kaijuPos = kaiju.position;
    
    for (let i = 0; i < count; i++) {
      // Create formation behind Kaiju (staggered line formation)
      const formationAngle = Math.PI; // Behind the Kaiju
      const lineOffset = (i - (count - 1) / 2) * 40; // Spread shadows in a line
      const backDistance = 60 + i * 25; // Increase distance for each shadow
      
      const formationOffset = {
        x: Math.cos(formationAngle) * backDistance + Math.cos(formationAngle + Math.PI/2) * lineOffset,
        y: Math.sin(formationAngle) * backDistance + Math.sin(formationAngle + Math.PI/2) * lineOffset
      };
      
      const shadowPos = {
        x: kaijuPos.x + formationOffset.x,
        y: kaijuPos.y + formationOffset.y
      };

      const shadowId = `shadow-${kaijuId}-${i}`;
      
      // Try to get shadow texture
      const shadowTexture = this.assetLoader.getAsset('shadow-follower') as PIXI.Texture;
      
      const shadow = new ShadowSprite({
        id: shadowId,
        type: 'follower',
        position: shadowPos,
        target: kaiju,
        followDistance: 50,
        opacity: 0.4 + (count - i) * 0.1, // Closer shadows are more visible
        followDelay: i * 0.3, // Stagger delays: 0s, 0.3s, 0.6s, etc.
        formationIndex: i,
        formationOffset: formationOffset,
        usePixelArt: false,
        texture: shadowTexture || undefined
      });
      
      // Add random movement to shadow followers
      shadow.on('update', () => {
        if (Math.random() < 0.008) { // 0.8% chance each frame to wander slightly
          const wanderDistance = 30;
          const currentPos = shadow.position;
          const targetX = currentPos.x + (Math.random() - 0.5) * wanderDistance;
          const targetY = currentPos.y + (Math.random() - 0.5) * wanderDistance;
          const clampedX = Math.max(50, Math.min(this.territoryConfig.worldWidth - 50, targetX));
          const clampedY = Math.max(50, Math.min(this.territoryConfig.worldHeight - 50, targetY));
          shadow.moveToPosition({ x: clampedX, y: clampedY });
        }
      });

      this.world.addChild(shadow);
      this.shadowSprites.set(shadowId, shadow);
      this.collisionSystem.addObject(shadow, 'shadow');
      
      shadows.push(shadow);
    }

    return shadows;
  }

  createUserShadow(id: string, position: { x: number; y: number }): ShadowSprite | null {
    if (this.userShadow) {
      this.removeUserShadow();
    }

    // Try to get user shadow texture
    const userShadowTexture = this.assetLoader.getAsset('shadow-user') as PIXI.Texture;
    
    this.userShadow = new ShadowSprite({
      id,
      type: 'user',
      position,
      isUserControlled: true,
      opacity: 0.85, // Slightly more visible than follower shadows
      followDelay: 0,
      formationIndex: -1, // Special index for user shadow
      formationOffset: { x: 0, y: 0 },
      usePixelArt: false,
      texture: userShadowTexture || undefined
    });

    this.world.addChild(this.userShadow);
    this.collisionSystem.addObject(this.userShadow, 'user-shadow');
    
    // Add a "YOU" indicator above the user's shadow
    const youIndicator = new PIXI.Text('YOU', {
      fontSize: 12,
      fill: 0x00FF00,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    youIndicator.anchor.set(0.5);
    youIndicator.y = -20;
    this.userShadow.addChild(youIndicator);

    // Set up click-to-move controls
    this.setupClickToMove();
    
    return this.userShadow;
  }

  private setupClickToMove(): void {
    // Store the handler so we can remove it later
    this.tapHandler = (worldPos: { x: number; y: number }) => {
      if (this.userShadow) {
        this.userShadow.moveToPosition(worldPos);
        
        // Create movement particle effect
        if (this.territoryConfig.enableParticles) {
          this.createParticleEffect(
            `movement-${Date.now()}`,
            'trail',
            worldPos
          );
        }
        
        // Play movement sound
        if (this.territoryConfig.enableAudio) {
          this.audioManager.playKaijuSound('move');
        }
      }
    };
    
    this.on('tap', this.tapHandler);
    
    // Add keyboard controls
    this.setupKeyboardControls();
  }
  
  private setupKeyboardControls(): void {
    const moveSpeed = 5; // pixels per frame
    const keys: Record<string, boolean> = {};
    
    // Add keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Store cleanup function
    const cleanupKeyboard = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    
    // Add cleanup to realtimeUnsubscribeFunctions
    this.realtimeUnsubscribeFunctions.push(cleanupKeyboard);
    
    // Add update loop for keyboard movement
    const updateMovement = () => {
      if (!this.userShadow) return;
      
      let dx = 0;
      let dy = 0;
      
      // WASD and Arrow keys support
      if (keys['w'] || keys['arrowup']) dy -= moveSpeed;
      if (keys['s'] || keys['arrowdown']) dy += moveSpeed;
      if (keys['a'] || keys['arrowleft']) dx -= moveSpeed;
      if (keys['d'] || keys['arrowright']) dx += moveSpeed;
      
      if (dx !== 0 || dy !== 0) {
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          const factor = 0.707; // 1/sqrt(2)
          dx *= factor;
          dy *= factor;
        }
        
        const currentPos = this.userShadow.position;
        const newPos = {
          x: Math.max(0, Math.min(this.territoryConfig.worldWidth, currentPos.x + dx)),
          y: Math.max(0, Math.min(this.territoryConfig.worldHeight, currentPos.y + dy))
        };
        
        this.userShadow.position.set(newPos.x, newPos.y);
        
        // Trigger position update callback for multiplayer
        if (this.userShadowMoveCallback) {
          this.userShadowMoveCallback(newPos);
        }
        
        // Create movement particle effect (less frequently)
        if (this.territoryConfig.enableParticles && Math.random() < 0.1) {
          this.createParticleEffect(
            `movement-${Date.now()}`,
            'trail',
            newPos
          );
        }
      }
    };
    
    // Add to the game update loop
    this.app.ticker.add(updateMovement);
    
    // Store ticker cleanup
    const cleanupTicker = () => {
      this.app.ticker.remove(updateMovement);
    };
    
    this.realtimeUnsubscribeFunctions.push(cleanupTicker);
  }

  removeUserShadow(): void {
    if (this.userShadow) {
      this.world.removeChild(this.userShadow);
      this.collisionSystem.removeObject(this.userShadow, 'user-shadow');
      this.userShadow.destroy();
      this.userShadow = null;
    }
  }

  clearAllShadows(): void {
    // Clear follower shadows
    this.shadowSprites.forEach(shadow => {
      this.world.removeChild(shadow);
      this.collisionSystem.removeObject(shadow, 'shadow');
      shadow.destroy();
    });
    this.shadowSprites.clear();
    
    // Clear user shadow
    this.removeUserShadow();
    
    // Clear player shadows
    this.playerShadows.forEach(shadow => {
      this.world.removeChild(shadow);
      this.collisionSystem.removeObject(shadow, 'player-shadow');
      shadow.destroy();
    });
    this.playerShadows.clear();
  }

  followUserShadow(shadowId: string): void {
    if (this.userShadow) {
      this.camera.follow(this.userShadow);
    }
  }

  createInteractiveZones(zones: InteractiveZoneConfig[]): void {
    zones.forEach((config, index) => {
      const zoneId = `zone-${config.type}-${index}`;
      
      // Try to get zone texture
      const zoneTexture = this.assetLoader.getAsset(`zone-${config.type}`) as PIXI.Texture;
      
      const zone = new InteractiveZone({
        id: zoneId,
        type: config.type,
        position: config.position,
        radius: 80,
        texture: zoneTexture || undefined
      });

      this.world.addChild(zone);
      this.interactiveZones.set(zoneId, zone);
      this.collisionSystem.addObject(zone, 'interactive');

      // Set up zone interaction
      zone.on('enter', () => this.onZoneEnter(zone));
      zone.on('exit', () => this.onZoneExit(zone));
      zone.on('interact', () => this.onZoneInteract(zone));
    });
  }

  private onZoneEnter(zone: InteractiveZone): void {
    zone.showTooltip();
    if (this.territoryConfig.enableAudio) {
      this.audioManager.playButtonClick();
    }
  }

  private onZoneExit(zone: InteractiveZone): void {
    zone.hideTooltip();
  }

  private onZoneInteract(zone: InteractiveZone): void {
    switch (zone.getType()) {
      case 'chat':
        this.openChatInterface(zone);
        break;
      case 'trading':
        this.openTradingInterface(zone);
        break;
      case 'statistics':
        this.openStatisticsInterface(zone);
        break;
    }
  }

  private openChatInterface(zone: InteractiveZone): void {
    // Enhanced chat interface with speech bubble UI
    const chatContainer = new PIXI.Container();
    chatContainer.position.set(zone.position.x, zone.position.y - 100);
    
    // Create interactive chat bubble
    const chatBubble = new PIXI.Graphics();
    chatBubble.beginFill(0x4CAF50, 0.9);
    chatBubble.lineStyle(3, 0x2E7D32, 1);
    chatBubble.drawRoundedRect(-80, -40, 160, 60, 15);
    chatBubble.endFill();
    
    // Add chat icon
    const chatText = new PIXI.Text('💬 Territory Chat', {
      fontSize: 14,
      fill: 0xFFFFFF,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    chatText.anchor.set(0.5);
    chatText.y = -25;
    
    const helpText = new PIXI.Text('Click to open chat', {
      fontSize: 10,
      fill: 0xE8F5E8,
      fontFamily: 'Arial'
    });
    helpText.anchor.set(0.5);
    helpText.y = -5;
    
    chatContainer.addChild(chatBubble);
    chatContainer.addChild(chatText);
    chatContainer.addChild(helpText);
    
    // Make it interactive
    chatBubble.interactive = true;
    chatBubble.buttonMode = true;
    chatBubble.on('pointerdown', () => {
      this.emit('chat-interface-open', { zoneId: zone.id });
    });
    
    // Add floating animation
    const startY = chatContainer.y;
    const animate = () => {
      chatContainer.y = startY + Math.sin(Date.now() * 0.002) * 5;
      if (this.world.children.includes(chatContainer)) {
        requestAnimationFrame(animate);
      }
    };
    animate();
    
    this.world.addChild(chatContainer);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (this.world.children.includes(chatContainer)) {
        this.world.removeChild(chatContainer);
        chatContainer.destroy();
      }
    }, 10000);
    
    console.log('Chat interface opened at zone:', zone.id);
  }

  private openTradingInterface(zone: InteractiveZone): void {
    // Emit event to open the full Trading Post overlay
    this.emit('trading-post-open', { 
      zoneId: zone.id,
      territoryId: this.currentBiome,
      territoryName: this.getTerritoryName(),
      position: zone.position 
    });
    
    // Create minimal particle effects around the zone
    for (let i = 0; i < 8; i++) {
      this.createParticleEffect(
        `trade-sparkle-${Date.now()}-${i}`,
        'sparkle',
        {
          x: zone.position.x + (Math.random() - 0.5) * 100,
          y: zone.position.y + (Math.random() - 0.5) * 100
        }
      );
    }
    
    // Play sound effect
    if (this.territoryConfig.enableAudio) {
      this.audioManager.playButtonClick();
    }
    
    console.log('Trading Post overlay opened at zone:', zone.id);
  }

  private openStatisticsInterface(zone: InteractiveZone): void {
    // Enhanced statistics interface with data visualization overlay
    const statsContainer = new PIXI.Container();
    statsContainer.position.set(zone.position.x, zone.position.y - 140);
    
    // Create stats display background
    const statsBg = new PIXI.Graphics();
    statsBg.beginFill(0x9C27B0, 0.9);
    statsBg.lineStyle(3, 0x6A1B9A, 1);
    statsBg.drawRoundedRect(-120, -60, 240, 100, 15);
    statsBg.endFill();
    
    const titleText = new PIXI.Text('📊 Performance Analytics', {
      fontSize: 16,
      fill: 0xFFFFFF,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    titleText.anchor.set(0.5);
    titleText.y = -45;
    
    // Mock performance metrics
    const metrics = [
      '30D Return: +23.7%',
      'Win Rate: 68.4%',
      'Sharpe Ratio: 2.1',
      'Active Shadows: 87'
    ];
    
    metrics.forEach((metric, index) => {
      const metricText = new PIXI.Text(metric, {
        fontSize: 11,
        fill: 0xE1BEE7,
        fontFamily: 'Arial'
      });
      metricText.anchor.set(0.5);
      metricText.y = -20 + index * 15;
      statsContainer.addChild(metricText);
    });
    
    // Create animated data visualization
    const dataViz = new PIXI.Graphics();
    const updateDataViz = () => {
      dataViz.clear();
      
      // Draw animated line chart
      const points = 20;
      const baseY = 20;
      dataViz.lineStyle(3, 0xFF4081, 0.8);
      
      for (let i = 0; i < points; i++) {
        const x = -100 + (i * 200) / (points - 1);
        const y = baseY + Math.sin(Date.now() * 0.003 + i * 0.3) * 15;
        
        if (i === 0) {
          dataViz.moveTo(x, y);
        } else {
          dataViz.lineTo(x, y);
        }
        
        // Add data points
        dataViz.beginFill(0xFF4081, 0.8);
        dataViz.drawCircle(x, y, 2);
        dataViz.endFill();
      }
    };
    
    statsContainer.addChild(statsBg);
    statsContainer.addChild(titleText);
    statsContainer.addChild(dataViz);
    
    // Animate the visualization
    const animateViz = () => {
      updateDataViz();
      if (this.world.children.includes(statsContainer)) {
        requestAnimationFrame(animateViz);
      }
    };
    animateViz();
    
    // Make it interactive
    statsBg.interactive = true;
    statsBg.buttonMode = true;
    statsBg.on('pointerdown', () => {
      this.emit('stats-interface-open', { zoneId: zone.id });
    });
    
    this.world.addChild(statsContainer);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (this.world.children.includes(statsContainer)) {
        this.world.removeChild(statsContainer);
        statsContainer.destroy();
      }
    }, 15000);
    
    console.log('Statistics interface opened at zone:', zone.id);
  }

  startDayNightCycle(): void {
    this.environmentSystem.startDayNightCycle();
  }

  startWeatherSystem(): void {
    this.environmentSystem.startWeatherSystem();
  }

  toggleMinimap(): void {
    this.minimapSystem.toggle();
  }

  toggleDebugStats(): void {
    this.minimapSystem.toggleDebugStats();
  }

  protected update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update terrain renderer (chunk loading/unloading)
    this.terrainRenderer.update(this.camera);
    
    // Update shadow sprites (followers)
    this.shadowSprites.forEach(shadow => {
      shadow.update(deltaTime);
    });
    
    // Update player shadows (other players)
    this.playerShadows.forEach(shadow => {
      shadow.update(deltaTime);
    });
    
    if (this.userShadow) {
      this.userShadow.update(deltaTime);
    }
    
    // Update interactive zones
    this.interactiveZones.forEach(zone => {
      zone.update(deltaTime, this.userShadow?.position || null);
    });
    
    // Update environment system
    this.environmentSystem.update(deltaTime);
    
    // Update minimap
    this.minimapSystem.update(deltaTime);
  }

  getBiome(): BiomeType {
    return this.currentBiome;
  }

  getTerritoryName(): string {
    const biomeNames: Record<BiomeType, string> = {
      fire: 'Inferno Peaks',
      water: 'Azure Depths',
      earth: 'Crystal Caverns',
      air: 'Storm Heights'
    };
    return biomeNames[this.currentBiome];
  }

  getUserShadow(): ShadowSprite | null {
    return this.userShadow;
  }

  getInteractiveZones(): Map<string, InteractiveZone> {
    return this.interactiveZones;
  }


  // Realtime functionality methods
  setRealtimeUnsubscribeFunctions(unsubscribeFunctions: (() => void)[]): void {
    this.realtimeUnsubscribeFunctions = unsubscribeFunctions;
  }
  
  onUserShadowMove(callback: (position: Position) => void): void {
    this.userShadowMoveCallback = callback;
    
    // Remove existing listener if it exists
    if (this.tapHandler) {
      this.off('tap', this.tapHandler);
    }
    
    // Create new handler that includes the callback
    this.tapHandler = (worldPos: { x: number; y: number }) => {
      if (this.userShadow) {
        this.userShadow.moveToPosition(worldPos);
        
        // Trigger realtime callback
        if (this.userShadowMoveCallback) {
          this.userShadowMoveCallback({ x: worldPos.x, y: worldPos.y });
        }
        
        // Create movement particle effect
        if (this.territoryConfig.enableParticles) {
          this.createParticleEffect(
            `movement-${Date.now()}`,
            'trail',
            worldPos
          );
        }
        
        // Play movement sound
        if (this.territoryConfig.enableAudio) {
          this.audioManager.playKaijuSound('move');
        }
      }
    };
    
    this.on('tap', this.tapHandler);
  }
  
  updateShadowPosition(shadowId: string, position: Position, playerName?: string): void {
    const shadow = this.playerShadows.get(shadowId);
    if (shadow) {
      shadow.moveToPosition(position);
    }
  }
  
  addPlayerShadow(shadowId: string, position: Position, playerName: string): void {
    if (this.playerShadows.has(shadowId)) {
      return; // Already exists
    }
    
    const playerShadow = new ShadowSprite({
      id: shadowId,
      type: 'user', // Other players appear as user-type shadows
      position,
      isUserControlled: false,
      opacity: 0.7,
      followDelay: 0,
      formationIndex: -1,
      formationOffset: { x: 0, y: 0 }
    });
    
    this.world.addChild(playerShadow);
    this.playerShadows.set(shadowId, playerShadow);
    this.collisionSystem.addObject(playerShadow, 'player-shadow');
    
    // Add name label
    const nameLabel = new PIXI.Text(playerName, {
      fontSize: 10,
      fill: 0x4A90E2,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    nameLabel.anchor.set(0.5);
    nameLabel.y = -40;
    playerShadow.addChild(nameLabel);
  }
  
  removePlayerShadow(shadowId: string): void {
    const shadow = this.playerShadows.get(shadowId);
    if (shadow) {
      this.world.removeChild(shadow);
      this.collisionSystem.removeObject(shadow, 'player-shadow');
      shadow.destroy();
      this.playerShadows.delete(shadowId);
    }
  }
  
  showTradeExecution(trade: TradeExecution): void {
    // Create visual effect for trade execution
    const tradeEffect = new PIXI.Container();
    tradeEffect.position.set(
      Math.random() * this.territoryConfig.worldWidth,
      Math.random() * this.territoryConfig.worldHeight
    );
    
    // Trade notification
    const tradeBg = new PIXI.Graphics();
    const bgColor = trade.pnl >= 0 ? 0x4CAF50 : 0xF44336;
    tradeBg.beginFill(bgColor, 0.9);
    tradeBg.drawRoundedRect(-60, -20, 120, 40, 8);
    tradeBg.endFill();
    
    const tradeText = new PIXI.Text(`${trade.type.toUpperCase()}: ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}%`, {
      fontSize: 12,
      fill: 0xFFFFFF,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    tradeText.anchor.set(0.5);
    
    tradeEffect.addChild(tradeBg);
    tradeEffect.addChild(tradeText);
    
    this.world.addChild(tradeEffect);
    
    // Animate and remove
    let alpha = 1;
    const fadeOut = () => {
      alpha -= 0.02;
      tradeEffect.alpha = alpha;
      tradeEffect.y -= 1;
      
      if (alpha > 0) {
        requestAnimationFrame(fadeOut);
      } else {
        this.world.removeChild(tradeEffect);
        tradeEffect.destroy();
      }
    };
    
    setTimeout(() => fadeOut(), 3000);
  }
  
  showChatMessage(message: ChatMessage): void {
    // Create chat bubble for territory chat
    const chatBubble = new PIXI.Container();
    chatBubble.position.set(
      Math.random() * (this.territoryConfig.worldWidth - 200) + 100,
      50 + Math.random() * 100
    );
    
    const bubbleBg = new PIXI.Graphics();
    bubbleBg.beginFill(0x2196F3, 0.9);
    bubbleBg.lineStyle(2, 0x1976D2, 1);
    bubbleBg.drawRoundedRect(-80, -30, 160, 50, 10);
    bubbleBg.endFill();
    
    const userText = new PIXI.Text(message.username, {
      fontSize: 10,
      fill: 0xFFFFFF,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    userText.anchor.set(0.5);
    userText.y = -20;
    
    const messageText = new PIXI.Text(message.message, {
      fontSize: 9,
      fill: 0xE3F2FD,
      fontFamily: 'Arial',
      wordWrap: true,
      wordWrapWidth: 140
    });
    messageText.anchor.set(0.5);
    messageText.y = -5;
    
    chatBubble.addChild(bubbleBg);
    chatBubble.addChild(userText);
    chatBubble.addChild(messageText);
    
    this.world.addChild(chatBubble);
    this.chatBubbles.set(message.id, chatBubble);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (this.world.children.includes(chatBubble)) {
        this.world.removeChild(chatBubble);
        chatBubble.destroy();
        this.chatBubbles.delete(message.id);
      }
    }, 8000);
  }

  createShadowNPCs(count: number): void {
    for (let i = 0; i < count; i++) {
      const shadowId = `npc-shadow-${i}`;
      const position = {
        x: Math.random() * this.territoryConfig.worldWidth,
        y: Math.random() * this.territoryConfig.worldHeight
      };
      
      const npcShadow = new ShadowSprite({
        id: shadowId,
        type: 'follower',
        position,
        isUserControlled: false,
        opacity: 0.6,
        followDelay: 0,
        formationIndex: -1,
        formationOffset: { x: 0, y: 0 },
        usePixelArt: false,
        texture: (this.assetLoader.getAsset('shadow-follower') as PIXI.Texture) || undefined
      });
      
      // Add simple wandering behavior
      npcShadow.on('update', () => {
        if (Math.random() < 0.01) { // 1% chance each frame to change direction
          const targetX = npcShadow.position.x + (Math.random() - 0.5) * 200;
          const targetY = npcShadow.position.y + (Math.random() - 0.5) * 200;
          const clampedX = Math.max(50, Math.min(this.territoryConfig.worldWidth - 50, targetX));
          const clampedY = Math.max(50, Math.min(this.territoryConfig.worldHeight - 50, targetY));
          npcShadow.moveToPosition({ x: clampedX, y: clampedY });
        }
      });
      
      this.world.addChild(npcShadow);
      this.shadowSprites.set(shadowId, npcShadow);
      this.collisionSystem.addObject(npcShadow, 'shadow');
    }
  }
  
  markKaijuAsLeader(kaijuId: string): void {
    const kaiju = this.getKaiju(kaijuId);
    if (!kaiju) return;
    
    // Scale up the leader to be bigger than regular kaijus
    kaiju.scale.set(2.5); // Make leader 2.5x bigger than regular kaijus
    
    // Add automatic movement to the leader
    const addLeaderMovement = () => {
      if (Math.random() < 0.003) { // 0.3% chance each frame for slow, majestic movement
        const currentPos = kaiju.position;
        const moveDistance = 80; // Larger movement range for leader
        const targetX = currentPos.x + (Math.random() - 0.5) * moveDistance;
        const targetY = currentPos.y + (Math.random() - 0.5) * moveDistance;
        const centerX = this.territoryConfig.worldWidth / 2;
        const centerY = this.territoryConfig.worldHeight / 2;
        const maxDistance = 200; // Keep leader near center
        
        // Clamp to stay near center
        const clampedX = Math.max(centerX - maxDistance, Math.min(centerX + maxDistance, targetX));
        const clampedY = Math.max(centerY - maxDistance, Math.min(centerY + maxDistance, targetY));
        
        kaiju.moveTo(clampedX, clampedY);
      }
    };
    
    // Add to update loop
    this.app.ticker.add(addLeaderMovement);
    
    // Store cleanup function
    this.realtimeUnsubscribeFunctions.push(() => {
      this.app.ticker.remove(addLeaderMovement);
    });
    
    // Create a crown icon above the leader Kaiju
    const crown = new PIXI.Graphics();
    crown.beginFill(0xFFD700, 1);
    
    // Draw crown shape
    crown.moveTo(-15, 0);
    crown.lineTo(-15, -10);
    crown.lineTo(-10, -5);
    crown.lineTo(-5, -15);
    crown.lineTo(0, -10);
    crown.lineTo(5, -15);
    crown.lineTo(10, -5);
    crown.lineTo(15, -10);
    crown.lineTo(15, 0);
    crown.closePath();
    crown.endFill();
    
    crown.y = -50; // Position above the leader Kaiju
    crown.scale.set(0.8); // Larger crown for leader
    kaiju.addChild(crown);
    
    // Add "LEADER" text
    const leaderText = new PIXI.Text('LEADER', {
      fontSize: 12,
      fill: 0xFFD700,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    leaderText.anchor.set(0.5);
    leaderText.y = -65;
    kaiju.addChild(leaderText);
    
    // Add a glowing effect
    const glow = new PIXI.Graphics();
    glow.beginFill(0xFFD700, 0.2);
    glow.drawCircle(0, 0, 60);
    glow.endFill();
    kaiju.addChildAt(glow, 0);
    
    // Animate the glow
    const animateGlow = () => {
      glow.scale.set(1 + Math.sin(Date.now() * 0.002) * 0.1);
      glow.alpha = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;
      if (this.world.children.includes(kaiju)) {
        requestAnimationFrame(animateGlow);
      }
    };
    animateGlow();
  }

  destroy(): void {
    // Clean up realtime subscriptions
    this.realtimeUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.realtimeUnsubscribeFunctions = [];
    
    // Clean up player shadows
    this.playerShadows.forEach(shadow => shadow.destroy());
    this.playerShadows.clear();
    
    // Clean up effects
    this.tradeEffects.forEach(effect => effect.destroy());
    this.tradeEffects.clear();
    
    this.chatBubbles.forEach(bubble => bubble.destroy());
    this.chatBubbles.clear();
    
    this.terrainRenderer.destroy();
    this.environmentSystem.destroy();
    this.minimapSystem.destroy();
    
    this.shadowSprites.forEach(shadow => shadow.destroy());
    this.shadowSprites.clear();
    
    if (this.userShadow) {
      this.userShadow.destroy();
      this.userShadow = null;
    }
    
    this.interactiveZones.forEach(zone => zone.destroy());
    this.interactiveZones.clear();
    
    super.destroy();
  }
}