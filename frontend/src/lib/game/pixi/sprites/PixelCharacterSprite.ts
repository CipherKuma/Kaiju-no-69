import * as PIXI from 'pixi.js';

export interface CharacterAnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterAnimation {
  name: string;
  frames: CharacterAnimationFrame[];
  frameRate: number;
  loop: boolean;
}

export interface CharacterSpriteConfig {
  id: string;
  type: 'kaiju' | 'shadow' | 'player';
  position: { x: number; y: number };
  scale?: number;
  tint?: number;
  renderer?: PIXI.Renderer;
}

export class PixelCharacterSprite extends PIXI.Container {
  private sprite: PIXI.Sprite;
  private animations: Map<string, CharacterAnimation>;
  private currentAnimation: string = 'idle';
  private currentFrame: number = 0;
  private animationTimer: number = 0;
  private isMoving: boolean = false;
  private facingDirection: 'left' | 'right' = 'right';
  
  // Movement properties
  private targetPosition: { x: number; y: number } | null = null;
  private moveSpeed: number = 2;
  
  // Character properties
  public id: string;
  public type: 'kaiju' | 'shadow' | 'player';
  private renderer?: PIXI.Renderer;

  constructor(config: CharacterSpriteConfig) {
    super();
    
    this.id = config.id;
    this.type = config.type;
    this.renderer = config.renderer;
    this.position.set(config.position.x, config.position.y);
    
    // Create sprite with placeholder texture
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sprite.anchor.set(0.5);
    
    if (config.scale) {
      this.sprite.scale.set(config.scale);
    }
    
    if (config.tint) {
      this.sprite.tint = config.tint;
    }
    
    // Only add to container if sprite is valid
    if (this.sprite) {
      this.addChild(this.sprite);
    } else {
      console.error('Failed to create sprite for PixelCharacterSprite');
    }
    
    // Initialize animations map
    this.animations = new Map();
    
    // Create pixel art character based on type
    this.createPixelArtCharacter();
  }

  private createPixelArtCharacter() {
    // Create a graphics object for drawing pixel art
    const graphics = new PIXI.Graphics();
    const pixelSize = 2;
    
    // Define character designs based on type
    if (this.type === 'kaiju') {
      this.drawKaijuCharacter(graphics, pixelSize);
    } else if (this.type === 'shadow') {
      this.drawShadowCharacter(graphics, pixelSize);
    } else {
      this.drawPlayerCharacter(graphics, pixelSize);
    }
    
    // Convert graphics to texture
    const texture = PIXI.RenderTexture.create({
      width: 32 * pixelSize,
      height: 32 * pixelSize
    });
    
    // Use the provided renderer or fallback to a safer approach
    if (this.renderer && texture) {
      try {
        // Ensure graphics has content before rendering
        const bounds = graphics.getLocalBounds();
        if (bounds.width > 0 && bounds.height > 0) {
          this.renderer.render({ container: graphics, target: texture });
          this.sprite.texture = texture;
        } else {
          console.warn('Graphics has no content, using fallback');
          this.useFallbackTexture();
        }
      } catch (error) {
        console.warn('Failed to render pixel character, using fallback:', error);
        this.useFallbackTexture();
      }
    } else {
      // No renderer available, use a fallback approach
      this.useFallbackTexture();
    }
    
    // Clean up
    graphics.destroy();
  }

  private useFallbackTexture() {
    // Just use a simple tinted white texture as fallback
    const color = this.type === 'kaiju' ? 0x4a9eff : 
                  this.type === 'shadow' ? 0x800080 : 
                  0x808080;
    
    this.sprite.texture = PIXI.Texture.WHITE;
    this.sprite.tint = color;
    this.sprite.width = 32;
    this.sprite.height = 32;
  }

  private drawKaijuCharacter(graphics: PIXI.Graphics, pixelSize: number) {
    // Kaiju design - a fierce dragon-like creature
    const kaijuPixels = [
      // Head
      [0,0,0,0,0,1,1,1,1,0,0,0,0,0],
      [0,0,0,1,1,2,2,2,2,1,1,0,0,0],
      [0,0,1,2,2,3,3,3,3,2,2,1,0,0],
      [0,1,2,2,3,4,3,3,4,3,2,2,1,0],
      [0,1,2,3,3,3,3,3,3,3,3,2,1,0],
      // Body
      [0,1,2,2,3,3,3,3,3,3,2,2,1,0],
      [1,2,2,2,2,3,3,3,3,2,2,2,2,1],
      [1,2,2,2,2,2,3,3,2,2,2,2,2,1],
      [1,2,5,2,2,2,2,2,2,2,2,5,2,1],
      [0,1,5,5,2,2,2,2,2,2,5,5,1,0],
      // Legs
      [0,0,1,1,2,2,0,0,2,2,1,1,0,0],
      [0,0,1,1,2,2,0,0,2,2,1,1,0,0],
      [0,0,6,6,6,6,0,0,6,6,6,6,0,0],
    ];
    
    const colors = [
      0x000000, // 0 - transparent
      0x8B0000, // 1 - dark red outline
      0xFF0000, // 2 - red body
      0xFF6347, // 3 - tomato red highlights
      0xFFFF00, // 4 - yellow eyes
      0xFF4500, // 5 - orange claws
      0x4B0000, // 6 - dark feet
    ];
    
    this.drawPixelArray(graphics, kaijuPixels, colors, pixelSize, 9, 8);
  }

