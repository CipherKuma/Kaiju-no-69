import * as PIXI from 'pixi.js';
import { ParticleManager, AdvancedParticleEffects } from './AdvancedParticleEffects';
import { AdvancedAudioSystem } from './AdvancedAudioSystem';
import { VisualEffectsManager } from './VisualEffects';

export interface TerritoryEvent {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  duration: number;
  effects: EventEffect[];
  visualEffect?: string;
  soundEffect?: string;
  probability: number;
}

export interface EventEffect {
  type: 'buff' | 'debuff' | 'spawn' | 'weather' | 'trade_bonus' | 'special';
  target: 'all' | 'random' | 'top_performers' | 'territory';
  value: number;
  property?: string;
}

export interface Celebration {
  id: string;
  trigger: 'big_trade' | 'milestone' | 'achievement' | 'victory' | 'custom';
  threshold?: number;
  duration: number;
  particles: string[];
  sounds: string[];
  animations: string[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'epic';
  duration: number;
  position: 'top' | 'center' | 'bottom';
  icon?: PIXI.Texture;
}

export class GameEventsSystem {
  private static instance: GameEventsSystem;
  private events: Map<string, TerritoryEvent> = new Map();
  private activeEvents: Map<string, ActiveEvent> = new Map();
  private celebrations: Map<string, Celebration> = new Map();
  private notifications: NotificationManager;
  private eventTimer: number = 0;
  private nextEventTime: number = 0;
  private particleManager: ParticleManager;
  private audioSystem: AdvancedAudioSystem;
  private visualEffects: VisualEffectsManager;
  private app: PIXI.Application;
  
  private constructor(app: PIXI.Application) {
    this.app = app;
    this.notifications = new NotificationManager(app);
    this.particleManager = ParticleManager.getInstance();
    this.audioSystem = AdvancedAudioSystem.getAdvancedInstance();
    this.visualEffects = VisualEffectsManager.getInstance();
    
    this.initializeEvents();
    this.initializeCelebrations();
    this.scheduleNextEvent();
  }
  
  static getInstance(app?: PIXI.Application): GameEventsSystem {
    if (!GameEventsSystem.instance && app) {
      GameEventsSystem.instance = new GameEventsSystem(app);
    }
    return GameEventsSystem.instance;
  }
  
  private initializeEvents(): void {
    // Common events
    this.events.set('trade_surge', {
      id: 'trade_surge',
      name: 'Trade Surge',
      description: 'Trading activity increases by 50% for all Kaiju!',
      type: 'positive',
      rarity: 'common',
      duration: 60000,
      effects: [{
        type: 'trade_bonus',
        target: 'all',
        value: 0.5
      }],
      visualEffect: 'golden_aura',
      soundEffect: 'event-trade-surge',
      probability: 0.3
    });
    
    this.events.set('market_crash', {
      id: 'market_crash',
      name: 'Market Crash',
      description: 'Trading profits reduced by 30% temporarily!',
      type: 'negative',
      rarity: 'common',
      duration: 45000,
      effects: [{
        type: 'debuff',
        target: 'all',
        value: -0.3,
        property: 'trade_profit'
      }],
      visualEffect: 'red_storm',
      soundEffect: 'event-market-crash',
      probability: 0.2
    });
    
    // Rare events
    this.events.set('golden_hour', {
      id: 'golden_hour',
      name: 'Golden Hour',
      description: 'All trades generate double rewards!',
      type: 'positive',
      rarity: 'rare',
      duration: 30000,
      effects: [{
        type: 'trade_bonus',
        target: 'all',
        value: 1.0
      }],
      visualEffect: 'golden_rain',
      soundEffect: 'event-golden-hour',
      probability: 0.1
    });
    
    this.events.set('shadow_invasion', {
      id: 'shadow_invasion',
      name: 'Shadow Invasion',
      description: 'Shadow creatures appear and disrupt trading!',
      type: 'negative',
      rarity: 'rare',
      duration: 90000,
      effects: [{
        type: 'spawn',
        target: 'territory',
        value: 5
      }],
      visualEffect: 'dark_portal',
      soundEffect: 'event-shadow-invasion',
      probability: 0.08
    });
    
    // Epic events
    this.events.set('kaiju_festival', {
      id: 'kaiju_festival',
      name: 'Kaiju Festival',
      description: 'All Kaiju gain special abilities and bonuses!',
      type: 'positive',
      rarity: 'epic',
      duration: 120000,
      effects: [{
        type: 'buff',
        target: 'all',
        value: 0.5,
        property: 'all_stats'
      }, {
        type: 'special',
        target: 'all',
        value: 1
      }],
      visualEffect: 'festival_fireworks',
      soundEffect: 'event-kaiju-festival',
      probability: 0.05
    });
    
    // Legendary events
    this.events.set('dimensional_rift', {
      id: 'dimensional_rift',
      name: 'Dimensional Rift',
      description: 'A rift opens, bringing chaos and opportunity!',
      type: 'neutral',
      rarity: 'legendary',
      duration: 180000,
      effects: [{
        type: 'weather',
        target: 'territory',
        value: 1
      }, {
        type: 'special',
        target: 'random',
        value: 3
      }],
      visualEffect: 'dimensional_tear',
      soundEffect: 'event-dimensional-rift',
      probability: 0.02
    });
  }
  
