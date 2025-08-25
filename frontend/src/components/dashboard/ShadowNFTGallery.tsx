"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shadow, Kaiju } from "@/types/models";
import { theme } from "@/lib/theme";
import { Search, Grid, List, X } from "lucide-react";

interface ShadowNFTGalleryProps {
  shadows: Shadow[];
  kaijus: Kaiju[];
  onSelectShadow?: (shadow: Shadow) => void;
}

interface NFTCardProps {
  shadow: Shadow;
  kaiju: Kaiju;
  onClick: () => void;
}

function NFTCard({ shadow, kaiju, onClick }: NFTCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const rarityColors = {
    common: theme.colors.territories.earth.DEFAULT,
    rare: theme.colors.territories.water.DEFAULT,
    epic: theme.colors.territories.air.DEFAULT,
    legendary: theme.colors.territories.fire.DEFAULT,
  };
  
  const rarityColor = rarityColors[shadow.rarity || "common"];
  
  return (
    <motion.div
      className="relative w-full h-96 cursor-pointer preserve-3d"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFlipped ? "back" : "front"}
          className="absolute inset-0 backface-hidden"
          initial={{ rotateY: isFlipped ? 180 : 0 }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          exit={{ rotateY: isFlipped ? 0 : -180 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {!isFlipped ? (
            // Front of card
            <div
              className="w-full h-full rounded-xl overflow-hidden relative"
              style={{
                background: `linear-gradient(135deg, ${rarityColor}20 0%, transparent 50%)`,
                border: `2px solid ${rarityColor}`,
              }}
            >
              {/* NFT Image */}
              <div className="relative h-2/3 overflow-hidden">
                <img
                  src={kaiju.imageUrl}
                  alt={kaiju.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"
                  style={{
                    background: `linear-gradient(to top, #111827 0%, transparent 50%)`,
                  }}
                />
                
                {/* Rarity Badge */}
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase"
                  style={{
                    backgroundColor: rarityColor,
                    color: "#fff",
                  }}
                >
                  {shadow.rarity}
                </div>
                
                {/* Active Indicator */}
                {shadow.isActive && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Active
                  </div>
                )}
              </div>
              
              {/* Card Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900">
                <h3 className="text-lg font-bold mb-1">{kaiju.name}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">Shadow #{shadow.nftId}</p>
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: shadow.currentPL >= 0
                        ? theme.colors.success.DEFAULT
                        : theme.colors.danger.DEFAULT,
                    }}
                  >
                    {shadow.currentPL >= 0 ? "+" : ""}${shadow.currentPL.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Hover Effect */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(true);
                      }}
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      View Details
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Back of card
            <div className="w-full h-full rounded-xl bg-gray-900 border-2 border-gray-800 p-6 rotate-y-180">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{kaiju.name} Details</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Traits */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Traits</h4>
                <div className="grid grid-cols-2 gap-2">
                  {shadow.traits?.map((trait, index) => (
                    <div key={index} className="bg-stone-800 rounded-lg p-2">
                      <p className="text-xs text-gray-400">{trait.name}</p>
                      <p className="text-sm font-medium">{trait.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance Stats */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Win Rate</span>
                    <span className="text-sm font-medium">{kaiju.performance.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Trades</span>
                    <span className="text-sm font-medium">{kaiju.performance.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Return</span>
                    <span className="text-sm font-medium">${kaiju.performance.totalReturn.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Expiry Info */}
              <div className="mt-auto">
                <p className="text-xs text-gray-400">
                  Expires: {new Date(shadow.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export function ShadowNFTGallery({ shadows, kaijus, onSelectShadow }: ShadowNFTGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedShadow, setSelectedShadow] = useState<Shadow | null>(null);
  
  const filteredShadows = useMemo(() => {
    return shadows.filter((shadow) => {
      const kaiju = kaijus.find(k => k.id === shadow.kaijuId);
      if (!kaiju) return false;
      
      const matchesSearch = kaiju.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          shadow.nftId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRarity = !selectedRarity || shadow.rarity === selectedRarity;
      
      return matchesSearch && matchesRarity;
    });
  }, [shadows, kaijus, searchQuery, selectedRarity]);
  
  const rarities = ["common", "rare", "epic", "legendary"];
  
  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or NFT ID..."
              className="w-full pl-10 pr-4 py-2 bg-stone-800 rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Rarity Filter */}
          <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedRarity(null)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                !selectedRarity ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
            {rarities.map((rarity) => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={`px-3 py-1 rounded text-sm transition-colors capitalize ${
                  selectedRarity === rarity ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Gallery Grid */}
      <div className={`grid gap-6 ${
        viewMode === "grid" 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1"
      }`}>
        {filteredShadows.map((shadow) => {
          const kaiju = kaijus.find(k => k.id === shadow.kaijuId);
          if (!kaiju) return null;
          
          return (
            <NFTCard
              key={shadow.nftId}
              shadow={shadow}
              kaiju={kaiju}
              onClick={() => {
                setSelectedShadow(shadow);
                onSelectShadow?.(shadow);
              }}
            />
          );
        })}
      </div>
      
      {/* Empty State */}
      {filteredShadows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No Shadow NFTs found matching your criteria.</p>
        </div>
      )}
      
      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {selectedShadow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedShadow(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Full preview implementation would go here */}
              <div className="bg-gray-900 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-4">Shadow NFT Preview</h2>
                <p className="text-gray-400">Full preview coming soon...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}