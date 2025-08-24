import { AudioManager, SoundOptions } from './AudioManager';
import { Sound } from '@pixi/sound';

export interface BiomeAudioConfig {
  ambientSound: string;
  musicTrack: string;
  environmentalSounds: string[];
  volume: number;
  crossfadeDuration: number;
}

export interface AudioLayer {
  id: string;
  sound: Sound | null;
  volume: number;
  fadeSpeed: number;
}

export class AdvancedAudioSystem extends AudioManager {
  private static advancedInstance: AdvancedAudioSystem;
  private biomeConfigs: Map<string, BiomeAudioConfig> = new Map();
  private currentBiome: string = '';
  private ambientLayers: Map<string, AudioLayer> = new Map();
  private environmentalTimer: number = 0;
  private nextEnvironmentalSound: number = 0;
  
  protected constructor() {
    super();
    this.initializeBiomeConfigs();
  }
  
  static getAdvancedInstance(): AdvancedAudioSystem {
    if (!AdvancedAudioSystem.advancedInstance) {
      AdvancedAudioSystem.advancedInstance = new AdvancedAudioSystem();
    }
    return AdvancedAudioSystem.advancedInstance;
  }
  
  private initializeBiomeConfigs(): void {
    // Forest biome
    this.biomeConfigs.set('forest', {
      ambientSound: 'ambient-forest',
      musicTrack: 'music-forest',
      environmentalSounds: ['bird-chirp-1', 'bird-chirp-2', 'wind-leaves', 'cricket'],
      volume: 0.6,
      crossfadeDuration: 2000
    });
    
    // Desert biome
    this.biomeConfigs.set('desert', {
      ambientSound: 'ambient-desert',
      musicTrack: 'music-desert',
      environmentalSounds: ['wind-sand', 'hawk-cry', 'tumble-weed'],
      volume: 0.5,
      crossfadeDuration: 2000
    });
    
    // Arctic biome
    this.biomeConfigs.set('arctic', {
      ambientSound: 'ambient-arctic',
      musicTrack: 'music-arctic',
      environmentalSounds: ['wind-howl', 'ice-crack', 'snow-crunch'],
      volume: 0.7,
      crossfadeDuration: 2000
    });
    
    // Volcanic biome
    this.biomeConfigs.set('volcanic', {
      ambientSound: 'ambient-volcanic',
      musicTrack: 'music-volcanic',
      environmentalSounds: ['lava-bubble', 'steam-hiss', 'rock-rumble'],
      volume: 0.8,
      crossfadeDuration: 1500
    });
    
    // Urban biome
    this.biomeConfigs.set('urban', {
      ambientSound: 'ambient-urban',
      musicTrack: 'music-urban',
      environmentalSounds: ['car-horn', 'siren-distant', 'crowd-murmur'],
      volume: 0.6,
      crossfadeDuration: 1000
    });
  }
  