  private initializeCelebrations(): void {
    this.celebrations.set('big_trade_success', {
      id: 'big_trade_success',
      trigger: 'big_trade',
      threshold: 1000000,
      duration: 5000,
      particles: ['trade_burst', 'gold_sparkles', 'confetti'],
      sounds: ['celebration-big-trade', 'crowd-cheer'],
      animations: ['kaiju_dance', 'victory_pose']
    });
    
    this.celebrations.set('milestone_reached', {
      id: 'milestone_reached',
      trigger: 'milestone',
      duration: 8000,
      particles: ['fireworks', 'star_burst'],
      sounds: ['celebration-milestone', 'fanfare'],
      animations: ['kaiju_celebration', 'jump_sequence']
    });
    
    this.celebrations.set('territory_victory', {
      id: 'territory_victory',
      trigger: 'victory',
      duration: 10000,
      particles: ['massive_fireworks', 'victory_rain'],
      sounds: ['celebration-victory', 'epic-fanfare'],
      animations: ['synchronized_dance', 'victory_parade']
    });
  }
  
  update(deltaTime: number): void {
    // Update event timer
    this.eventTimer += deltaTime;
    
    // Check for random events
    if (this.eventTimer >= this.nextEventTime) {
      this.triggerRandomEvent();
      this.scheduleNextEvent();
      this.eventTimer = 0;
    }
    
    // Update active events
    this.activeEvents.forEach((event, id) => {
      event.timeRemaining -= deltaTime;
      
      if (event.timeRemaining <= 0) {
        this.endEvent(id);
      } else {
        this.updateEventEffects(event, deltaTime);
      }
    });
    
    // Update notifications
    this.notifications.update(deltaTime);
  }
  
  private scheduleNextEvent(): void {
    // Random time between 2-5 minutes
    this.nextEventTime = 120000 + Math.random() * 180000;
  }
  
  private triggerRandomEvent(): void {
    const eventPool: TerritoryEvent[] = [];
    let totalProbability = 0;
    
    // Build weighted pool
    this.events.forEach(event => {
      eventPool.push(event);
      totalProbability += event.probability;
    });
    
    // Select random event
    let random = Math.random() * totalProbability;
    let selectedEvent: TerritoryEvent | null = null;
    
    for (const event of eventPool) {
      random -= event.probability;
      if (random <= 0) {
        selectedEvent = event;
        break;
      }
    }
    
    if (selectedEvent) {
      this.startEvent(selectedEvent);
    }
  }
  
  startEvent(event: TerritoryEvent): void {
    const activeEvent: ActiveEvent = {
      event,
      startTime: performance.now(),
      timeRemaining: event.duration,
      affectedEntities: []
    };
    
    this.activeEvents.set(event.id, activeEvent);
    
    // Show notification
    this.showEventNotification(event);
    
    // Apply visual effects
    if (event.visualEffect) {
      this.applyEventVisualEffect(event.visualEffect);
    }
    
    // Play sound effect
    if (event.soundEffect) {
      this.audioSystem.play(event.soundEffect, { volume: 0.7 });
    }
    
    // Apply event effects
    this.applyEventEffects(event);
  }
  
  private endEvent(eventId: string): void {
    const activeEvent = this.activeEvents.get(eventId);
    if (!activeEvent) return;
    
    // Remove event effects
    this.removeEventEffects(activeEvent.event);
    
    // Show end notification
    this.notifications.show({
      id: `${eventId}_end`,
      message: `${activeEvent.event.name} has ended`,
      type: 'info',
      duration: 3000,
      position: 'top'
    });
    
    this.activeEvents.delete(eventId);
  }
  
