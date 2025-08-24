import * as PIXI from 'pixi.js';
import { PixelCharacterSprite } from './sprites/PixelCharacterSprite';

export interface ShadowConfig {
  id: string;
  type: 'follower' | 'user' | 'player';
  position: { x: number; y: number };
  target?: PIXI.DisplayObject;
  followDistance?: number;
  opacity?: number;
  isUserControlled?: boolean;
  followDelay?: number;
  formationIndex?: number;
  formationOffset?: { x: number; y: number };
  usePixelArt?: boolean;
  texture?: PIXI.Texture;
}

export class ShadowSprite extends PIXI.Container {
  public id: string;
  private shadowType: 'follower' | 'user' | 'player';
  private sprite: PIXI.Sprite | null = null;
  private pixelSprite: PixelCharacterSprite | null = null;
  private target?: PIXI.DisplayObject;
  private followDistance: number;
  private moveSpeed: number = 120; // pixels per second
  private isMoving: boolean = false;
  private targetPosition: { x: number; y: number } | null = null;
  private trail: PIXI.Graphics[] = [];
  private trailLength: number = 10;
  private animationPhase: number = 0;
  private usePixelArt: boolean;
  
  // Enhanced following behavior
  private followDelay: number;
  private formationIndex: number;
  private formationOffset: { x: number; y: number };
  private targetHistory: { x: number; y: number; timestamp: number }[] = [];
  private maxHistoryLength: number = 60; // Store 1 second of history at 60fps
  private smoothingFactor: number = 0.15;
  private lastKnownTargetPosition: { x: number; y: number } | null = null;
  
  // Enhanced visual effects
  private etherealParticles: PIXI.Graphics[] = [];
  private fadeAnimation: number = 0;
  private baseOpacity: number;

  constructor(config: ShadowConfig) {
    super();
    
    this.id = config.id;
    this.shadowType = config.type;
    this.target = config.target;
    this.followDistance = config.followDistance || 50;
    this.followDelay = config.followDelay || 0;
    this.formationIndex = config.formationIndex || 0;
    this.formationOffset = config.formationOffset || { x: 0, y: 0 };
    this.baseOpacity = config.opacity || 0.6;
    this.usePixelArt = config.usePixelArt === true; // Default to false
    
    this.position.set(config.position.x, config.position.y);
    
    // Initialize target history for delayed following
    if (this.target) {
      this.lastKnownTargetPosition = {
        x: this.target.position.x,
        y: this.target.position.y
      };
    }
    
    if (this.usePixelArt) {
      // Use pixel art character
      this.pixelSprite = new PixelCharacterSprite({
        id: config.id,
        type: config.type === 'user' ? 'player' : 'shadow',
        position: { x: 0, y: 0 }, // Relative to this container
        scale: 0.3,
        tint: this.shadowType === 'user' ? 0x6A5ACD : undefined
      });
      
      this.pixelSprite.setAlpha(this.baseOpacity);
      if (this.pixelSprite) {
        this.addChild(this.pixelSprite);
      } else {
        console.error('Failed to create pixelSprite for ShadowSprite');
      }
    } else if (config.texture) {
      // Use provided texture
      this.sprite = new PIXI.Sprite(config.texture);
      this.sprite.anchor.set(0.5);
      this.sprite.alpha = this.baseOpacity;
      this.sprite.scale.set(0.3); // Scale down shadow textures to match smaller kaijus
      this.sprite.tint = this.shadowType === 'user' ? 0x9999FF : 0xCCCCCC;
      
      if (this.sprite) {
        this.addChild(this.sprite);
      }
    } else {
      this.createShadowSprite(this.baseOpacity);
    }
    
    this.setupTrail();
    this.createEtherealEffects();
    
    if (config.isUserControlled) {
      this.setupUserShadowEffects();
    }
  }

