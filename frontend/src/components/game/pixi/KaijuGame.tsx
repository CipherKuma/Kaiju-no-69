'use client';

import { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { PixiApp } from './PixiApp';
import { GameManager } from '@/lib/game/pixi/GameManager';

interface KaijuGameProps {
  width?: number;
  height?: number;
  worldWidth?: number;
  worldHeight?: number;
  enableAudio?: boolean;
  enableTouch?: boolean;
  enableParticles?: boolean;
  debugMode?: boolean;
}

export const KaijuGame: React.FC<KaijuGameProps> = ({
  width = 800,
  height = 600,
  worldWidth = 2000,
  worldHeight = 1200,
  enableAudio = true,
  enableTouch = true,
  enableParticles = true,
  debugMode = false,
}) => {
  const gameManagerRef = useRef<GameManager | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePixiReady = async (app: PIXI.Application) => {
    try {
      const gameManager = new GameManager(app, {
        worldWidth,
        worldHeight,
        enableAudio,
        enableTouch,
        enableParticles,
        debugMode,
      });

      gameManagerRef.current = gameManager;

      await gameManager.initialize();

      const kaiju1 = gameManager.createKaiju('1', { x: worldWidth / 2, y: worldHeight / 2 });
      if (kaiju1) {
        gameManager.followKaiju('1');
      }

      gameManager.playMusic('game');

      setGameReady(true);
    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError('Failed to initialize game');
    }
  };

  const handleUpdate = (delta: number) => {
    // Game loop handled by GameManager
  };

  useEffect(() => {
    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
      }
    };
  }, []);

  const handleSpawnKaiju = () => {
    if (!gameManagerRef.current) return;

    const randomId = Math.floor(Math.random() * 3) + 1;
    const randomX = Math.random() * worldWidth;
    const randomY = Math.random() * worldHeight;

    gameManagerRef.current.createKaiju(
      `kaiju-${Date.now()}`,
      { x: randomX, y: randomY }
    );
  };

  const handleCreateEffect = () => {
    if (!gameManagerRef.current) return;

    const camera = gameManagerRef.current.getCamera();
    const centerPos = camera.getPosition();
    
    gameManagerRef.current.createParticleEffect(
      `effect-${Date.now()}`,
      'explosion',
      { x: centerPos.x, y: centerPos.y }
    );
  };

  const handleShakeCamera = () => {
    if (!gameManagerRef.current) return;
    gameManagerRef.current.shakeCamera(20, 1);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-100 text-red-700">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <PixiApp
        width={width}
        height={height}
        backgroundColor={0x2c3e50}
        onReady={handlePixiReady}
        onUpdate={handleUpdate}
      />
      
      {gameReady && (
        <div className="absolute top-4 left-4 space-y-2">
          <button
            onClick={handleSpawnKaiju}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Spawn Kaiju
          </button>
          <button
            onClick={handleCreateEffect}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Effect
          </button>
          <button
            onClick={handleShakeCamera}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Shake Camera
          </button>
        </div>
      )}

      {!gameReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-lg">Loading game...</div>
        </div>
      )}
    </div>
  );
};