  private applyEventEffects(event: TerritoryEvent): void {
    event.effects.forEach(effect => {
      switch (effect.type) {
        case 'buff':
        case 'debuff':
          this.applyStatModifier(effect);
          break;
        case 'spawn':
          this.spawnEventEntities(effect);
          break;
        case 'weather':
          this.changeWeather(effect);
          break;
        case 'trade_bonus':
          this.applyTradeBonus(effect);
          break;
        case 'special':
          this.triggerSpecialEffect(effect);
          break;
      }
    });
  }
  
  private removeEventEffects(event: TerritoryEvent): void {
    // Implement effect removal logic
  }
  
  private updateEventEffects(activeEvent: ActiveEvent, deltaTime: number): void {
    // Update ongoing event effects
  }
  
  triggerCelebration(type: string, data?: any): void {
    const celebration = this.celebrations.get(type);
    if (!celebration) return;
    
    // Check threshold if applicable
    if (celebration.threshold && data?.value < celebration.threshold) {
      return;
    }
    
    // Start celebration effects
    this.startCelebrationEffects(celebration);
    
    // Schedule end of celebration
    setTimeout(() => {
      this.endCelebrationEffects(celebration);
    }, celebration.duration);
  }
  
  private startCelebrationEffects(celebration: Celebration): void {
    // Trigger particle effects
    celebration.particles.forEach(particleType => {
      this.createCelebrationParticles(particleType);
    });
    
    // Play celebration sounds
    celebration.sounds.forEach(sound => {
      this.audioSystem.play(sound, { volume: 0.8 });
    });
    
    // Trigger special animations
    celebration.animations.forEach(animation => {
      this.triggerSpecialAnimation(animation);
    });
    
    // Screen effects
    this.visualEffects.shakeScreen({
      intensity: 5,
      duration: 500,
      direction: 'both'
    });
    
    this.visualEffects.flashScreen(0xffff00, 300, 0.3);
  }
  
  private endCelebrationEffects(celebration: Celebration): void {
    // Clean up celebration effects
  }
  
  private createCelebrationParticles(type: string): void {
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    switch (type) {
      case 'fireworks':
        for (let i = 0; i < 5; i++) {
          const x = centerX + (Math.random() - 0.5) * 400;
          const y = centerY + (Math.random() - 0.5) * 300;
          
          setTimeout(() => {
            this.particleManager.createEffect(
              `firework_${i}`,
              AdvancedParticleEffects.createCelebrationEffect(
                PIXI.Texture.from('/assets/particles/star.png')
              ),
              { x, y }
            );
            
            this.visualEffects.createShockwave({ x, y }, 150);
          }, i * 200);
        }
        break;
        
      case 'confetti':
        this.particleManager.createEffect(
          'confetti',
          AdvancedParticleEffects.createCelebrationEffect(
            PIXI.Texture.from('/assets/particles/confetti.png')
          ),
          { x: centerX, y: 50 }
        );
        break;
    }
  }
  
  showNotification(notification: Notification): void {
    this.notifications.show(notification);
  }
  
  private showEventNotification(event: TerritoryEvent): void {
    const typeColors = {
      positive: 'success',
      negative: 'error',
      neutral: 'info'
    };
    
    const rarityIcons = {
      common: '⭐',
      rare: '⭐⭐',
      epic: '⭐⭐⭐',
      legendary: '👑'
    };
    
    this.notifications.show({
      id: event.id,
      message: `${rarityIcons[event.rarity]} ${event.name}: ${event.description}`,
      type: typeColors[event.type] as any,
      duration: 5000,
      position: 'top'
    });
  }
  
  private applyEventVisualEffect(effectName: string): void {
    switch (effectName) {
      case 'golden_aura':
        // Apply golden bloom to entire stage
        this.visualEffects.addBloom(this.app.stage, 1.2, 0.4);
        break;
        
      case 'red_storm':
        // Apply red tint and storm effects
        const colorMatrix = new PIXI.ColorMatrixFilter();
        colorMatrix.tint(0xff6666, true);
        this.app.stage.filters = [colorMatrix];
        break;
        
      case 'dimensional_tear':
        // Create portal effect in center
        this.visualEffects.applyGlitchEffect(2000);
        break;
    }
  }
  
  private applyStatModifier(effect: EventEffect): void {
    // Implement stat modifier logic
  }
  
  private spawnEventEntities(effect: EventEffect): void {
    // Implement entity spawning logic
  }
  
  private changeWeather(effect: EventEffect): void {
    // Implement weather change logic
  }
  
