import * as PIXI from 'pixi.js';
import { Camera } from './Camera';
import { BiomeType } from './TerritoryManager';
import { AssetLoader } from './AssetLoader';

interface TerrainConfig {
  worldWidth: number;
  worldHeight: number;
  chunkSize: number;
  viewDistance: number;
}

interface ChunkData {
  x: number;
  y: number;
  sprite: PIXI.Sprite;
  loaded: boolean;
}

interface BiomeColors {
  primary: number;
  secondary: number;
  accent: number;
}

export class TerrainRenderer {
  private container: PIXI.Container;
  private config: TerrainConfig;
  private chunks: Map<string, ChunkData> = new Map();
  private loadedChunks: Set<string> = new Set();
  private currentBiome: BiomeType = 'earth';
  private biomeTextures: Map<BiomeType, PIXI.Texture> = new Map();
  private assetLoader: AssetLoader;
  
  private biomeColors: Record<BiomeType, BiomeColors> = {
    fire: { primary: 0xFF4500, secondary: 0xFF8C00, accent: 0xFFD700 },
    water: { primary: 0x0077BE, secondary: 0x4A90E2, accent: 0x87CEEB },
    earth: { primary: 0x8B4513, secondary: 0xD2691E, accent: 0x90EE90 },
    air: { primary: 0x87CEEB, secondary: 0xB0E0E6, accent: 0xFFFFFF }
  };

  constructor(worldContainer: PIXI.Container, config: TerrainConfig) {
    this.container = new PIXI.Container();
    this.config = config;
    this.assetLoader = AssetLoader.getInstance();
    worldContainer.addChild(this.container);
    
    // Sort terrain to render behind other objects
    this.container.zIndex = -1000;
  }

  async initialize(): Promise<void> {
    await this.generateBiomeTextures();
  }

  private async generateBiomeTextures(): Promise<void> {
    const biomes: BiomeType[] = ['fire', 'water', 'earth', 'air'];
    
    for (const biome of biomes) {
      // Try to get loaded texture first
      const loadedTexture = this.assetLoader.getAsset(`biome-${biome}`) as PIXI.Texture;
      
      if (loadedTexture) {
        this.biomeTextures.set(biome, loadedTexture);
      } else {
        // Fallback to procedural generation
        const texture = this.generateBiomeTexture(biome);
        this.biomeTextures.set(biome, texture);
      }
    }
  }

  private generateBiomeTexture(biome: BiomeType): PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.chunkSize;
    canvas.height = this.config.chunkSize;
    const ctx = canvas.getContext('2d')!;
    
    const colors = this.biomeColors[biome];
    
    // Create gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, `#${colors.primary.toString(16).padStart(6, '0')}`);
    gradient.addColorStop(0.7, `#${colors.secondary.toString(16).padStart(6, '0')}`);
    gradient.addColorStop(1, `#${colors.accent.toString(16).padStart(6, '0')}`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add biome-specific patterns
    this.addBiomePattern(ctx, biome, colors);
    
    // Add some noise for texture
    this.addNoise(ctx, 0.1);
    
    return PIXI.Texture.from(canvas);
  }

  private addBiomePattern(ctx: CanvasRenderingContext2D, biome: BiomeType, colors: BiomeColors): void {
    ctx.globalAlpha = 0.3;
    
    switch (biome) {
      case 'fire':
        this.addFirePattern(ctx, colors);
        break;
      case 'water':
        this.addWaterPattern(ctx, colors);
        break;
      case 'earth':
        this.addEarthPattern(ctx, colors);
        break;
      case 'air':
        this.addAirPattern(ctx, colors);
        break;
    }
    
    ctx.globalAlpha = 1.0;
  }

  private addFirePattern(ctx: CanvasRenderingContext2D, colors: BiomeColors): void {
    const size = this.config.chunkSize;
    ctx.fillStyle = `#${colors.accent.toString(16).padStart(6, '0')}`;
    
    // Add flame-like shapes
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 15 + 5;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private addWaterPattern(ctx: CanvasRenderingContext2D, colors: BiomeColors): void {
    const size = this.config.chunkSize;
    ctx.strokeStyle = `#${colors.accent.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 2;
    
    // Add wave patterns
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      const y = (i / 10) * size;
      ctx.moveTo(0, y);
      
      for (let x = 0; x <= size; x += 10) {
        const waveY = y + Math.sin((x / size) * Math.PI * 4) * 5;
        ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  }

  private addEarthPattern(ctx: CanvasRenderingContext2D, colors: BiomeColors): void {
    const size = this.config.chunkSize;
    ctx.fillStyle = `#${colors.accent.toString(16).padStart(6, '0')}`;
    
    // Add rock-like shapes
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const width = Math.random() * 20 + 10;
      const height = Math.random() * 20 + 10;
      
      ctx.fillRect(x, y, width, height);
    }
  }

