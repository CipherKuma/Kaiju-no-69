'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useKaijuStore } from '@/lib/stores/kaijuStore';
import { useTransformationStore } from '@/lib/stores/transformationStore';
import { cn } from '@/lib/utils';
import { Search, Check, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TERRITORY_COLORS = {
  fire: 'border-red-500 bg-red-500/10 hover:bg-red-500/20',
  water: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20',
  earth: 'border-green-500 bg-green-500/10 hover:bg-green-500/20',
  air: 'border-purple-500 bg-purple-500/10 hover:bg-purple-500/20'
};

const TRADING_STYLE_ICONS = {
  aggressive: '🔥',
  conservative: '🛡️',
  balanced: '⚖️',
  arbitrage: '🔄'
};

export function KaijuSelector() {
  const kaijus = useKaijuStore((state) => state.kaijus);
  const { selectedKaiju, setSelectedKaiju } = useTransformationStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKaijus = kaijus.filter(kaiju => 
    kaiju.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kaiju.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kaiju.tradingStyle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Select Your Kaiju
        </h2>
        <p className="text-gray-400">
          Choose the Kaiju you want to transform into a trading shadow
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name, territory, or trading style..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-stone-800/50 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Kaiju Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredKaijus.map((kaiju) => (
          <motion.button
            key={kaiju.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedKaiju(kaiju.id)}
            className={cn(
              "relative rounded-xl border-2 p-4 transition-all duration-200",
              "flex flex-col items-center space-y-3",
              selectedKaiju === kaiju.id 
                ? TERRITORY_COLORS[kaiju.territory as keyof typeof TERRITORY_COLORS]
                : "border-gray-700 bg-stone-800/50 hover:border-gray-600"
            )}
          >
            {/* Selected Indicator */}
            {selectedKaiju === kaiju.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}

            {/* Kaiju Image */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              <img
                src={kaiju.imageUrl}
                alt={kaiju.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white/80">{kaiju.territory}</p>
              </div>
            </div>

            {/* Kaiju Info */}
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-white">{kaiju.name}</h3>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{TRADING_STYLE_ICONS[kaiju.tradingStyle]}</span>
                <span className="text-xs text-gray-400 capitalize">{kaiju.tradingStyle}</span>
              </div>
            </div>

            {/* Stats Preview */}
            <div className="w-full grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-700/50 rounded px-2 py-1">
                <p className="text-gray-400">Win Rate</p>
                <p className="text-white font-mono">{Math.floor(Math.random() * 30 + 60)}%</p>
              </div>
              <div className="bg-gray-700/50 rounded px-2 py-1">
                <p className="text-gray-400">ROI</p>
                <p className="text-emerald-400 font-mono">+{Math.floor(Math.random() * 100 + 50)}%</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {filteredKaijus.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No Kaijus found matching your search</p>
        </div>
      )}
    </div>
  );
}