import { sound, Sound } from '@pixi/sound';

export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
  speed?: number;
  complete?: () => void;
}

export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Sound> = new Map();
  private currentMusic?: Sound;
  private config: AudioConfig = {
    masterVolume: 1,
    sfxVolume: 1,
    musicVolume: 0.7,
    muted: false,
  };

  private constructor() {
    sound.volumeAll = this.config.masterVolume;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async loadSound(alias: string, url: string): Promise<void> {
    try {
      // Check if file exists before trying to load
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Sound file not found: ${url}. Skipping ${alias}`);
        return;
      }
      
      const loadedSound = await sound.add(alias, url);
      this.sounds.set(alias, loadedSound);
      console.log(`Successfully loaded sound: ${alias}`);
    } catch (error) {
      console.warn(`Failed to load sound ${alias} from ${url}:`, error.message);
      // Don't throw error, just skip this sound
    }
  }

  async loadSounds(sounds: { alias: string; url: string }[]): Promise<void> {
    const loadPromises = sounds.map(({ alias, url }) => this.loadSound(alias, url));
    // Use Promise.allSettled to continue even if some sounds fail to load
    const results = await Promise.allSettled(loadPromises);
    
    const failed = results.filter(result => result.status === 'rejected').length;
    const successful = results.length - failed;
    
    if (successful > 0) {
      console.log(`Loaded ${successful}/${results.length} audio files successfully`);
    }
    if (failed > 0) {
      console.warn(`Failed to load ${failed}/${results.length} audio files`);
    }
  }

  play(alias: string, options: SoundOptions = {}): Sound | null {
    if (this.config.muted) return null;

    const soundInstance = this.sounds.get(alias);
    if (!soundInstance) {
      console.warn(`Sound ${alias} not found`);
      return null;
    }

    const volume = (options.volume ?? 1) * this.config.sfxVolume * this.config.masterVolume;
    
    soundInstance.volume = volume;
    soundInstance.loop = options.loop ?? false;
    soundInstance.speed = options.speed ?? 1;

    if (options.complete) {
      soundInstance.complete = options.complete;
    }

    soundInstance.play();
    return soundInstance;
  }

  playMusic(alias: string, fadeIn: number = 0): void {
    if (this.currentMusic) {
      this.stopMusic(fadeIn > 0 ? fadeIn : 0);
    }

    const music = this.sounds.get(alias);
    if (!music) {
      console.warn(`Music ${alias} not found`);
      return;
    }

    this.currentMusic = music;
    music.loop = true;
    music.volume = this.config.muted ? 0 : this.config.musicVolume * this.config.masterVolume;

    if (fadeIn > 0) {
      music.volume = 0;
      music.play();
      this.fadeVolume(music, 0, this.config.musicVolume * this.config.masterVolume, fadeIn);
    } else {
      music.play();
    }
  }

  stopMusic(fadeOut: number = 0): void {
    if (!this.currentMusic) return;

    if (fadeOut > 0) {
      this.fadeVolume(
        this.currentMusic,
        this.currentMusic.volume,
        0,
        fadeOut,
        () => {
          this.currentMusic?.stop();
          this.currentMusic = undefined;
        }
      );
    } else {
      this.currentMusic.stop();
      this.currentMusic = undefined;
    }
  }

  private fadeVolume(
    soundInstance: Sound,
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
      
      soundInstance.volume = from + deltaVolume * progress;

      if (progress < 1) {
        requestAnimationFrame(updateVolume);
      } else {
        onComplete?.();
      }
    };

    updateVolume();
  }

  stop(alias: string): void {
    const soundInstance = this.sounds.get(alias);
    if (soundInstance && soundInstance.isPlaying) {
      soundInstance.stop();
    }
  }

  stopAll(): void {
    sound.stopAll();
  }

  pause(alias: string): void {
    const soundInstance = this.sounds.get(alias);
    if (soundInstance && soundInstance.isPlaying) {
      soundInstance.pause();
    }
  }

  resume(alias: string): void {
    const soundInstance = this.sounds.get(alias);
    if (soundInstance && soundInstance.paused) {
      soundInstance.resume();
    }
  }

  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    sound.volumeAll = this.config.muted ? 0 : this.config.masterVolume;
  }

  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.config.muted ? 0 : this.config.musicVolume * this.config.masterVolume;
    }
  }

  toggleMute(): boolean {
    this.config.muted = !this.config.muted;
    sound.volumeAll = this.config.muted ? 0 : this.config.masterVolume;
    return this.config.muted;
  }

  setMuted(muted: boolean): void {
    this.config.muted = muted;
    sound.volumeAll = muted ? 0 : this.config.masterVolume;
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  async preloadGameSounds(): Promise<void> {
    console.log('Attempting to preload game sounds...');
    const gameSounds = [
      { alias: 'kaiju-spawn', url: '/assets/sounds/spawn.mp3' },
      { alias: 'kaiju-move', url: '/assets/sounds/move.mp3' },
      { alias: 'kaiju-attack', url: '/assets/sounds/attack.mp3' },
      { alias: 'kaiju-hurt', url: '/assets/sounds/hurt.mp3' },
      { alias: 'kaiju-victory', url: '/assets/sounds/victory.mp3' },
      { alias: 'trade-start', url: '/assets/sounds/trade-start.mp3' },
      { alias: 'trade-complete', url: '/assets/sounds/trade-complete.mp3' },
      { alias: 'trade-cancel', url: '/assets/sounds/trade-cancel.mp3' },
      { alias: 'notification', url: '/assets/sounds/notification.mp3' },
      { alias: 'coin-collect', url: '/assets/sounds/coin.mp3' },
      { alias: 'button-click', url: '/assets/sounds/click.mp3' },
      { alias: 'error', url: '/assets/sounds/error.mp3' },
    ];

    try {
      await this.loadSounds(gameSounds);
    } catch (error) {
      console.warn('Some game sounds failed to load, but continuing without audio:', error);
    }
  }

  async preloadMusic(): Promise<void> {
    console.log('Attempting to preload music tracks...');
    const musicTracks = [
      { alias: 'menu-theme', url: '/assets/music/menu.mp3' },
      { alias: 'game-theme', url: '/assets/music/game.mp3' },
      { alias: 'battle-theme', url: '/assets/music/battle.mp3' },
      { alias: 'victory-theme', url: '/assets/music/victory.mp3' },
    ];

    try {
      await this.loadSounds(musicTracks);
    } catch (error) {
      console.warn('Some music tracks failed to load, but continuing without music:', error);
    }
  }

  playNotification(): void {
    this.play('notification', { volume: 0.5 });
  }

  playButtonClick(): void {
    this.play('button-click', { volume: 0.3 });
  }

  playError(): void {
    this.play('error', { volume: 0.4 });
  }

  playKaijuSound(action: 'spawn' | 'move' | 'attack' | 'hurt' | 'victory'): void {
    this.play(`kaiju-${action}`, { volume: 0.6 });
  }

  playTradeSound(action: 'start' | 'complete' | 'cancel'): void {
    this.play(`trade-${action}`, { volume: 0.5 });
  }

  destroy(): void {
    this.stopAll();
    this.sounds.clear();
    sound.removeAll();
  }
}