  private createShadowSprite(opacity: number): void {
    // Create shadow texture procedurally
    const shadowTexture = this.createShadowTexture();
    this.sprite = new PIXI.Sprite(shadowTexture);
    
    this.sprite.anchor.set(0.5);
    this.sprite.alpha = opacity;
    this.sprite.tint = this.shadowType === 'user' ? 0x4A90E2 : 0x666666;
    
    // Add subtle glow effect (if available)
    try {
      // Note: GlowFilter might require additional packages in PIXI.js v8+
      // For now, we'll skip the glow effect to avoid import issues
      // TODO: Install @pixi/filter-glow if needed
    } catch (e) {
      console.warn('GlowFilter not available:', e);
    }
    
    if (this.sprite) {
      this.addChild(this.sprite);
    } else {
      console.error('Failed to create sprite for ShadowSprite');
    }
  }

  private createShadowTexture(): PIXI.Texture {
    const canvas = document.createElement('canvas');
    const size = this.shadowType === 'user' ? 48 : 36;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient for shadow effect
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    if (this.shadowType === 'user') {
      gradient.addColorStop(0, 'rgba(74, 144, 226, 0.9)');
      gradient.addColorStop(0.7, 'rgba(74, 144, 226, 0.5)');
      gradient.addColorStop(1, 'rgba(74, 144, 226, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
      gradient.addColorStop(0.7, 'rgba(50, 50, 50, 0.3)');
      gradient.addColorStop(1, 'rgba(50, 50, 50, 0)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add some ethereal patterns
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 8 + 2;
      
      const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return PIXI.Texture.from(canvas);
  }

  private setupTrail(): void {
    this.trail = [];
    for (let i = 0; i < this.trailLength; i++) {
      const trailPiece = new PIXI.Graphics();
      trailPiece.alpha = 0;
      this.addChildAt(trailPiece, 0); // Add behind the main sprite
      this.trail.push(trailPiece);
    }
  }

  private setupUserShadowEffects(): void {
    if (this.sprite) {
      // Add floating animation
      this.sprite.scale.set(1.1);
      
      // Add pulsing effect
      setInterval(() => {
        if (!this.isMoving && this.sprite) {
          const pulseScale = 1.1 + Math.sin(Date.now() * 0.003) * 0.1;
          this.sprite.scale.set(pulseScale);
        }
      }, 16); // ~60fps
    } else if (this.pixelSprite) {
      // Add pulsing effect for pixel sprite
      setInterval(() => {
        if (!this.isMoving && this.pixelSprite) {
          const pulseScale = 1.1 + Math.sin(Date.now() * 0.003) * 0.1;
          this.pixelSprite.scale.set(pulseScale);
        }
      }, 16); // ~60fps
    }
  }
  
  private createEtherealEffects(): void {
    if (this.shadowType === 'follower') {
      // Create ethereal particles for ghostly appearance
      for (let i = 0; i < 3; i++) {
        const particle = new PIXI.Graphics();
        particle.alpha = 0;
        this.addChild(particle);
        this.etherealParticles.push(particle);
      }
    }
  }
  
  private updateEtherealEffects(deltaTime: number): void {
    if (this.shadowType !== 'follower' || this.etherealParticles.length === 0) return;
    
    this.fadeAnimation += deltaTime * 0.003;
    
    this.etherealParticles.forEach((particle, index) => {
      const phaseOffset = index * Math.PI * 0.66;
      const fade = (Math.sin(this.fadeAnimation + phaseOffset) + 1) * 0.5;
      const radius = 2 + fade * 3;
      
      particle.clear();
      particle.beginFill(0xFFFFFF, fade * 0.3);
      particle.drawCircle(
        Math.sin(this.fadeAnimation * 2 + phaseOffset) * 15,
        Math.cos(this.fadeAnimation * 1.5 + phaseOffset) * 10,
        radius
      );
      particle.endFill();
    });
  }
  
  private updateTargetHistory(): void {
    if (!this.target) return;
    
    const currentTime = Date.now();
    const currentPos = {
      x: this.target.position.x,
      y: this.target.position.y,
      timestamp: currentTime
    };
    
    this.targetHistory.push(currentPos);
    this.lastKnownTargetPosition = { x: currentPos.x, y: currentPos.y };
    
    // Remove old history entries
    const maxAge = currentTime - 2000; // Keep 2 seconds of history
    this.targetHistory = this.targetHistory.filter(pos => pos.timestamp > maxAge);
    
    // Limit array size
    if (this.targetHistory.length > this.maxHistoryLength) {
      this.targetHistory.shift();
    }
  }
  
  private getDelayedTargetPosition(): { x: number; y: number } | null {
    if (this.targetHistory.length === 0) {
      return this.lastKnownTargetPosition;
    }
    
    const currentTime = Date.now();
    const targetTime = currentTime - (this.followDelay * 1000);
    
    // Find the closest position in history
    let closestPos = this.targetHistory[0];
    let minTimeDiff = Math.abs(closestPos.timestamp - targetTime);
    
    for (const pos of this.targetHistory) {
      const timeDiff = Math.abs(pos.timestamp - targetTime);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestPos = pos;
      }
    }
    
    return { x: closestPos.x, y: closestPos.y };
  }
  
  private calculateFormationPosition(targetPos: { x: number; y: number }): { x: number; y: number } {
    // Calculate position based on formation offset and follow distance
    const angle = Math.atan2(this.formationOffset.y, this.formationOffset.x);
    const totalDistance = this.followDistance + Math.sqrt(
      this.formationOffset.x * this.formationOffset.x + 
      this.formationOffset.y * this.formationOffset.y
    );
    
    return {
      x: targetPos.x + Math.cos(angle) * totalDistance + this.formationOffset.x,
      y: targetPos.y + Math.sin(angle) * totalDistance + this.formationOffset.y
    };
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  moveToPosition(targetPos: { x: number; y: number }): void {
    this.targetPosition = { ...targetPos };
    this.isMoving = true;
  }

  moveToPositionSmooth(targetPos: { x: number; y: number }, duration: number = 0.5): void {
    const startPos = { x: this.position.x, y: this.position.y };
    const targetPosition = { ...targetPos };
    let elapsed = 0;

    const smoothMove = () => {
      elapsed += 0.016; // ~60fps
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOutCubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.position.x = this.lerp(startPos.x, targetPosition.x, eased);
      this.position.y = this.lerp(startPos.y, targetPosition.y, eased);
      
      if (progress < 1) {
        requestAnimationFrame(smoothMove);
      }
    };
    
    smoothMove();
  }

  private updateMovement(deltaTime: number): void {
    if (this.shadowType === 'follower' && this.target) {
      this.updateFollowerMovement(deltaTime);
    } else if (this.shadowType === 'user' && this.targetPosition) {
      this.updateUserMovement(deltaTime);
    }
  }

  private updateFollowerMovement(deltaTime: number): void {
    if (!this.target) return;
    
    // Update target position history for delayed following
    this.updateTargetHistory();
    
    // Get delayed target position based on follow delay
    const delayedTargetPos = this.getDelayedTargetPosition();
    if (!delayedTargetPos) return;
    
    // Calculate formation position
    const formationPos = this.calculateFormationPosition(delayedTargetPos);
    
    // Smooth interpolation to formation position
    const dx = formationPos.x - this.position.x;
    const dy = formationPos.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const minDistance = 3; // Minimum distance to consider moving
    
    if (distance > minDistance) {
      // Use smooth interpolation with adaptive speed
      const adaptiveSpeed = Math.min(distance * 2, this.moveSpeed); // Speed increases with distance
      const speed = adaptiveSpeed * deltaTime / 1000 * this.smoothingFactor;
      
      this.position.x += dx * speed;
      this.position.y += dy * speed;
      this.isMoving = true;
      
      // Update sprite rotation to face movement direction
      if (distance > 10 && this.sprite) {
        const targetRotation = Math.atan2(dy, dx);
        this.sprite.rotation = this.lerp(this.sprite.rotation, targetRotation, 0.1);
      }
    } else {
      this.isMoving = false;
    }
    
    // Enhanced floating motion with formation-specific phase offset
    this.animationPhase += deltaTime * 0.002;
    const phaseOffset = this.formationIndex * 0.5; // Stagger floating animation
    const floatY = Math.sin(this.animationPhase + phaseOffset) * 2;
    if (this.sprite) {
      this.sprite.y = floatY;
    }
  }

  private updateUserMovement(deltaTime: number): void {
    if (!this.targetPosition) return;
    
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 2) {
      const speed = this.moveSpeed * deltaTime / 1000;
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      this.position.x += normalizedX * speed;
      this.position.y += normalizedY * speed;
      this.isMoving = true;
    } else {
      this.targetPosition = null;
      this.isMoving = false;
    }
  }

  private updateTrail(deltaTime: number): void {
    if (!this.isMoving) {
      // Fade out trail when not moving
      this.trail.forEach((piece, index) => {
        piece.alpha *= 0.95;
        if (piece.alpha < 0.01) {
          piece.clear();
        }
      });
      return;
    }
    
    // Update trail positions
    for (let i = this.trail.length - 1; i > 0; i--) {
      const current = this.trail[i];
      const previous = this.trail[i - 1];
      
      current.position.copyFrom(previous.position);
      current.alpha = previous.alpha * 0.8;
    }
    
    // Update first trail piece to current position
    const firstTrail = this.trail[0];
    firstTrail.clear();
    firstTrail.beginFill(this.shadowType === 'user' ? 0x4A90E2 : 0x666666, 0.3);
    firstTrail.drawCircle(0, 0, 8);
    firstTrail.endFill();
    firstTrail.position.set(0, 0);
    firstTrail.alpha = 0.6;
  }

  private updateAnimation(deltaTime: number): void {
    if (this.isMoving && this.sprite) {
      // Add bobbing animation when moving
      this.animationPhase += deltaTime * 0.008;
      this.sprite.y = Math.sin(this.animationPhase) * 3;
      
      // Slight scale variation
      const scaleVariation = 1 + Math.sin(this.animationPhase * 1.5) * 0.05;
      this.sprite.scale.set(scaleVariation * (this.shadowType === 'user' ? 1.1 : 1));
    } else if (this.shadowType === 'user' && this.sprite) {
      // Gentle floating for user shadow when idle
      this.animationPhase += deltaTime * 0.003;
      this.sprite.y = Math.sin(this.animationPhase) * 2;
    }
  }

  update(deltaTime: number): void {
    this.updateMovement(deltaTime);
    this.updateTrail(deltaTime);
    this.updateAnimation(deltaTime);
    this.updateEtherealEffects(deltaTime);
    
    // Update pixel sprite if using pixel art
    if (this.pixelSprite) {
      this.pixelSprite.update(deltaTime);
    }
    
    // Update opacity based on movement and base opacity
    const targetAlpha = this.isMoving ? this.baseOpacity * 0.9 : this.baseOpacity;
    if (this.sprite) {
      this.sprite.alpha = this.lerp(this.sprite.alpha, targetAlpha, 0.05);
    } else if (this.pixelSprite && typeof this.pixelSprite.setAlpha === 'function') {
      const currentAlpha = this.pixelSprite.alpha || this.baseOpacity;
      this.pixelSprite.setAlpha(this.lerp(currentAlpha, targetAlpha, 0.05));
    }
  }

  getType(): 'follower' | 'user' {
    return this.shadowType;
  }

  isUserControlled(): boolean {
    return this.shadowType === 'user';
  }

  setFollowTarget(target: PIXI.DisplayObject | undefined, distance?: number): void {
    this.target = target;
    if (distance !== undefined) {
      this.followDistance = distance;
    }
  }

  destroy(): void {
    this.trail.forEach(piece => piece.destroy());
    this.trail = [];
    super.destroy();
  }
}