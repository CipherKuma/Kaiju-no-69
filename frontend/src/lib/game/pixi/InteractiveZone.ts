import * as PIXI from 'pixi.js';

export interface InteractiveZoneConfig {
  id: string;
  type: 'chat' | 'trading' | 'statistics';
  position: { x: number; y: number };
  radius: number;
  texture?: PIXI.Texture;
}

export class InteractiveZone extends PIXI.Container {
  public id: string;
  private zoneType: 'chat' | 'trading' | 'statistics';
  private radius: number;
  private zoneSprite: PIXI.Graphics;
  private tooltip: PIXI.Container | null = null;
  private activityIndicator: PIXI.Graphics;
  private isPlayerInside: boolean = false;
  private animationPhase: number = 0;
  private pulseIntensity: number = 0;
  private eventEmitter: PIXI.EventEmitter;
  private texture?: PIXI.Texture;
  
  // Enhanced UI overlays
  private uiOverlay: PIXI.Container | null = null;
  private speechBubbles: PIXI.Container[] = [];
  private tradingParticles: PIXI.Graphics[] = [];
  private dataVisualization: PIXI.Graphics | null = null;
  private overlayTimer: number = 0;

  constructor(config: InteractiveZoneConfig) {
    super();
    
    this.id = config.id;
    this.zoneType = config.type;
    this.radius = config.radius;
    this.texture = config.texture;
    this.eventEmitter = new PIXI.EventEmitter();
    
    this.position.set(config.position.x, config.position.y);
    
    this.createZoneVisuals();
    this.createActivityIndicator();
    this.setupInteractions();
  }

  private createZoneVisuals(): void {
    this.zoneSprite = new PIXI.Graphics();
    this.updateZoneVisuals();
    this.addChild(this.zoneSprite);
  }

  private updateZoneVisuals(): void {
    this.zoneSprite.clear();
    
    // Only show the icon/texture without any borders or circles
    this.addZoneIcon();
  }

  private getZoneColors(): { primary: number; secondary: number; accent: number } {
    switch (this.zoneType) {
      case 'chat':
        return { primary: 0x4CAF50, secondary: 0x8BC34A, accent: 0xCDDC39 };
      case 'trading':
        return { primary: 0xFFB74D, secondary: 0xFF9800, accent: 0xFFC107 };
      case 'statistics':
        return { primary: 0x9C27B0, secondary: 0xE91E63, accent: 0xF44336 };
    }
  }

  private addZoneIcon(): void {
    if (this.texture) {
      // Use the provided texture at natural size
      const iconSprite = new PIXI.Sprite(this.texture);
      iconSprite.anchor.set(0.5);
      // Scale to a reasonable size (60 pixels max width/height)
      const maxSize = 60;
      const scale = Math.min(maxSize / this.texture.width, maxSize / this.texture.height);
      iconSprite.scale.set(scale);
      iconSprite.alpha = 1.0; // Full opacity
      this.zoneSprite.addChild(iconSprite);
    } else {
      // Fallback to simple procedural icons
      const iconSize = 30;
      const iconGraphics = new PIXI.Graphics();
      iconGraphics.lineStyle(3, 0xFFFFFF, 0.9);
      
      switch (this.zoneType) {
        case 'chat':
          this.drawChatIcon(iconGraphics, iconSize);
          break;
        case 'trading':
          this.drawTradingIcon(iconGraphics, iconSize);
          break;
        case 'statistics':
          this.drawStatisticsIcon(iconGraphics, iconSize);
          break;
      }
      
      this.zoneSprite.addChild(iconGraphics);
    }
  }

  private drawChatIcon(graphics: PIXI.Graphics, size: number): void {
    // Speech bubble
    const bubbleWidth = size * 0.8;
    const bubbleHeight = size * 0.6;
    
    graphics.beginFill(0xFFFFFF, 0.2);
    graphics.drawRoundedRect(-bubbleWidth/2, -bubbleHeight/2, bubbleWidth, bubbleHeight, 8);
    graphics.endFill();
    
    // Dots inside bubble
    const dotRadius = 2;
    graphics.beginFill(0xFFFFFF, 0.8);
    graphics.drawCircle(-bubbleWidth/4, 0, dotRadius);
    graphics.drawCircle(0, 0, dotRadius);
    graphics.drawCircle(bubbleWidth/4, 0, dotRadius);
    graphics.endFill();
  }