  private applyTradeBonus(effect: EventEffect): void {
    // Implement trade bonus logic
  }
  
  private triggerSpecialEffect(effect: EventEffect): void {
    // Implement special effect logic
  }
  
  private triggerSpecialAnimation(animationName: string): void {
    // Trigger special animations on Kaiju
    switch (animationName) {
      case 'kaiju_dance':
        // Make all Kaiju perform dance animation
        break;
        
      case 'synchronized_dance':
        // Coordinate synchronized animation
        break;
        
      case 'victory_parade':
        // Create parade formation
        break;
    }
  }
}

interface ActiveEvent {
  event: TerritoryEvent;
  startTime: number;
  timeRemaining: number;
  affectedEntities: string[];
}

class NotificationManager {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private notifications: Map<string, NotificationDisplay> = new Map();
  private notificationQueue: Notification[] = [];
  
  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    app.stage.addChild(this.container);
  }
  
  show(notification: Notification): void {
    const display = new NotificationDisplay(notification, this.app);
    this.notifications.set(notification.id, display);
    this.container.addChild(display.container);
    
    // Position notification
    this.updateNotificationPositions();
    
    // Auto-remove after duration
    setTimeout(() => {
      this.remove(notification.id);
    }, notification.duration);
  }
  
  remove(id: string): void {
    const display = this.notifications.get(id);
    if (display) {
      display.destroy();
      this.notifications.delete(id);
      this.updateNotificationPositions();
    }
  }
  
  update(deltaTime: number): void {
    this.notifications.forEach(display => {
      display.update(deltaTime);
    });
  }
  
  private updateNotificationPositions(): void {
    const topNotifications: NotificationDisplay[] = [];
    const centerNotifications: NotificationDisplay[] = [];
    const bottomNotifications: NotificationDisplay[] = [];
    
    this.notifications.forEach(display => {
      switch (display.notification.position) {
        case 'top':
          topNotifications.push(display);
          break;
        case 'center':
          centerNotifications.push(display);
          break;
        case 'bottom':
          bottomNotifications.push(display);
          break;
      }
    });
    
    // Position each group
    let y = 20;
    topNotifications.forEach(display => {
      display.container.y = y;
      y += display.container.height + 10;
    });
    
    const centerY = this.app.screen.height / 2;
    centerNotifications.forEach((display, index) => {
      display.container.y = centerY + (index - centerNotifications.length / 2) * (display.container.height + 10);
    });
    
    y = this.app.screen.height - 20;
    bottomNotifications.reverse().forEach(display => {
      y -= display.container.height;
      display.container.y = y;
      y -= 10;
    });
  }
}

class NotificationDisplay {
  container: PIXI.Container;
  notification: Notification;
  private app: PIXI.Application;
  private background: PIXI.Graphics;
  private text: PIXI.Text;
  private age: number = 0;
  
  constructor(notification: Notification, app: PIXI.Application) {
    this.notification = notification;
    this.app = app;
    this.container = new PIXI.Container();
    
    // Create background
    this.background = new PIXI.Graphics();
    this.container.addChild(this.background);
    
    // Create text
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 400
    });
    
    this.text = new PIXI.Text(notification.message, style);
    this.text.x = 20;
    this.text.y = 10;
    this.container.addChild(this.text);
    
    // Draw background
    const width = this.text.width + 40;
    const height = this.text.height + 20;
    
    const colors = {
      info: 0x3498db,
      success: 0x2ecc71,
      warning: 0xf39c12,
      error: 0xe74c3c,
      epic: 0x9b59b6
    };
    
    this.background.clear();
    this.background.roundRect(0, 0, width, height, 10);
    this.background.fill({ color: colors[notification.type], alpha: 0.9 });
    
    // Center container
    this.container.x = (app.screen.width - width) / 2;
    
    // Add entrance animation
    this.container.alpha = 0;
    this.container.scale.set(0.8);
  }
  
  update(deltaTime: number): void {
    this.age += deltaTime;
    
    // Entrance animation
    if (this.age < 300) {
      const progress = this.age / 300;
      this.container.alpha = progress;
      this.container.scale.set(0.8 + 0.2 * progress);
    }
    
    // Exit animation
    const exitTime = this.notification.duration - 300;
    if (this.age > exitTime) {
      const progress = (this.age - exitTime) / 300;
      this.container.alpha = 1 - progress;
      this.container.scale.set(1 - 0.2 * progress);
    }
  }
  
  destroy(): void {
    this.container.destroy(true);
  }
}