import * as PIXI from 'pixi.js';

export interface AssetManifest {
  alias: string;
  src: string | string[];
  data?: Record<string, unknown>;
}

export class AssetLoader {
  private static instance: AssetLoader;
  private loadedAssets: Map<string, PIXI.Asset> = new Map();
  private loadingPromises: Map<string, Promise<PIXI.Asset>> = new Map();

  private constructor() {}

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  async loadBundle(manifest: AssetManifest[]): Promise<void> {
    const unloadedAssets = manifest.filter(
      asset => !this.loadedAssets.has(asset.alias)
    );

    if (unloadedAssets.length === 0) return;

    // Load assets with fallback handling
    for (const asset of unloadedAssets) {
      try {
        await PIXI.Assets.load({
          alias: asset.alias,
          src: asset.src,
          data: asset.data,
        });
        this.loadedAssets.set(asset.alias, PIXI.Assets.get(asset.alias));
      } catch (error) {
        console.warn(`Failed to load asset ${asset.alias} from ${asset.src}, using fallback:`, error);
        
        // Use a placeholder/fallback asset based on type
        let fallbackAsset;
        if (asset.src.includes('kaiju')) {
          // Use a simple colored square as fallback for kaiju images
          fallbackAsset = this.createFallbackTexture('kaiju', 0x4a9eff);
        } else if (asset.src.includes('shadow')) {
          fallbackAsset = this.createFallbackTexture('shadow', 0x800080);
        } else {
          // Generic fallback
          fallbackAsset = this.createFallbackTexture('generic', 0x808080);
        }
        
        this.loadedAssets.set(asset.alias, fallbackAsset);
      }
    }
  }

  async loadAsset(alias: string, src: string | string[]): Promise<PIXI.Asset> {
    if (this.loadedAssets.has(alias)) {
      return this.loadedAssets.get(alias);
    }

    if (this.loadingPromises.has(alias)) {
      return this.loadingPromises.get(alias);
    }

    const loadPromise = PIXI.Assets.load({ alias, src });
    this.loadingPromises.set(alias, loadPromise);

    try {
      const asset = await loadPromise;
      this.loadedAssets.set(alias, asset);
      this.loadingPromises.delete(alias);
      return asset;
    } catch (error) {
      this.loadingPromises.delete(alias);
      throw error;
    }
  }

  getAsset(alias: string): PIXI.Asset | undefined {
    return this.loadedAssets.get(alias);
  }

  hasAsset(alias: string): boolean {
    return this.loadedAssets.has(alias);
  }

  unloadAsset(alias: string): void {
    if (this.loadedAssets.has(alias)) {
      PIXI.Assets.unload(alias);
      this.loadedAssets.delete(alias);
    }
  }

  unloadAll(): void {
    this.loadedAssets.forEach((_, alias) => {
      PIXI.Assets.unload(alias);
    });
    this.loadedAssets.clear();
    this.loadingPromises.clear();
  }

  async preloadKaijuAssets(kaijuIds: string[]): Promise<void> {
    const manifest: AssetManifest[] = kaijuIds.map(id => ({
      alias: `kaiju-${id}`,
      src: `/assets/kaiju/kaiju-${id}.png`,
    }));

    await this.loadBundle(manifest);
  }

  private createFallbackTexture(type: string, color: number): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color, 1);
    graphics.drawRect(0, 0, 64, 64);
    graphics.endFill();
    
    // Add some visual indication of what this is
    graphics.beginFill(0xFFFFFF, 0.8);
    graphics.drawRect(4, 4, 56, 16);
    graphics.endFill();
    
    const texture = PIXI.RenderTexture.create({ width: 64, height: 64 });
    const app = PIXI.Application.shared;
    if (app && app.renderer) {
      app.renderer.render(graphics, { renderTexture: texture });
    }
    
    graphics.destroy();
    return texture;
  }

  async preloadEffects(): Promise<void> {
    const effectsManifest: AssetManifest[] = [
      { alias: 'particle-star', src: '/assets/effects/star.png' },
      { alias: 'particle-smoke', src: '/assets/effects/smoke.png' },
      { alias: 'particle-fire', src: '/assets/effects/fire.png' },
      { alias: 'particle-sparkle', src: '/assets/effects/sparkle.png' },
    ];

    await this.loadBundle(effectsManifest);
  }

  async loadBiomeAssets(biomes: string[]): Promise<void> {
    const manifest: AssetManifest[] = biomes.map(biome => ({
      alias: `biome-${biome}`,
      src: `/assets/biomes/${biome}.jpg`,
    }));

    // Fallback to procedural generation if assets don't exist
    await this.loadBundle(manifest).catch(() => {
      console.warn('Biome assets not found, using procedural generation');
    });
  }

  async loadShadowAssets(): Promise<void> {
    const shadowManifest: AssetManifest[] = [
      { alias: 'shadow-follower', src: '/assets/shadows/follower.png' },
      { alias: 'shadow-user', src: '/assets/shadows/user.png' },
    ];

    // Fallback to procedural generation if assets don't exist
    await this.loadBundle(shadowManifest).catch(() => {
      console.warn('Shadow assets not found, using procedural generation');
    });
  }

  async loadInteractiveZoneAssets(): Promise<void> {
    const zoneManifest: AssetManifest[] = [
      { alias: 'zone-chat', src: '/assets/zones/chat.jpg' },
      { alias: 'zone-trading', src: '/assets/zones/trading.jpg' },
      { alias: 'zone-statistics', src: '/assets/zones/statistics.jpg' },
    ];

    // Fallback to procedural generation if assets don't exist
    await this.loadBundle(zoneManifest).catch(() => {
      console.warn('Interactive zone assets not found, using procedural generation');
    });
  }

  async loadEnvironmentAssets(): Promise<void> {
    // Environment assets removed - weather and ambient not needed
    console.log('Environment assets loading skipped - weather and ambient features removed');
  }
}