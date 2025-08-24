'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { PerformanceMonitor } from '@/lib/game/pixi/PerformanceMonitor';

interface PixiAppProps {
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  onReady?: (app: PIXI.Application) => void;
  onUpdate?: (delta: number) => void;
  children?: (app: PIXI.Application) => React.ReactNode;
}

export const PixiApp: React.FC<PixiAppProps> = ({
  width = 800,
  height = 600,
  backgroundColor = 0x1a1a1a,
  antialias = true,
  resolution = window.devicePixelRatio || 1,
  onReady,
  onUpdate,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    appRef.current = app;
    let performanceMonitor: PerformanceMonitor | null = null;
    let isDestroyed = false;

    const init = async () => {
      try {
        await app.init({
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor,
          antialias,
          resolution,
          autoDensity: true,
          powerPreference: 'high-performance',
          preference: 'webgl',
        });

        // Check if component was unmounted during initialization
        if (isDestroyed || !containerRef.current) return;

        app.canvas.style.display = 'block';
        app.canvas.style.margin = '0 auto';
        containerRef.current.appendChild(app.canvas);

        performanceMonitor = new PerformanceMonitor(app);
        performanceMonitor.enable();

        app.ticker.add((delta) => {
          if (isDestroyed) return;
          try {
            performanceMonitor?.update();
            onUpdate?.(delta.deltaTime);
          } catch (error) {
            console.warn('Error in PIXI ticker:', error);
          }
        });

        setIsReady(true);
        onReady?.(app);
        
        // Call handleResize after app is ready
        handleResize();
      } catch (error) {
        console.error('Failed to initialize PIXI app:', error);
      }
    };

    const handleResize = () => {
      if (isDestroyed || !containerRef.current || !app?.canvas || !app?.renderer) return;
      
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const newWidth = Math.max(800, parent.clientWidth);
      const newHeight = Math.max(600, parent.clientHeight);

      setDimensions({ width: newWidth, height: newHeight });
      try {
        app.renderer.resize(newWidth, newHeight);
      } catch (error) {
        console.warn('Error resizing PIXI renderer:', error);
      }
    };

    window.addEventListener('resize', handleResize);
    init();

    return () => {
      isDestroyed = true;
      window.removeEventListener('resize', handleResize);
      performanceMonitor?.destroy();
      
      // Safely destroy the PIXI application
      const currentApp = appRef.current;
      if (currentApp) {
        try {
          // Remove canvas from DOM first if it exists
          if (containerRef.current && currentApp.canvas && containerRef.current.contains(currentApp.canvas)) {
            containerRef.current.removeChild(currentApp.canvas);
          }
          // Destroy the app
          currentApp.destroy(true, { children: true });
        } catch (error) {
          console.warn('Error cleaning up PIXI app:', error);
        }
        appRef.current = null;
      }
    };
  }, [backgroundColor, antialias, resolution]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: dimensions.width, 
        height: dimensions.height,
        minWidth: '800px',
        minHeight: '600px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isReady && appRef.current && children?.(appRef.current)}
    </div>
  );
};