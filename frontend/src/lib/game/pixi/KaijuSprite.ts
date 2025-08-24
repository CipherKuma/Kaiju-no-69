import * as PIXI from 'pixi.js';
import { PixelCharacterSprite } from './sprites/PixelCharacterSprite';

export type KaijuAnimationState = 'idle' | 'walking' | 'trading' | 'attack' | 'hurt' | 'victory';

export interface KaijuSpriteOptions {
  id: string;
  texture?: PIXI.Texture;
  animations?: Record<KaijuAnimationState, PIXI.Texture[]>;
  scale?: number;
  position?: { x: number; y: number };
  usePixelArt?: boolean;
  renderer?: PIXI.Renderer;
}

export class KaijuSprite extends PIXI.Container {
  private sprite: PIXI.AnimatedSprite | null = null;
  private pixelSprite: PixelCharacterSprite | null = null;
  private currentState: KaijuAnimationState = 'idle';
  private animations: Record<KaijuAnimationState, PIXI.Texture[]>;
  private baseScale: number;
  private usePixelArt: boolean;
  public id: string;
  public velocity: { x: number; y: number } = { x: 0, y: 0 };
  public isFlipped: boolean = false;

  constructor(options: KaijuSpriteOptions) {
    super();
    
    this.id = options.id;
    this.baseScale = options.scale || 1;
    this.usePixelArt = options.usePixelArt === true; // Default to false, only use if explicitly requested
    
    if (this.usePixelArt) {
      // Use our new pixel art character
      this.pixelSprite = new PixelCharacterSprite({
        id: options.id,
        type: 'kaiju',
        position: options.position || { x: 0, y: 0 },
        scale: this.baseScale * 0.15, // Reduce pixel art scale further
        renderer: options.renderer,
      });
      
      if (this.pixelSprite) {
        this.addChild(this.pixelSprite);
      } else {
        console.error('Failed to create pixelSprite for KaijuSprite');
      }
    } else if (options.texture) {
      // Use traditional sprite approach
      if (options.animations) {
        this.animations = options.animations;
        this.sprite = new PIXI.AnimatedSprite(this.animations.idle);
      } else {
        this.animations = {
          idle: [options.texture],
          walking: [options.texture],
          trading: [options.texture],
          attack: [options.texture],
          hurt: [options.texture],
          victory: [options.texture],
        };
        this.sprite = new PIXI.AnimatedSprite([options.texture]);
      }

      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(this.baseScale);
      this.sprite.animationSpeed = 0.1;
      this.sprite.play();

      this.addChild(this.sprite);
    }

    if (options.position) {
      this.position.set(options.position.x, options.position.y);
    }

    this.addShadow();
    this.addNameTag(options.id);
  }

  private addShadow(): void {
    const shadow = new PIXI.Graphics();
    let shadowWidth: number;
    let shadowY: number;
    
    if (this.usePixelArt && this.pixelSprite) {
      shadowWidth = 20; // Smaller size for smaller kaijus
      shadowY = 15;
    } else if (this.sprite) {
      shadowWidth = this.sprite.width * 0.8;
      shadowY = this.sprite.height * 0.5;
    } else {
      return;
    }
    
    const shadowHeight = 8;
    shadow.ellipse(0, shadowY, shadowWidth / 2, shadowHeight / 2);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    
    this.addChildAt(shadow, 0);
  }

  private addNameTag(name: string): void {
    const nameTag = new PIXI.Text({
      text: name,
      style: {
        fontFamily: 'Arial',
        fontSize: 8,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
        align: 'center',
      },
    });
    
    nameTag.anchor.set(0.5);
    
    if (this.usePixelArt) {
      nameTag.y = -20; // Adjusted for smaller kaijus
    } else if (this.sprite) {
      nameTag.y = -this.sprite.height * 0.6;
    }
    
    this.addChild(nameTag);
  }

  setState(state: KaijuAnimationState): void {
    if (this.currentState === state) return;

    this.currentState = state;
    
    if (this.sprite && this.animations) {
      this.sprite.textures = this.animations[state];
      this.sprite.play();

      switch (state) {
        case 'walking':
          this.sprite.animationSpeed = 0.15;
          break;
        case 'attack':
          this.sprite.animationSpeed = 0.2;
          this.sprite.loop = false;
          this.sprite.onComplete = () => this.setState('idle');
          break;
        case 'hurt':
          this.sprite.animationSpeed = 0.1;
          this.sprite.loop = false;
          this.sprite.onComplete = () => this.setState('idle');
          break;
        case 'victory':
          this.sprite.animationSpeed = 0.12;
          break;
        default:
          this.sprite.animationSpeed = 0.1;
          this.sprite.loop = true;
      }
    } else if (this.pixelSprite) {
      // Handle pixel sprite animation states if setState exists
      if (typeof this.pixelSprite.setState === 'function') {
        this.pixelSprite.setState(state);
      }
    }
  }

  flip(horizontal: boolean = true): void {
    if (this.sprite) {
      if (horizontal) {
        this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
        this.isFlipped = true;
      } else {
        this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        this.isFlipped = false;
      }
    } else if (this.pixelSprite && typeof this.pixelSprite.flip === 'function') {
      this.pixelSprite.flip(horizontal);
      this.isFlipped = horizontal;
    }
  }

  move(deltaX: number, deltaY: number): void {
    this.position.x += deltaX;
    this.position.y += deltaY;

    if (deltaX !== 0) {
      this.flip(deltaX < 0);
    }

    if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
      this.setState('walking');
    } else {
      this.setState('idle');
    }
  }


  getBounds(): PIXI.Rectangle {
    if (this.sprite) {
      return this.sprite.getBounds();
    } else if (this.pixelSprite) {
      return this.pixelSprite.getBounds();
    } else {
      // Return default bounds if no sprite is available
      return new PIXI.Rectangle(this.position.x - 25, this.position.y - 25, 50, 50);
    }
  }

  playEmote(emoteType: 'happy' | 'sad' | 'angry' | 'surprised'): void {
    const emote = new PIXI.Text({
      text: this.getEmoteEmoji(emoteType),
      style: { fontSize: 24 },
    });
    
    emote.anchor.set(0.5);
    
    if (this.sprite) {
      emote.y = -this.sprite.height * 0.8;
    } else if (this.pixelSprite) {
      emote.y = -60; // Fixed height for pixel sprites
    } else {
      emote.y = -40; // Default height
    }
    
    this.addChild(emote);

    const duration = 1000;
    const startY = emote.y;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      emote.y = startY - 20 * progress;
      emote.alpha = 1 - progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.removeChild(emote);
        emote.destroy();
      }
    };

    animate();
  }

  private getEmoteEmoji(type: 'happy' | 'sad' | 'angry' | 'surprised'): string {
    const emotes = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
    };
    return emotes[type];
  }

  destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.pixelSprite) {
      this.pixelSprite.destroy();
    }
    super.destroy(true);
  }
  
  update(deltaTime: number): void {
    if (this.pixelSprite) {
      this.pixelSprite.update(deltaTime);
    }
    
    // Update position based on velocity
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.move(this.velocity.x * deltaTime, this.velocity.y * deltaTime);
    }
  }
  
  moveTo(x: number, y: number): void {
    if (this.pixelSprite) {
      this.pixelSprite.moveTo(x, y);
    } else {
      // For non-pixel sprites, set velocity to move towards target
      const dx = x - this.position.x;
      const dy = y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        this.velocity.x = (dx / distance) * 2;
        this.velocity.y = (dy / distance) * 2;
      } else {
        this.velocity.x = 0;
        this.velocity.y = 0;
      }
    }
  }
}