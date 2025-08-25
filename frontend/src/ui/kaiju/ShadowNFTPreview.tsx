'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTransformationStore } from '@/lib/stores/transformationStore';
import { useKaijuStore } from '@/lib/stores/kaijuStore';
import { ShadowRarity, ShadowTrait } from '@/types/transformation';
import { Sparkles, Zap, Skull, Crown, Flame } from 'lucide-react';

const RARITY_COLORS = {
  common: 'from-gray-500 to-gray-700',
  rare: 'from-blue-500 to-blue-700',
  epic: 'from-purple-500 to-purple-700',
  legendary: 'from-yellow-500 to-orange-600'
};

const RARITY_GLOWS = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50'
};

function generateTraits(kaijuName: string, riskLevel: number): ShadowTrait[] {
  const baseTraits: ShadowTrait[] = [
    { name: 'Origin', value: kaijuName, rarity: 'common' },
    { name: 'Form', value: 'Shadow', rarity: 'common' }
  ];

  const riskTraits: ShadowTrait[] = [];
  
  if (riskLevel >= 3) {
    riskTraits.push({ name: 'Volatility', value: 'High', rarity: 'rare' });
  }
  if (riskLevel >= 4) {
    riskTraits.push({ name: 'Dark Energy', value: 'Unstable', rarity: 'epic' });
  }
  if (riskLevel === 5) {
    riskTraits.push({ name: 'Degen Mode', value: 'Activated', rarity: 'legendary' });
  }

  return [...baseTraits, ...riskTraits];
}

function calculateRarity(riskLevel: number): ShadowRarity {
  if (riskLevel === 5) return 'legendary';
  if (riskLevel === 4) return 'epic';
  if (riskLevel === 3) return 'rare';
  return 'common';
}

function calculatePowerLevel(riskLevel: number, budget: number): number {
  const basePower = 100;
  const riskMultiplier = riskLevel * 20;
  const budgetBonus = Math.min(budget / 100, 50);
  return Math.round(basePower + riskMultiplier + budgetBonus);
}

export function ShadowNFTPreview() {
  const { selectedKaiju, policy } = useTransformationStore();
  const kaijus = useKaijuStore((state) => state.kaijus);
  const selectedKaijuData = kaijus.find(k => k.id === selectedKaiju);
  
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);

  const rarity = calculateRarity(policy.riskLevel || 3);
  const traits = generateTraits(selectedKaijuData?.name || 'Unknown', policy.riskLevel || 3);
  const powerLevel = calculatePowerLevel(policy.riskLevel || 3, policy.totalBudget || 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransforming(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTransforming) {
      const progressInterval = setInterval(() => {
        setTransformProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(progressInterval);
    }
  }, [isTransforming]);

  if (!selectedKaijuData) {
    return (
      <div className="p-6 bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800 h-full flex items-center justify-center">
        <p className="text-gray-500">Select a Kaiju to preview transformation</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800 space-y-6">
      <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
        <Skull className="w-6 h-6" />
        Shadow NFT Preview
      </h2>

      {/* NFT Preview */}
      <div className="relative">
        <div className={cn(
          "relative w-full aspect-square rounded-xl overflow-hidden",
          "shadow-2xl",
          RARITY_GLOWS[rarity]
        )}>
          {/* Background Gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-30",
            RARITY_COLORS[rarity]
          )} />

          {/* Kaiju Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isTransforming ? 'shadow' : 'normal'}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <img
                src={selectedKaijuData.imageUrl}
                alt={selectedKaijuData.name}
                className={cn(
                  "w-full h-full object-cover",
                  isTransforming && "filter brightness-50 contrast-125 hue-rotate-180 saturate-150"
                )}
              />
            </motion.div>
          </AnimatePresence>

          {/* Transformation Effects */}
          {isTransforming && (
            <>
              {/* Dark Energy Particles */}
              <div className="absolute inset-0 z-20">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: Math.random() * 200 - 100,
                      y: Math.random() * 200 - 100
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-500 rounded-full blur-sm"
                  />
                ))}
              </div>

              {/* Lightning Effect */}
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
                className="absolute inset-0 z-30"
              >
                <Zap className="absolute top-1/4 right-1/4 w-16 h-16 text-purple-400" />
              </motion.div>
            </>
          )}

          {/* Rarity Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-4 right-4 z-40"
          >
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase",
              "bg-black/70 backdrop-blur border",
              rarity === 'legendary' && "border-yellow-500 text-yellow-400",
              rarity === 'epic' && "border-purple-500 text-purple-400",
              rarity === 'rare' && "border-blue-500 text-blue-400",
              rarity === 'common' && "border-gray-500 text-gray-400"
            )}>
              {rarity === 'legendary' && <Crown className="inline w-3 h-3 mr-1" />}
              {rarity}
            </div>
          </motion.div>
        </div>

        {/* Transformation Progress */}
        {isTransforming && (
          <div className="absolute bottom-4 left-4 right-4 z-40">
            <div className="bg-black/70 backdrop-blur rounded-full p-1">
              <div className="relative h-2 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400"
                  style={{ width: `${transformProgress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">
              Transforming... {transformProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Traits */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Shadow Traits
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {traits.map((trait, index) => (
            <motion.div
              key={trait.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg border bg-stone-800/30",
                trait.rarity === 'legendary' && "border-yellow-500/50",
                trait.rarity === 'epic' && "border-purple-500/50",
                trait.rarity === 'rare' && "border-blue-500/50",
                trait.rarity === 'common' && "border-gray-700"
              )}
            >
              <p className="text-xs text-gray-500">{trait.name}</p>
              <p className="text-sm font-medium text-white">{trait.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Power Level */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400">Power Level</span>
          </div>
          <motion.span
            key={powerLevel}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold font-mono bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            {powerLevel}
          </motion.span>
        </div>
      </div>
    </div>
  );
}