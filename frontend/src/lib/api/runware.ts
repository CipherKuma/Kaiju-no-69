import { Runware } from '@runware/sdk-js';

const RUNWARE_API_KEY = 'F7nehgk6wilDDC97BewmSwESkYxj9Rak';

interface RunwareImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  steps?: number;
  seed?: number;
}

export class RunwareAI {
  private runware: Runware;

  constructor(apiKey: string = RUNWARE_API_KEY) {
    this.runware = new Runware({ 
      apiKey,
      shouldReconnect: true,
      globalMaxRetries: 3,
    });
  }

  async generateImage(request: RunwareImageRequest): Promise<string[]> {
    try {
      const images = await this.runware.requestImages({
        positivePrompt: request.prompt,
        negativePrompt: request.negativePrompt || '',
        width: request.width || 512,
        height: request.height || 512,
        model: request.model || 'runware:101@1', // Using default Runware model
        steps: request.steps || 30,
        seed: request.seed || Math.floor(Math.random() * 1000000),
        numberResults: 1,
      });

      if (!images || images.length === 0) {
        throw new Error('No images generated');
      }

      return images.map(img => img.imageURL);
    } catch (error) {
      console.error('Runware AI Error:', error);
      throw error;
    }
  }

  async generateKaijuAndShadowStages(prompt: string): Promise<{ 
    kaiju: string; 
    shadowStages: [string, string, string]; 
  }> {
    try {
      // Generate Kaiju image
      const kaijuPrompt = `${prompt}, powerful trading beast, digital monster, cryptocurrency theme, epic pose, detailed, high quality`;
      const kaijuUrls = await this.generateImage({
        prompt: kaijuPrompt,
        negativePrompt: 'low quality, blurry, distorted',
        width: 512,
        height: 512,
      });

      // Generate Shadow Stage 1 (Powerful Shadow Incarnation)
      const shadowStage1Prompt = `shadow incarnation of (${prompt}), same creature but as a dark shadow, intense neon purple energy radiating, maximum power, glowing purple aura, dark ethereal form, mystical shadow energy, super powerful shadow version`;
      const shadowStage1Urls = await this.generateImage({
        prompt: shadowStage1Prompt,
        negativePrompt: 'low quality, blurry, distorted, different creature, weak, faded, solid body',
        width: 512,
        height: 512,
      });

      // Generate Shadow Stage 2 (Weaker Shadow Incarnation)
      const shadowStage2Prompt = `weaker shadow incarnation of (${prompt}), same creature but as aging shadow, moderate purple glow, translucent form, medium energy, fading power, dimmer shadow aura, aging shadow version`;
      const shadowStage2Urls = await this.generateImage({
        prompt: shadowStage2Prompt,
        negativePrompt: 'low quality, blurry, distorted, different creature, intense power, bright, solid',
        width: 512,
        height: 512,
      });

      // Generate Shadow Stage 3 (Weakest Shadow Incarnation)
      const shadowStage3Prompt = `weakest shadow incarnation of (${prompt}), same creature but as fading shadow, weak purple glow, very translucent, minimal energy, almost invisible, dying shadow form, barely visible incarnation`;
      const shadowStage3Urls = await this.generateImage({
        prompt: shadowStage3Prompt,
        negativePrompt: 'low quality, blurry, distorted, different creature, bright, intense, powerful, solid form',
        width: 512,
        height: 512,
      });

      return {
        kaiju: kaijuUrls[0],
        shadowStages: [shadowStage1Urls[0], shadowStage2Urls[0], shadowStage3Urls[0]],
      };
    } catch (error) {
      console.error('Failed to generate Kaiju and Shadow stages:', error);
      throw error;
    }
  }

  // Keep the old method for backward compatibility
  async generateKaijuAndShadow(prompt: string): Promise<{ kaiju: string; shadow: string }> {
    try {
      const result = await this.generateKaijuAndShadowStages(prompt);
      return {
        kaiju: result.kaiju,
        shadow: result.shadowStages[0], // Return the strongest shadow stage
      };
    } catch (error) {
      console.error('Failed to generate Kaiju and Shadow:', error);
      throw error;
    }
  }

  // Generate pixel art style for game sprites
  async generatePixelArt(prompt: string): Promise<string> {
    try {
      const pixelPrompt = `${prompt}, pixel art style, 32x32 pixels, simple colors, retro game sprite`;
      const urls = await this.generateImage({
        prompt: pixelPrompt,
        negativePrompt: 'realistic, detailed, complex, high resolution',
        width: 256,
        height: 256,
        model: 'runware:101@1', // Using default model - you can change this if Runware has pixel art specific models
      });

      return urls[0];
    } catch (error) {
      console.error('Failed to generate pixel art:', error);
      throw error;
    }
  }
}

export const runwareAI = new RunwareAI();