  async preloadAdvancedSounds(): Promise<void> {
    const advancedSounds = [
      // Trade execution sounds
      { alias: 'trade-execute-small', url: '/assets/sounds/trade-execute-small.mp3' },
      { alias: 'trade-execute-medium', url: '/assets/sounds/trade-execute-medium.mp3' },
      { alias: 'trade-execute-large', url: '/assets/sounds/trade-execute-large.mp3' },
      { alias: 'trade-profit', url: '/assets/sounds/trade-profit.mp3' },
      { alias: 'trade-loss', url: '/assets/sounds/trade-loss.mp3' },
      
      // UI interaction sounds
      { alias: 'ui-hover', url: '/assets/sounds/ui-hover.mp3' },
      { alias: 'ui-open', url: '/assets/sounds/ui-open.mp3' },
      { alias: 'ui-close', url: '/assets/sounds/ui-close.mp3' },
      { alias: 'ui-tab-switch', url: '/assets/sounds/ui-tab-switch.mp3' },
      { alias: 'ui-toggle', url: '/assets/sounds/ui-toggle.mp3' },
      { alias: 'ui-slider', url: '/assets/sounds/ui-slider.mp3' },
      { alias: 'ui-success', url: '/assets/sounds/ui-success.mp3' },
      { alias: 'ui-warning', url: '/assets/sounds/ui-warning.mp3' },
      
      // Ambient sounds for biomes
      { alias: 'ambient-forest', url: '/assets/sounds/ambient-forest.mp3' },
      { alias: 'ambient-desert', url: '/assets/sounds/ambient-desert.mp3' },
      { alias: 'ambient-arctic', url: '/assets/sounds/ambient-arctic.mp3' },
      { alias: 'ambient-volcanic', url: '/assets/sounds/ambient-volcanic.mp3' },
      { alias: 'ambient-urban', url: '/assets/sounds/ambient-urban.mp3' },
      
      // Environmental sounds
      { alias: 'bird-chirp-1', url: '/assets/sounds/bird-chirp-1.mp3' },
      { alias: 'bird-chirp-2', url: '/assets/sounds/bird-chirp-2.mp3' },
      { alias: 'wind-leaves', url: '/assets/sounds/wind-leaves.mp3' },
      { alias: 'cricket', url: '/assets/sounds/cricket.mp3' },
      { alias: 'wind-sand', url: '/assets/sounds/wind-sand.mp3' },
      { alias: 'hawk-cry', url: '/assets/sounds/hawk-cry.mp3' },
      { alias: 'tumble-weed', url: '/assets/sounds/tumble-weed.mp3' },
      { alias: 'wind-howl', url: '/assets/sounds/wind-howl.mp3' },
      { alias: 'ice-crack', url: '/assets/sounds/ice-crack.mp3' },
      { alias: 'snow-crunch', url: '/assets/sounds/snow-crunch.mp3' },
      { alias: 'lava-bubble', url: '/assets/sounds/lava-bubble.mp3' },
      { alias: 'steam-hiss', url: '/assets/sounds/steam-hiss.mp3' },
      { alias: 'rock-rumble', url: '/assets/sounds/rock-rumble.mp3' },
      { alias: 'car-horn', url: '/assets/sounds/car-horn.mp3' },
      { alias: 'siren-distant', url: '/assets/sounds/siren-distant.mp3' },
      { alias: 'crowd-murmur', url: '/assets/sounds/crowd-murmur.mp3' },
      
      // Music tracks for biomes
      { alias: 'music-forest', url: '/assets/music/forest-theme.mp3' },
      { alias: 'music-desert', url: '/assets/music/desert-theme.mp3' },
      { alias: 'music-arctic', url: '/assets/music/arctic-theme.mp3' },
      { alias: 'music-volcanic', url: '/assets/music/volcanic-theme.mp3' },
      { alias: 'music-urban', url: '/assets/music/urban-theme.mp3' },
    ];
    
    await this.loadSounds(advancedSounds);
  }
  
  switchBiome(biome: string): void {
    if (this.currentBiome === biome) return;
    
    const config = this.biomeConfigs.get(biome);
    if (!config) {
      console.warn(`Biome ${biome} not configured`);
      return;
    }
    
    // Crossfade ambient sounds
    if (this.currentBiome) {
      const oldConfig = this.biomeConfigs.get(this.currentBiome);
      if (oldConfig) {
        this.fadeOutAmbient(oldConfig.ambientSound, config.crossfadeDuration);
      }
    }
    
    // Start new biome sounds
    this.currentBiome = biome;
    this.fadeInAmbient(config.ambientSound, config.volume, config.crossfadeDuration);
    this.playMusic(config.musicTrack, config.crossfadeDuration / 1000);
    
    // Reset environmental sound timer
    this.environmentalTimer = 0;
    this.scheduleNextEnvironmentalSound();
  }
  
  private fadeInAmbient(alias: string, targetVolume: number, duration: number): void {
    const sound = this.play(alias, { 
      volume: 0, 
      loop: true 
    });
    
    if (sound) {
      const layer: AudioLayer = {
        id: alias,
        sound,
        volume: targetVolume,
        fadeSpeed: duration
      };
      
      this.ambientLayers.set(alias, layer);
      this.fadeVolume(sound, 0, targetVolume, duration);
    }
  }
  