  private drawTradingIcon(graphics: PIXI.Graphics, size: number): void {
    // Trading arrows
    const arrowSize = size * 0.3;
    
    // Up arrow
    graphics.moveTo(-arrowSize/2, arrowSize/2);
    graphics.lineTo(0, -arrowSize/2);
    graphics.lineTo(arrowSize/2, arrowSize/2);
    
    // Down arrow
    graphics.moveTo(-arrowSize/2, -arrowSize/2);
    graphics.lineTo(0, arrowSize/2);
    graphics.lineTo(arrowSize/2, -arrowSize/2);
    
    // Coin representation
    graphics.lineStyle(2, 0xFFD700, 0.8);
    graphics.drawCircle(arrowSize, 0, arrowSize/3);
  }

  private drawStatisticsIcon(graphics: PIXI.Graphics, size: number): void {
    // Bar chart
    const barWidth = size * 0.15;
    const spacing = barWidth * 0.5;
    const heights = [0.4, 0.7, 0.5, 0.9];
    
    heights.forEach((height, index) => {
      const x = (index - heights.length/2) * (barWidth + spacing);
      const barHeight = size * height;
      
      graphics.beginFill(0xFFFFFF, 0.6);
      graphics.drawRect(x - barWidth/2, -barHeight/2, barWidth, barHeight);
      graphics.endFill();
    });
  }

  private createActivityIndicator(): void {
    this.activityIndicator = new PIXI.Graphics();
    this.updateActivityIndicator();
    this.addChild(this.activityIndicator);
  }

  private updateActivityIndicator(): void {
    this.activityIndicator.clear();
    
    if (this.zoneType === 'trading') {
      // Show trading activity with moving particles
      const particleCount = 5;
      for (let i = 0; i < particleCount; i++) {
        const angle = (this.animationPhase + i * Math.PI * 2 / particleCount) % (Math.PI * 2);
        const distance = this.radius * 0.8;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        this.activityIndicator.beginFill(0xFFD700, 0.6);
        this.activityIndicator.drawCircle(x, y, 3);
        this.activityIndicator.endFill();
      }
    } else if (this.zoneType === 'statistics') {
      // Show data visualization effect
      const dataPoints = 8;
      for (let i = 0; i < dataPoints; i++) {
        const angle = (i * Math.PI * 2 / dataPoints);
        const baseDistance = this.radius * 0.6;
        const distance = baseDistance + Math.sin(this.animationPhase * 2 + i) * 10;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        this.activityIndicator.lineStyle(2, 0xFF6B6B, 0.4);
        if (i === 0) {
          this.activityIndicator.moveTo(x, y);
        } else {
          this.activityIndicator.lineTo(x, y);
        }
      }
    }
  }

  private setupInteractions(): void {
    this.interactive = true;
    this.buttonMode = true;
    
    this.on('pointerdown', () => {
      this.eventEmitter.emit('interact');
    });
  }

  showTooltip(): void {
    if (this.tooltip) return;
    
    this.tooltip = new PIXI.Container();
    
    // Enhanced tooltip based on zone type
    this.createEnhancedTooltip();
    
    this.tooltip.y = -this.radius - 40;
    this.addChild(this.tooltip);
    
    // Show zone-specific UI overlay
    this.showUIOverlay();
  }
  
