'use client'

import { KaijuDiscoveryHub } from "@/components/kaiju";
import { Kaiju } from "@/types/models";
import { kaijuApi } from "@/lib/api/kaiju-api";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function MarketplacePage() {
  const router = useRouter();
  const [kaijus, setKaijus] = useState<Kaiju[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKaijus();
  }, []);

  const fetchKaijus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch kaijus from the backend
      const response = await kaijuApi.getKaijuList({
        page: 1,
        pageSize: 50, // Get up to 50 kaijus
        sort: {
          field: 'performance',
          order: 'desc'
        }
      });
      
      setKaijus(response.data);
    } catch (err) {
      console.error('Failed to fetch kaijus:', err);
      setError('Failed to load Kaijus. Please try again later.');
      
      // Fallback to mock data for development
      setKaijus(getMockKaijus());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Forest Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/forest.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-purple-900/20 to-transparent pt-16 pb-8">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-5xl font-bold font-heading mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Choose Your Master
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Select a Kaiju to sacrifice yourself to. Once you become a Shadow, 
                you&apos;ll automatically mirror their trades and share in their success.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Sacrifice Instructions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="container mx-auto px-4 mb-8"
        >
          <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">How the Sacrifice Works:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Choose a Kaiju</p>
                  <p>Select a trading beast whose strategy aligns with your goals</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Configure & Mint</p>
                  <p>Set your trading limits and mint your Shadow NFT</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Follow Automatically</p>
                  <p>Your shadow mirrors all trades made by your chosen Kaiju</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-300">Loading Kaijus...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-2xl mx-auto text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchKaijus}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Kaiju Discovery Hub */}
        {!loading && kaijus.length > 0 && (
          <KaijuDiscoveryHub initialKaijus={kaijus} />
        )}

        {/* Empty State */}
        {!loading && !error && kaijus.length === 0 && (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <p className="text-gray-300 mb-6">No Kaijus available at the moment.</p>
              <button
                onClick={() => router.push('/create-kaiju')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your Own Kaiju
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data fallback for development
function getMockKaijus(): Kaiju[] {
  return [
    {
      id: "1",
      name: "Shadow Dragon",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowDragon",
      performance: {
        last30Days: 45.2,
        totalReturn: 187.5,
        winRate: 68.4,
        totalTrades: 1234,
        sharpeRatio: 2.1,
        maxDrawdown: -12.5,
        dailyReturns: []
      },
      territory: "fire-realm-1",
      isOnline: true,
      shadows: [],
      traderTitle: "DeFi Arbitrage Master",
      entryFee: 0.5,
      profitShare: 20,
      description: "Specializing in cross-chain arbitrage opportunities with advanced MEV strategies.",
      tradingStyle: "arbitrage",
      popularity: 892
    },
    {
      id: "2",
      name: "Neon Samurai",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeonSamurai",
      performance: {
        last30Days: -8.7,
        totalReturn: 67.3,
        winRate: 52.1,
        totalTrades: 567,
        sharpeRatio: 1.3,
        maxDrawdown: -25.0,
        dailyReturns: []
      },
      territory: "water-realm-1",
      isOnline: false,
      shadows: [],
      traderTitle: "High-Risk Degen",
      entryFee: 0.1,
      profitShare: 30,
      description: "High-risk, high-reward trading focusing on emerging tokens and new protocols.",
      tradingStyle: "aggressive",
      popularity: 245
    }
  ];
}