import * as PIXI from 'pixi.js';

export interface AnimationData {
  name: string;
  frames: number[];
  speed: number;
  loop?: boolean;
}

export interface SpriteSheetData {
  texture: PIXI.Texture;
  frameWidth: number;
  frameHeight: number;
  animations: AnimationData[];
}

export class AnimationManager {
  private static instance: AnimationManager;
  private spriteSheets: Map<string, SpriteSheetData> = new Map();
  private animations: Map<string, PIXI.Texture[]> = new Map();

  private constructor() {}

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  createSpriteSheet(
    id: string,
    texture: PIXI.Texture,
    frameWidth: number,
    frameHeight: number,
    animations: AnimationData[]
  ): void {
    const spriteSheetData: SpriteSheetData = {
      texture,
      frameWidth,
      frameHeight,
      animations,
    };

    this.spriteSheets.set(id, spriteSheetData);

    animations.forEach(animation => {
      const frames = this.extractFrames(
        texture,
        frameWidth,
        frameHeight,
        animation.frames
      );
      this.animations.set(`${id}_${animation.name}`, frames);
    });
  }

  private extractFrames(
    baseTexture: PIXI.Texture,
    frameWidth: number,
    frameHeight: number,
    frameIndices: number[]
  ): PIXI.Texture[] {
    const frames: PIXI.Texture[] = [];
    const columns = Math.floor(baseTexture.width / frameWidth);

    frameIndices.forEach(index => {
      const x = (index % columns) * frameWidth;
      const y = Math.floor(index / columns) * frameHeight;

      const frame = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
      const texture = new PIXI.Texture({
        source: baseTexture.source,
        frame,
      });

      frames.push(texture);
    });

    return frames;
  }

  getAnimation(spriteSheetId: string, animationName: string): PIXI.Texture[] | null {
    const key = `${spriteSheetId}_${animationName}`;
    return this.animations.get(key) || null;
  }

  createAnimatedSprite(
    spriteSheetId: string,
    animationName: string
  ): PIXI.AnimatedSprite | null {
    const frames = this.getAnimation(spriteSheetId, animationName);
    if (!frames) return null;

    const sprite = new PIXI.AnimatedSprite(frames);
    const spriteSheet = this.spriteSheets.get(spriteSheetId);
    
    if (spriteSheet) {
      const animationData = spriteSheet.animations.find(
        anim => anim.name === animationName
      );
      
      if (animationData) {
        sprite.animationSpeed = animationData.speed;
        sprite.loop = animationData.loop !== false;
      }
    }

    return sprite;
  }

  createKaijuAnimations(kaijuId: string, spriteSheet: PIXI.Texture): Record<string, PIXI.Texture[]> {
    const frameWidth = 64;
    const frameHeight = 64;

    this.createSpriteSheet(kaijuId, spriteSheet, frameWidth, frameHeight, [
      { name: 'idle', frames: [0, 1, 2, 3], speed: 0.1, loop: true },
      { name: 'walking', frames: [4, 5, 6, 7], speed: 0.15, loop: true },
      { name: 'trading', frames: [8, 9, 10, 11], speed: 0.1, loop: true },
      { name: 'attack', frames: [12, 13, 14, 15], speed: 0.2, loop: false },
      { name: 'hurt', frames: [16, 17], speed: 0.1, loop: false },
      { name: 'victory', frames: [18, 19, 20, 21], speed: 0.12, loop: true },
    ]);

    return {
      idle: this.getAnimation(kaijuId, 'idle')!,
      walking: this.getAnimation(kaijuId, 'walking')!,
      trading: this.getAnimation(kaijuId, 'trading')!,
      attack: this.getAnimation(kaijuId, 'attack')!,
      hurt: this.getAnimation(kaijuId, 'hurt')!,
      victory: this.getAnimation(kaijuId, 'victory')!,
    };
  }

  clearAnimations(spriteSheetId: string): void {
    const spriteSheet = this.spriteSheets.get(spriteSheetId);
    if (spriteSheet) {
      spriteSheet.animations.forEach(animation => {
        this.animations.delete(`${spriteSheetId}_${animation.name}`);
      });
      this.spriteSheets.delete(spriteSheetId);
    }
  }

  clearAll(): void {
    this.animations.clear();
    this.spriteSheets.clear();
  }
}