  private createEnhancedTooltip(): void {
    if (!this.tooltip) return;
    
    // Background with zone-specific styling
    const colors = this.getZoneColors();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.lineStyle(2, colors.primary, 0.8);
    bg.drawRoundedRect(-60, -35, 120, 30, 8);
    bg.endFill();
    
    // Main text
    const text = new PIXI.Text(this.getTooltipText(), {
      fontSize: 14,
      fill: colors.primary,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    text.anchor.set(0.5);
    text.y = -25;
    
    // Subtitle
    const subtitle = new PIXI.Text(this.getTooltipSubtitle(), {
      fontSize: 10,
      fill: 0xCCCCCC,
      fontFamily: 'Arial'
    });
    subtitle.anchor.set(0.5);
    subtitle.y = -10;
    
    this.tooltip.addChild(bg);
    this.tooltip.addChild(text);
    this.tooltip.addChild(subtitle);
  }

  hideTooltip(): void {
    if (this.tooltip) {
      this.removeChild(this.tooltip);
      this.tooltip.destroy();
      this.tooltip = null;
    }
    
    this.hideUIOverlay();
  }

  private getTooltipText(): string {
    switch (this.zoneType) {
      case 'chat':
        return 'Chat Zone';
      case 'trading':
        return 'Trading Post';
      case 'statistics':
        return 'Statistics Shrine';
      default:
        return 'Interactive Zone';
    }
  }
  
  private getTooltipSubtitle(): string {
    switch (this.zoneType) {
      case 'chat':
        return 'Click to communicate';
      case 'trading':
        return 'View live trading activity';
      case 'statistics':
        return 'Performance analytics';
      default:
        return 'Interactive area';
    }
  }

  update(deltaTime: number, playerPosition: { x: number; y: number } | null): void {
    this.animationPhase += deltaTime * 0.002;
    this.overlayTimer += deltaTime;
    
    // Update pulse effect
    this.pulseIntensity = (Math.sin(this.animationPhase * 2) + 1) / 2;
    this.zoneSprite.alpha = 0.6 + this.pulseIntensity * 0.3;
    
    // Check player proximity
    if (playerPosition) {
      const dx = playerPosition.x - this.position.x;
      const dy = playerPosition.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const wasInside = this.isPlayerInside;
      this.isPlayerInside = distance <= this.radius;
      
      if (this.isPlayerInside !== wasInside) {
        this.updateZoneVisuals();
        
        if (this.isPlayerInside) {
          this.eventEmitter.emit('enter');
        } else {
          this.eventEmitter.emit('exit');
        }
      }
    }
    
    // Update activity indicators
    this.updateActivityIndicator();
    
    // Update UI overlays
    this.updateUIOverlays(deltaTime);
  }
  
  private showUIOverlay(): void {
    if (this.uiOverlay) return;
    
    this.uiOverlay = new PIXI.Container();
    
    switch (this.zoneType) {
      case 'chat':
        this.createChatOverlay();
        break;
      case 'trading':
        this.createTradingOverlay();
        break;
      case 'statistics':
        this.createStatisticsOverlay();
        break;
    }
    
    if (this.uiOverlay.children.length > 0) {
      this.addChild(this.uiOverlay);
    }
  }
  
  private hideUIOverlay(): void {
    if (this.uiOverlay) {
      this.removeChild(this.uiOverlay);
      this.uiOverlay.destroy();
      this.uiOverlay = null;
    }
    
    // Clean up specific overlays
    this.speechBubbles.forEach(bubble => bubble.destroy());
    this.speechBubbles = [];
    this.tradingParticles.forEach(particle => particle.destroy());
    this.tradingParticles = [];
    if (this.dataVisualization) {
      this.dataVisualization.destroy();
      this.dataVisualization = null;
    }
  }

  getType(): 'chat' | 'trading' | 'statistics' {
    return this.zoneType;
  }

  isPlayerInZone(): boolean {
    return this.isPlayerInside;
  }

  on(event: string, fn: (...args: unknown[]) => void): this {
    this.eventEmitter.on(event, fn);
    return this;
  }

  off(event: string, fn: (...args: unknown[]) => void): this {
    this.eventEmitter.off(event, fn);
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }

  private createChatOverlay(): void {
    if (!this.uiOverlay) return;
    
    // Create animated speech bubbles
    const messages = [
      "Welcome to the territory!",
      "Trading going well today",
      "Check out my latest strategy",
      "Shadow performance looks good"
    ];
    
    for (let i = 0; i < 3; i++) {
      const bubble = this.createSpeechBubble(messages[i % messages.length], i);
      this.speechBubbles.push(bubble);
      this.uiOverlay.addChild(bubble);
    }
  }
  
  private createSpeechBubble(message: string, index: number): PIXI.Container {
    const bubble = new PIXI.Container();
    
    // Position bubbles around the zone
    const angle = (index * Math.PI * 2) / 3;
    const distance = this.radius + 40;
    bubble.x = Math.cos(angle) * distance;
    bubble.y = Math.sin(angle) * distance;
    
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0xFFFFFF, 0.9);
    bg.lineStyle(2, 0x4CAF50, 0.8);
    bg.drawRoundedRect(-40, -15, 80, 30, 10);
    bg.endFill();
    
    // Tail
    bg.beginFill(0xFFFFFF, 0.9);
    bg.moveTo(-5, 15);
    bg.lineTo(0, 25);
    bg.lineTo(5, 15);
    bg.closePath();
    bg.endFill();
    
    // Text
    const text = new PIXI.Text(message, {
      fontSize: 10,
      fill: 0x333333,
      fontFamily: 'Arial',
      wordWrap: true,
      wordWrapWidth: 70,
      align: 'center'
    });
    text.anchor.set(0.5);
    
    bubble.addChild(bg);
    bubble.addChild(text);
    bubble.alpha = 0.7;
    
    return bubble;
  }
  
  private createTradingOverlay(): void {
    if (!this.uiOverlay) return;
    
    // Create animated trading particles
    for (let i = 0; i < 8; i++) {
      const particle = new PIXI.Graphics();
      this.tradingParticles.push(particle);
      this.uiOverlay.addChild(particle);
    }
    
    // Add trading activity indicators
    const activityText = new PIXI.Text('🔥 High Activity', {
      fontSize: 12,
      fill: 0xFFB74D,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    activityText.anchor.set(0.5);
    activityText.y = -this.radius - 60;
    this.uiOverlay.addChild(activityText);
  }
  
  private createStatisticsOverlay(): void {
    if (!this.uiOverlay) return;
    
    this.dataVisualization = new PIXI.Graphics();
    this.uiOverlay.addChild(this.dataVisualization);
    
    // Add stats text
    const statsText = new PIXI.Text('📊 Live Analytics', {
      fontSize: 12,
      fill: 0x9C27B0,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    });
    statsText.anchor.set(0.5);
    statsText.y = -this.radius - 60;
    this.uiOverlay.addChild(statsText);
  }
  
  private updateUIOverlays(deltaTime: number): void {
    if (!this.uiOverlay || !this.isPlayerInside) return;
    
    switch (this.zoneType) {
      case 'chat':
        this.updateChatOverlay(deltaTime);
        break;
      case 'trading':
        this.updateTradingOverlay(deltaTime);
        break;
      case 'statistics':
        this.updateStatisticsOverlay(deltaTime);
        break;
    }
  }
  
  private updateChatOverlay(deltaTime: number): void {
    // Gentle floating animation for speech bubbles
    this.speechBubbles.forEach((bubble, index) => {
      const phaseOffset = index * Math.PI * 0.66;
      bubble.y += Math.sin(this.overlayTimer * 0.001 + phaseOffset) * 0.3;
      
      // Fade in/out randomly for dynamic effect
      if (Math.random() < 0.01) {
        bubble.alpha = 0.4 + Math.random() * 0.6;
      }
    });
  }
  
  private updateTradingOverlay(deltaTime: number): void {
    // Animate trading particles in a spiral
    this.tradingParticles.forEach((particle, index) => {
      const angle = (this.overlayTimer * 0.003 + index * Math.PI * 0.25) % (Math.PI * 2);
      const distance = 30 + Math.sin(this.overlayTimer * 0.002 + index) * 10;
      
      particle.clear();
      particle.beginFill(0xFFD700, 0.8);
      particle.drawCircle(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        2 + Math.sin(this.overlayTimer * 0.005 + index) * 1
      );
      particle.endFill();
    });
  }
  
  private updateStatisticsOverlay(deltaTime: number): void {
    if (!this.dataVisualization) return;
    
    this.dataVisualization.clear();
    
    // Create animated data visualization
    const centerX = 0;
    const centerY = 0;
    const dataPoints = 12;
    
    this.dataVisualization.lineStyle(2, 0x9C27B0, 0.6);
    
    for (let i = 0; i < dataPoints; i++) {
      const angle = (i * Math.PI * 2) / dataPoints;
      const baseRadius = 25;
      const variation = Math.sin(this.overlayTimer * 0.002 + i * 0.5) * 8;
      const radius = baseRadius + variation;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.dataVisualization.moveTo(x, y);
      } else {
        this.dataVisualization.lineTo(x, y);
      }
      
      // Add data points
      this.dataVisualization.beginFill(0xE91E63, 0.7);
      this.dataVisualization.drawCircle(x, y, 2);
      this.dataVisualization.endFill();
    }
    
    // Close the loop
    const firstAngle = 0;
    const firstRadius = baseRadius + Math.sin(this.overlayTimer * 0.002) * 8;
    this.dataVisualization.lineTo(
      centerX + Math.cos(firstAngle) * firstRadius,
      centerY + Math.sin(firstAngle) * firstRadius
    );
  }
  
  destroy(): void {
    this.hideTooltip();
    this.hideUIOverlay();
    this.eventEmitter.removeAllListeners();
    super.destroy();
  }
}