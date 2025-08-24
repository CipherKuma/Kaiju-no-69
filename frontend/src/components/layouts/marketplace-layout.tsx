"use client";

import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "./page-header";
import { 
  Filter, 
  X, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind,
  Sparkles,
  Diamond,
  Gem,
  Circle,
  DollarSign,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";

interface MarketplaceLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  totalItems?: number;
}

interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

const kaijuTypes: FilterOption[] = [
  { id: "all", label: "All Kaijus", count: 1234, icon: <Sparkles className="w-4 h-4" /> },
  { id: "fire", label: "Fire", count: 312, icon: <Flame className="w-4 h-4 text-orange-400" /> },
  { id: "water", label: "Water", count: 298, icon: <Droplets className="w-4 h-4 text-blue-400" /> },
  { id: "earth", label: "Earth", count: 345, icon: <Mountain className="w-4 h-4 text-amber-400" /> },
  { id: "air", label: "Air", count: 279, icon: <Wind className="w-4 h-4 text-cyan-400" /> },
];

const rarityOptions: FilterOption[] = [
  { id: "legendary", label: "Legendary", count: 12, icon: <Diamond className="w-4 h-4 text-yellow-400" /> },
  { id: "epic", label: "Epic", count: 156, icon: <Gem className="w-4 h-4 text-purple-400" /> },
  { id: "rare", label: "Rare", count: 423, icon: <Sparkles className="w-4 h-4 text-blue-400" /> },
  { id: "common", label: "Common", count: 643, icon: <Circle className="w-4 h-4 text-gray-400" /> },
];

const priceRanges: FilterOption[] = [
  { id: "0-100", label: "0 - 100 SOL" },
  { id: "100-500", label: "100 - 500 SOL" },
  { id: "500-1000", label: "500 - 1,000 SOL" },
  { id: "1000+", label: "1,000+ SOL" },
];

export function MarketplaceLayout({
  children,
  title = "Marketplace",
  subtitle = "Discover and trade unique Kaijus",
  totalItems = 0,
}: MarketplaceLayoutProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recent");

  const toggleRarity = (rarity: string) => {
    setSelectedRarity((prev) =>
      prev.includes(rarity) 
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity]
    );
  };

  const togglePriceRange = (range: string) => {
    setSelectedPriceRange((prev) =>
      prev.includes(range)
        ? prev.filter((r) => r !== range)
        : [...prev, range]
    );
  };

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedRarity([]);
    setSelectedPriceRange([]);
    setSortBy("recent");
  };

  const hasActiveFilters = 
    selectedType !== "all" || 
    selectedRarity.length > 0 || 
    selectedPriceRange.length > 0 ||
    sortBy !== "recent";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort Options */}
      <div>
        <h3 className="font-orbitron font-bold text-purple-400 mb-3">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 bg-stone-800 border border-purple-500/20 rounded-lg text-gray-300 focus:border-purple-500/50 focus:outline-none"
        >
          <option value="recent">🕒 Recently Listed</option>
          <option value="price-low">📈 Price: Low to High</option>
          <option value="price-high">📉 Price: High to Low</option>
          <option value="power">⚡ Battle Power</option>
        </select>
      </div>

      {/* Kaiju Type Filter */}
      <div>
        <h3 className="font-orbitron font-bold text-purple-400 mb-3">Kaiju Type</h3>
        <div className="space-y-2">
          {kaijuTypes.map((type) => (
            <label
              key={type.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="kaiju-type"
                  value={type.id}
                  checked={selectedType === type.id}
                  onChange={() => setSelectedType(type.id)}
                  className="text-purple-500 focus:ring-purple-500"
                />
                {type.icon}
                <span className="text-gray-300">{type.label}</span>
              </div>
              {type.count && (
                <span className="text-gray-500 text-sm">{type.count}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Rarity Filter */}
      <div>
        <h3 className="font-orbitron font-bold text-purple-400 mb-3">Rarity</h3>
        <div className="space-y-2">
          {rarityOptions.map((rarity) => (
            <label
              key={rarity.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedRarity.includes(rarity.id)}
                  onChange={() => toggleRarity(rarity.id)}
                  className="text-purple-500 focus:ring-purple-500 rounded"
                />
                {rarity.icon}
                <span className="text-gray-300">{rarity.label}</span>
              </div>
              {rarity.count && (
                <span className="text-gray-500 text-sm">{rarity.count}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="font-orbitron font-bold text-purple-400 mb-3">Price Range</h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range.id}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-800/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPriceRange.includes(range.id)}
                onChange={() => togglePriceRange(range.id)}
                className="text-purple-500 focus:ring-purple-500 rounded"
              />
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Filters */}
      <div>
        <h3 className="font-orbitron font-bold text-purple-400 mb-3">Special Traits</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-800/50 cursor-pointer transition-colors">
            <input type="checkbox" className="text-purple-500 focus:ring-purple-500 rounded" />
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">Evolved</span>
          </label>
          <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-800/50 cursor-pointer transition-colors">
            <input type="checkbox" className="text-purple-500 focus:ring-purple-500 rounded" />
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Rising Power</span>
          </label>
          <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-800/50 cursor-pointer transition-colors">
            <input type="checkbox" className="text-purple-500 focus:ring-purple-500 rounded" />
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">New Listing</span>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 px-4 bg-stone-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {totalItems.toLocaleString()} items
            </span>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                  {(selectedRarity.length + selectedPriceRange.length + (selectedType !== "all" ? 1 : 0))}
                </span>
              )}
            </button>
          </div>
        }
      />

      <div className="flex">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden md:block w-80 border-r border-purple-500/20 bg-stone-800/50">
          <div className="p-6 sticky top-0">
            <h2 className="font-orbitron font-bold text-xl text-white mb-6">
              Filters
            </h2>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed right-0 top-0 h-full w-full max-w-sm bg-stone-800 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-orbitron font-bold text-xl text-white">
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <FilterContent />
                
                {/* Apply Button */}
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="mt-6 w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-orbitron font-bold rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}