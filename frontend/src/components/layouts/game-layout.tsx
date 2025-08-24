"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Swords,
  Shield,
  Heart,
  Battery,
  Volume2,
  VolumeX
} from "lucide-react";

interface GameLayoutProps {
  children: ReactNode;
  isLoading?: boolean;
  loadingProgress?: number;
  showControls?: boolean;
  onExitFullscreen?: () => void;
  health?: number;
  maxHealth?: number;
  energy?: number;
  maxEnergy?: number;
  score?: number;
  gameMode?: string;
  onToggleSound?: () => void;
  soundEnabled?: boolean;
}

export function GameLayout({
  children,
  isLoading = false,
  loadingProgress = 0,
  showControls = true,
  onExitFullscreen,
  health = 75,
  maxHealth = 100,
  energy = 50,
  maxEnergy = 100,
  score = 0,
  gameMode = "Battle Arena",
  onToggleSound,
  soundEnabled = true,
}: GameLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-hide UI after inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastInteraction > 3000 && !isLoading) {
        setShowUI(false);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastInteraction, isLoading]);

  // Handle mouse movement
  const handleMouseMove = () => {
    setLastInteraction(Date.now());
    setShowUI(true);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
      onExitFullscreen?.();
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Game Canvas Container */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 mx-auto"
                >
                  <span className="text-6xl">🦖</span>
                </motion.div>
              </div>
              
              <h2 className="font-orbitron font-bold text-2xl text-purple-400 mb-4">
                Loading Battle Arena
              </h2>
              
              {/* Progress Bar */}
              <div className="w-64 mx-auto">
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                  />
                </div>
                <p className="mt-2 text-gray-400 text-sm">
                  {Math.round(loadingProgress)}% Complete
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game UI Overlay */}
      <AnimatePresence>
        {showUI && showControls && !isLoading && (
          <>
            {/* Top Bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent p-4"
            >
              <div className="flex items-center justify-between">
                {/* Exit Button */}
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-stone-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-orbitron text-sm">Exit Battle</span>
                </Link>

                {/* Game Info */}
                <div className="flex items-center space-x-4">
                  <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg">
                    <p className="text-xs text-gray-400">{gameMode}</p>
                    <p className="font-mono text-purple-400">Score: {score.toLocaleString()}</p>
                  </div>
                  
                  {/* Sound Toggle */}
                  <button
                    onClick={onToggleSound}
                    className="p-2 bg-stone-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                  
                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-stone-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Bottom Controls (Mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden"
            >
              <div className="flex items-center justify-center space-x-4">
                {/* Mobile Game Controls */}
                <button className="p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors active:scale-95">
                  <Shield className="w-6 h-6" />
                </button>
                
                <button className="p-6 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors active:scale-95">
                  <Swords className="w-8 h-8" />
                </button>
                
                <button className="p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors active:scale-95">
                  <Zap className="w-6 h-6" />
                </button>
              </div>
            </motion.div>

            {/* Side HUD (Desktop) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 hidden md:block"
            >
              <div className="space-y-4">
                {/* Health Bar */}
                <div className="bg-stone-800/80 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3 text-red-400" />
                      <p className="text-xs text-gray-400">Health</p>
                    </div>
                    <p className="text-xs font-mono text-gray-300">{health}/{maxHealth}</p>
                  </div>
                  <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(health / maxHealth) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full bg-gradient-to-r ${
                        health / maxHealth > 0.5 ? 'from-green-500 to-green-400' : 
                        health / maxHealth > 0.25 ? 'from-yellow-500 to-yellow-400' : 
                        'from-red-500 to-red-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Energy Bar */}
                <div className="bg-stone-800/80 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <Battery className="w-3 h-3 text-blue-400" />
                      <p className="text-xs text-gray-400">Energy</p>
                    </div>
                    <p className="text-xs font-mono text-gray-300">{energy}/{maxEnergy}</p>
                  </div>
                  <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(energy / maxEnergy) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Touch Controls Hint (Mobile) */}
      {showUI && !isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none md:hidden">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-gray-400 text-sm"
          >
            Tap to show controls
          </motion.p>
        </div>
      )}
    </div>
  );
}