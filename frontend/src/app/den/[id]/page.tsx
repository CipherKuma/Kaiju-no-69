'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KaijuTradesView } from '@/components/den/kaiju-trades-view';
import { KaijuShadowsList } from '@/components/den/kaiju-shadows-list';
import { KaijuChat } from '@/components/den/kaiju-chat';
import { KaijuNFTManagement } from '@/components/den/kaiju-nft-management';
import { ShadowMarketplace } from '@/components/den/shadow-marketplace';
import { KaijuDenHeader } from '@/components/den/kaiju-den-header';
import { useKaijuStore } from '@/lib/stores/kaijuStore';
import { Kaiju } from '@/types/models';

export default function KaijuDenPage() {
  const params = useParams();
  const kaijuId = params.id as string;
  const [activeTab, setActiveTab] = useState('trades');
  const [kaiju, setKaiju] = useState<Kaiju | null>(null);
  const kaijuStore = useKaijuStore();

  useEffect(() => {
    // Try to get kaiju from store
    const storedKaiju = kaijuStore.getKaiju(kaijuId);
    
    if (storedKaiju) {
      setKaiju(storedKaiju);
    } else {
      // Create minimal kaiju data for NFT collections that don't have Supabase entries yet
      setKaiju({
        id: kaijuId,
        name: `Kaiju #${kaijuId}`,
        description: 'A powerful trading beast',
        imageUrl: '/kaiju.png',
        territory: 'unknown',
        traderTitle: 'Trading Beast',
        entryFee: 0.001,
        profitShare: 20,
        tradingStyle: 'balanced',
        isOnline: false,
        shadows: [],
        performance: {
          last30Days: 0,
          totalReturn: 0,
          winRate: 0,
          totalTrades: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          dailyReturns: []
        }
      });
    }
  }, [kaijuId, kaijuStore]);

  if (!kaiju) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400">Loading Kaiju Den...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
      >
        <source src="/forest.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto py-8 px-4"
        >
          {/* Header */}
          <KaijuDenHeader kaiju={kaiju} />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-5 bg-stone-800/80 backdrop-blur-sm">
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="shadows">Shadows</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="nft">NFT Management</TabsTrigger>
              <TabsTrigger value="marketplace">Shadow Market</TabsTrigger>
            </TabsList>

            <div className="mt-6 bg-stone-900/80 backdrop-blur-sm rounded-lg p-6">
              <TabsContent value="trades" className="m-0">
                <KaijuTradesView kaijuId={kaiju.id} />
              </TabsContent>

              <TabsContent value="shadows" className="m-0">
                <KaijuShadowsList kaijuId={kaiju.id} />
              </TabsContent>

              <TabsContent value="chat" className="m-0">
                <KaijuChat kaijuId={kaiju.id} />
              </TabsContent>

              <TabsContent value="nft" className="m-0">
                <KaijuNFTManagement kaiju={kaiju} />
              </TabsContent>

              <TabsContent value="marketplace" className="m-0">
                <ShadowMarketplace kaijuId={kaiju.id} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}