  private fadeOutAmbient(alias: string, duration: number): void {
    const layer = this.ambientLayers.get(alias);
    if (layer && layer.sound) {
      this.fadeVolume(layer.sound, layer.volume, 0, duration, () => {
        layer.sound?.stop();
        this.ambientLayers.delete(alias);
      });
    }
  }
  
  private scheduleNextEnvironmentalSound(): void {
    // Schedule random environmental sounds between 10-30 seconds
    this.nextEnvironmentalSound = 10 + Math.random() * 20;
  }
  
  update(deltaTime: number): void {
    this.environmentalTimer += deltaTime;
    
    if (this.environmentalTimer >= this.nextEnvironmentalSound && this.currentBiome) {
      const config = this.biomeConfigs.get(this.currentBiome);
      if (config && config.environmentalSounds.length > 0) {
        const randomSound = config.environmentalSounds[
          Math.floor(Math.random() * config.environmentalSounds.length)
        ];
        
        this.play(randomSound, {
          volume: 0.3 + Math.random() * 0.3, // Random volume between 0.3-0.6
        });
        
        this.scheduleNextEnvironmentalSound();
        this.environmentalTimer = 0;
      }
    }
  }
  
  // Trade execution sounds with size-based variations
  playTradeExecutionSound(tradeSize: 'small' | 'medium' | 'large'): void {
    const soundMap = {
      small: { alias: 'trade-execute-small', volume: 0.4 },
      medium: { alias: 'trade-execute-medium', volume: 0.6 },
      large: { alias: 'trade-execute-large', volume: 0.8 }
    };
    
    const config = soundMap[tradeSize];
    this.play(config.alias, { volume: config.volume });
  }
  
  playTradeResultSound(profit: boolean): void {
    this.play(profit ? 'trade-profit' : 'trade-loss', { volume: 0.5 });
  }
  
  // UI interaction sounds
  playUISound(interaction: 'hover' | 'open' | 'close' | 'tab-switch' | 'toggle' | 'slider' | 'success' | 'warning'): void {
    const volumeMap: Record<string, number> = {
      hover: 0.2,
      open: 0.4,
      close: 0.4,
      'tab-switch': 0.3,
      toggle: 0.3,
      slider: 0.2,
      success: 0.6,
      warning: 0.7
    };
    
    this.play(`ui-${interaction}`, { volume: volumeMap[interaction] || 0.3 });
  }
  
  // Create a dynamic music system that adapts to game state
  setDynamicMusicIntensity(intensity: number): void {
    intensity = Math.max(0, Math.min(1, intensity));
    
    // Adjust music speed and volume based on intensity
    const currentMusic = this.getCurrentMusic();
    if (currentMusic) {
      currentMusic.speed = 1 + (intensity * 0.2); // Speed up slightly with intensity
      currentMusic.volume = this.getConfig().musicVolume * (0.7 + intensity * 0.3);
    }
  }
  
  private fadeVolume(
    sound: Sound,
    from: number,
    to: number,
    duration: number,
    onComplete?: () => void
  ): void {
    const startTime = performance.now();
    const deltaVolume = to - from;
    
    const updateVolume = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      sound.volume = from + deltaVolume * this.easeInOut(progress);
      
      if (progress < 1) {
        requestAnimationFrame(updateVolume);
      } else {
        onComplete?.();
      }
    };
    
    updateVolume();
  }
  
  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  private getCurrentMusic(): Sound | null {
    // This would need to be implemented to get the current music track
    return null;
  }
  
  // Create 3D positional audio effect
  play3DSound(
    alias: string, 
    position: { x: number; y: number }, 
    listenerPosition: { x: number; y: number },
    maxDistance: number = 500,
    options: SoundOptions = {}
  ): Sound | null {
    const dx = position.x - listenerPosition.x;
    const dy = position.y - listenerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxDistance) return null;
    
    // Calculate volume based on distance
    const distanceRatio = 1 - (distance / maxDistance);
    const volume = (options.volume ?? 1) * distanceRatio;
    
    // Calculate stereo pan based on horizontal position
    const pan = Math.max(-1, Math.min(1, dx / maxDistance));
    
    const sound = this.play(alias, { ...options, volume });
    if (sound) {
      // Apply pan if the sound library supports it
      (sound as any).stereo = pan;
    }
    
    return sound;
  }
}