  private drawShadowCharacter(graphics: PIXI.Graphics, pixelSize: number) {
    // Shadow design - ghostly transparent version
    const shadowPixels = [
      // Head
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,2,3,2,2,3,2,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      // Body (flowing)
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
    ];
    
    const colors = [
      0x000000, // 0 - transparent
      0x4B0082, // 1 - indigo outline
      0x9370DB, // 2 - medium purple body
      0xE6E6FA, // 3 - lavender eyes
    ];
    
    this.drawPixelArray(graphics, shadowPixels, colors, pixelSize, 10, 6);
    
    // Add transparency
    this.sprite.alpha = 0.7;
  }

  private drawPlayerCharacter(graphics: PIXI.Graphics, pixelSize: number) {
    // Player character - humanoid warrior
    const playerPixels = [
      // Head
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,2,2,2,2,2,2,1,0],
      [0,1,2,3,2,2,3,2,1,0],
      [0,1,2,2,2,2,2,2,1,0],
      [0,0,1,2,2,2,2,1,0,0],
      // Body
      [0,0,4,4,4,4,4,4,0,0],
      [0,4,4,4,4,4,4,4,4,0],
      [0,4,4,5,4,4,5,4,4,0],
      [0,4,4,4,4,4,4,4,4,0],
      [0,0,4,4,4,4,4,4,0,0],
      // Legs
      [0,0,6,6,0,0,6,6,0,0],
      [0,0,6,6,0,0,6,6,0,0],
    ];
    
    const colors = [
      0x000000, // 0 - transparent
      0x8B4513, // 1 - brown outline
      0xFFDBB4, // 2 - skin tone
      0x000000, // 3 - black eyes
      0x4169E1, // 4 - blue armor
      0xFFD700, // 5 - gold details
      0x696969, // 6 - gray boots
    ];
    
    this.drawPixelArray(graphics, playerPixels, colors, pixelSize, 11, 5);
  }

  private drawPixelArray(
    graphics: PIXI.Graphics, 
    pixels: number[][], 
    colors: number[], 
    pixelSize: number,
    offsetX: number = 0,
    offsetY: number = 0
  ) {
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const colorIndex = pixels[y][x];
        if (colorIndex > 0) {
          graphics.rect(
            (x + offsetX) * pixelSize, 
            (y + offsetY) * pixelSize, 
            pixelSize, 
            pixelSize
          );
          graphics.fill({ color: colors[colorIndex], alpha: 1 });
        }
      }
    }
  }

  public moveTo(x: number, y: number) {
    this.targetPosition = { x, y };
    this.isMoving = true;
    
    // Determine facing direction
    if (x < this.position.x) {
      this.facingDirection = 'left';
      this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    } else {
      this.facingDirection = 'right';
      this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    }
    
    // Start walk animation
    this.playAnimation('walk');
  }

  public update(deltaTime: number) {
    // Update movement
    if (this.isMoving && this.targetPosition) {
      const dx = this.targetPosition.x - this.position.x;
      const dy = this.targetPosition.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        const moveX = (dx / distance) * this.moveSpeed * deltaTime;
        const moveY = (dy / distance) * this.moveSpeed * deltaTime;
        
        this.position.x += moveX;
        this.position.y += moveY;
        
        // Add walking bounce
        this.sprite.y = Math.sin(Date.now() * 0.01) * 2;
      } else {
        this.position.set(this.targetPosition.x, this.targetPosition.y);
        this.isMoving = false;
        this.targetPosition = null;
        this.sprite.y = 0;
        this.playAnimation('idle');
      }
    }
    
    // Add idle animation
    if (!this.isMoving) {
      this.sprite.y = Math.sin(Date.now() * 0.003) * 1;
    }
  }

  public playAnimation(animationName: string) {
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.animationTimer = 0;
    }
  }

  public setTint(color: number) {
    this.sprite.tint = color;
  }

  public setAlpha(alpha: number) {
    this.sprite.alpha = alpha;
  }

  public destroy() {
    if (this.sprite.texture) {
      this.sprite.texture.destroy(true);
    }
    super.destroy();
  }
}