  private addAirPattern(ctx: CanvasRenderingContext2D, colors: BiomeColors): void {
    const size = this.config.chunkSize;
    ctx.strokeStyle = `#${colors.accent.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 1;
    
    // Add cloud-like patterns
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 30 + 20;
      
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private addNoise(ctx: CanvasRenderingContext2D, intensity: number): void {
    const imageData = ctx.getImageData(0, 0, this.config.chunkSize, this.config.chunkSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * intensity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  async generateTerrain(biome: BiomeType): Promise<void> {
    this.currentBiome = biome;
    
    // Clear existing terrain
    this.clearTerrain();
    
    // Get the biome texture
    const biomeTexture = this.biomeTextures.get(biome);
    if (!biomeTexture) {
      console.error(`No texture found for biome: ${biome}`);
      return;
    }
    
    // Create a tiling sprite that covers the entire world
    const tilingSprite = new PIXI.TilingSprite(
      biomeTexture,
      this.config.worldWidth,
      this.config.worldHeight
    );
    
    // Scale the tiling to make terrain features more visible
    tilingSprite.tileScale.set(0.5, 0.5); // Adjust this to control tile size
    
    // Add the tiling sprite to the container
    this.container.addChild(tilingSprite);
    
    // Store reference for cleanup
    this.chunks.set('main-terrain', {
      x: 0,
      y: 0,
      sprite: tilingSprite,
      loaded: true
    });
    
    // Add terrain features based on biome
    this.addTerrainFeatures(biome);
  }

  private async loadChunk(chunkX: number, chunkY: number): Promise<void> {
    const chunkKey = `${chunkX}-${chunkY}`;
    
    if (this.chunks.has(chunkKey)) {
      return;
    }

    const texture = this.biomeTextures.get(this.currentBiome);
    if (!texture) {
      console.warn(`No texture found for biome: ${this.currentBiome}`);
      return;
    }

    const sprite = new PIXI.Sprite(texture);
    sprite.x = chunkX * this.config.chunkSize;
    sprite.y = chunkY * this.config.chunkSize;
    sprite.width = this.config.chunkSize;
    sprite.height = this.config.chunkSize;

    this.container.addChild(sprite);
    
    const chunkData: ChunkData = {
      x: chunkX,
      y: chunkY,
      sprite,
      loaded: true
    };
    
    this.chunks.set(chunkKey, chunkData);
    this.loadedChunks.add(chunkKey);
  }

  private unloadChunk(chunkKey: string): void {
    const chunk = this.chunks.get(chunkKey);
    if (chunk && chunk.loaded) {
      this.container.removeChild(chunk.sprite);
      chunk.sprite.destroy();
      this.chunks.delete(chunkKey);
      this.loadedChunks.delete(chunkKey);
    }
  }

  update(camera: Camera): void {
    // With tiling sprite, we don't need to manage chunks
    // The tiling sprite automatically handles repeating the texture
    // This method is kept for compatibility but doesn't need to do anything
  }

  getTerrainData(): { biome: BiomeType; chunks: string[]; worldSize: { width: number; height: number } } {
    return {
      biome: this.currentBiome,
      chunks: Array.from(this.chunks.keys()),
      worldSize: { width: this.config.worldWidth, height: this.config.worldHeight }
    };
  }

  private clearTerrain(): void {
    this.chunks.forEach(chunk => {
      this.container.removeChild(chunk.sprite);
      chunk.sprite.destroy();
    });
    this.chunks.clear();
    this.loadedChunks.clear();
  }

  private addTerrainFeatures(biome: BiomeType): void {
    const featuresContainer = new PIXI.Container();
    this.container.addChild(featuresContainer);
    
    // Store features container for cleanup
    this.chunks.set('terrain-features', {
      x: 0,
      y: 0,
      sprite: featuresContainer,
      loaded: true
    });
    
    // Add biome-specific features
    const featureCount = 50; // Number of decorative elements
    
    for (let i = 0; i < featureCount; i++) {
      const x = Math.random() * this.config.worldWidth;
      const y = Math.random() * this.config.worldHeight;
      
      const feature = new PIXI.Graphics();
      
      switch (biome) {
        case 'fire':
          // Add lava pools
          feature.beginFill(0xFF6600, 0.8);
          feature.drawEllipse(0, 0, 40 + Math.random() * 20, 30 + Math.random() * 15);
          feature.endFill();
          feature.beginFill(0xFFAA00, 0.6);
          feature.drawEllipse(0, -5, 30 + Math.random() * 15, 20 + Math.random() * 10);
          feature.endFill();
          break;
          
        case 'water':
          // Add water ripples
          feature.lineStyle(2, 0x4A90E2, 0.5);
          feature.drawCircle(0, 0, 20 + Math.random() * 30);
          feature.lineStyle(1, 0x87CEEB, 0.3);
          feature.drawCircle(0, 0, 30 + Math.random() * 40);
          break;
          
        case 'earth':
          // Add rocks and crystals
          feature.beginFill(0x8B6914, 0.9);
          feature.drawPolygon([
            -15, 10,
            -10, -10,
            5, -15,
            15, -5,
            10, 10
          ]);
          feature.endFill();
          break;
          
        case 'air':
          // Add cloud wisps
          feature.beginFill(0xFFFFFF, 0.2);
          for (let j = 0; j < 3; j++) {
            const offsetX = j * 15 - 15;
            const offsetY = Math.sin(j) * 5;
            feature.drawCircle(offsetX, offsetY, 15 + Math.random() * 10);
          }
          feature.endFill();
          break;
      }
      
      feature.position.set(x, y);
      feature.scale.set(0.8 + Math.random() * 0.4);
      feature.rotation = Math.random() * Math.PI * 2;
      featuresContainer.addChild(feature);
    }
  }

  async generateMixedTerrain(): Promise<void> {
    // Clear existing terrain
    this.clearTerrain();
    
    // Create container for terrain tiles
    const terrainContainer = new PIXI.Container();
    this.container.addChild(terrainContainer);
    
    const worldWidth = this.config.worldWidth;
    const worldHeight = this.config.worldHeight;
    const tileSize = 200; // Smaller tiles for better detail
    
    const tilesX = Math.ceil(worldWidth / tileSize);
    const tilesY = Math.ceil(worldHeight / tileSize);
    
    // Create the specific terrain layout requested:
    // Top: Air, Center to bottom: Earth, Left/right edges: Water, Fire as separators
    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        const posX = x * tileSize;
        const posY = y * tileSize;
        
        // Determine biome based on position
        let biome: BiomeType;
        
        const isTopRegion = y < tilesY * 0.25; // Top 25% is air
        const isLeftEdge = x < tilesX * 0.1; // Left 10% is water
        const isRightEdge = x >= tilesX * 0.9; // Right 10% is water
        const isFireBorder = (x === Math.floor(tilesX * 0.1) || x === Math.floor(tilesX * 0.9) - 1 || 
                             y === Math.floor(tilesY * 0.25)); // Fire borders
        
        if (isFireBorder) {
          biome = 'fire';
        } else if (isLeftEdge || isRightEdge) {
          biome = 'water';
        } else if (isTopRegion) {
          biome = 'air';
        } else {
          biome = 'earth'; // Center to bottom
        }
        
        const texture = this.biomeTextures.get(biome);
        
        if (texture) {
          const tile = new PIXI.TilingSprite(
            texture,
            tileSize,
            tileSize
          );
          
          tile.position.set(posX, posY);
          tile.tileScale.set(0.6, 0.6);
          tile.alpha = 1.0; // Full opacity, no variation
          
          terrainContainer.addChild(tile);
        }
      }
    }
    
    // Store reference for cleanup
    this.chunks.set('mixed-terrain', {
      x: 0,
      y: 0,
      sprite: terrainContainer,
      loaded: true
    });
    
    // Add terrain features for the new layout
    this.addLayoutBasedTerrainFeatures();
  }
  
  private addMixedTerrainFeatures(): void {
    const featuresContainer = new PIXI.Container();
    this.container.addChild(featuresContainer);
    
    // Add features from all biomes
    const biomes: BiomeType[] = ['fire', 'water', 'earth', 'air'];
    const featureCount = 80; // More features for mixed terrain
    
    for (let i = 0; i < featureCount; i++) {
      const x = Math.random() * this.config.worldWidth;
      const y = Math.random() * this.config.worldHeight;
      const biome = biomes[i % 4]; // Cycle through biomes
      
      const feature = new PIXI.Graphics();
      
      switch (biome) {
        case 'fire':
          // Lava pools
          feature.beginFill(0xFF6600, 0.8);
          feature.drawEllipse(0, 0, 30 + Math.random() * 20, 25 + Math.random() * 15);
          feature.endFill();
          break;
          
        case 'water':
          // Water features
          feature.lineStyle(2, 0x4A90E2, 0.5);
          feature.drawCircle(0, 0, 25 + Math.random() * 25);
          break;
          
        case 'earth':
          // Rocks
          feature.beginFill(0x8B6914, 0.9);
          feature.drawPolygon([
            -12, 8,
            -8, -8,
            4, -12,
            12, -4,
            8, 8
          ]);
          feature.endFill();
          break;
          
        case 'air':
          // Clouds
          feature.beginFill(0xFFFFFF, 0.15);
          for (let j = 0; j < 3; j++) {
            feature.drawCircle(j * 10 - 10, Math.sin(j) * 4, 12 + Math.random() * 8);
          }
          feature.endFill();
          break;
      }
      
      feature.position.set(x, y);
      feature.scale.set(0.7 + Math.random() * 0.5);
      feature.rotation = Math.random() * Math.PI * 2;
      featuresContainer.addChild(feature);
    }
    
    // Store features container for cleanup
    this.chunks.set('mixed-features', {
      x: 0,
      y: 0,
      sprite: featuresContainer,
      loaded: true
    });
  }

  private addLayoutBasedTerrainFeatures(): void {
    const featuresContainer = new PIXI.Container();
    this.container.addChild(featuresContainer);
    
    const worldWidth = this.config.worldWidth;
    const worldHeight = this.config.worldHeight;
    const featureCount = 60; // Moderate number of features
    
    for (let i = 0; i < featureCount; i++) {
      const x = Math.random() * worldWidth;
      const y = Math.random() * worldHeight;
      
      // Determine biome based on position (same logic as terrain)
      let biome: BiomeType;
      const normalizedX = x / worldWidth;
      const normalizedY = y / worldHeight;
      
      const isTopRegion = normalizedY < 0.25;
      const isLeftEdge = normalizedX < 0.1;
      const isRightEdge = normalizedX >= 0.9;
      const isFireBorder = (Math.abs(normalizedX - 0.1) < 0.02 || 
                           Math.abs(normalizedX - 0.9) < 0.02 || 
                           Math.abs(normalizedY - 0.25) < 0.02);
      
      if (isFireBorder) {
        biome = 'fire';
      } else if (isLeftEdge || isRightEdge) {
        biome = 'water';
      } else if (isTopRegion) {
        biome = 'air';
      } else {
        biome = 'earth';
      }
      
      const feature = new PIXI.Graphics();
      
      switch (biome) {
        case 'fire':
          // Lava pools and fire effects
          feature.beginFill(0xFF6600, 0.8);
          feature.drawEllipse(0, 0, 25 + Math.random() * 15, 20 + Math.random() * 10);
          feature.endFill();
          break;
          
        case 'water':
          // Water ripples
          feature.lineStyle(2, 0x4A90E2, 0.6);
          feature.drawCircle(0, 0, 20 + Math.random() * 20);
          break;
          
        case 'earth':
          // Rocks and crystals
          feature.beginFill(0x8B6914, 0.9);
          feature.drawPolygon([
            -10, 6,
            -6, -6,
            3, -9,
            9, -3,
            6, 6
          ]);
          feature.endFill();
          break;
          
        case 'air':
          // Cloud wisps
          feature.beginFill(0xFFFFFF, 0.2);
          for (let j = 0; j < 3; j++) {
            feature.drawCircle(j * 8 - 8, Math.sin(j) * 3, 10 + Math.random() * 6);
          }
          feature.endFill();
          break;
      }
      
      feature.position.set(x, y);
      feature.scale.set(0.6 + Math.random() * 0.4);
      feature.rotation = Math.random() * Math.PI * 2;
      featuresContainer.addChild(feature);
    }
    
    // Store features container for cleanup
    this.chunks.set('layout-features', {
      x: 0,
      y: 0,
      sprite: featuresContainer,
      loaded: true
    });
  }

  destroy(): void {
    this.clearTerrain();
    this.biomeTextures.forEach(texture => texture.destroy());
    this.biomeTextures.clear();
    this.container.destroy(true);
  }
}