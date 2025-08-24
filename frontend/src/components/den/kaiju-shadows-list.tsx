"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Shield, TrendingUp, DollarSign, Calendar, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Shadow {
  id: string;
  ownerAddress: string;
  ownerEns?: string;
  mintedAt: Date;
  expiresAt: Date;
  tokenId: string;
  performance: {
    totalReturn: number;
    totalTrades: number;
    winRate: number;
  };
  isActive: boolean;
  imageUrl?: string;
}

interface KaijuShadowsListProps {
  kaijuId: string;
}

// Mock data generator
const generateMockShadows = (): Shadow[] => {
  return Array.from({ length: 15 }, (_, i) => {
    const mintedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.floor(Math.random() * 30);
    const expiresAt = new Date(mintedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      id: `shadow-${i}`,
      ownerAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      ownerEns: Math.random() > 0.6 ? `shadow${i}.eth` : undefined,
      mintedAt,
      expiresAt,
      tokenId: `#${1000 + i}`,
      performance: {
        totalReturn: (Math.random() - 0.3) * 100,
        totalTrades: Math.floor(Math.random() * 50) + 10,
        winRate: Math.random() * 100,
      },
      isActive: daysLeft > 0,
      imageUrl: `/shadow.png`,
    };
  }).sort((a, b) => b.mintedAt.getTime() - a.mintedAt.getTime());
};

export function KaijuShadowsList({ kaijuId }: KaijuShadowsListProps) {
  const [shadows, setShadows] = useState<Shadow[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'performance' | 'expiry'>('recent');

  useEffect(() => {
    // In production, fetch shadows from API
    setShadows(generateMockShadows());
  }, [kaijuId]);

  const filteredShadows = shadows.filter(shadow => {
    if (filter === 'active') return shadow.isActive;
    if (filter === 'expired') return !shadow.isActive;
    return true;
  });

  const sortedShadows = [...filteredShadows].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b.performance.totalReturn - a.performance.totalReturn;
      case 'expiry':
        return a.expiresAt.getTime() - b.expiresAt.getTime();
      default:
        return b.mintedAt.getTime() - a.mintedAt.getTime();
    }
  });

  const activeShadows = shadows.filter(s => s.isActive).length;
  const totalShadows = shadows.length;
  const avgPerformance = shadows.reduce((sum, s) => sum + s.performance.totalReturn, 0) / totalShadows || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Active Shadows</span>
          </div>
          <p className="text-2xl font-bold">{activeShadows} / {totalShadows}</p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg Performance</span>
          </div>
          <p className={`text-2xl font-bold ${avgPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {avgPerformance >= 0 ? '+' : ''}{avgPerformance.toFixed(2)}%
          </p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Value Locked</span>
          </div>
          <p className="text-2xl font-bold">{(totalShadows * 0.1).toFixed(2)} ETH</p>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-stone-700 text-white' 
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' 
                ? 'bg-green-900/50 text-green-400' 
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'expired' 
                ? 'bg-red-900/50 text-red-400' 
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
            }`}
          >
            Expired
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 rounded-lg bg-stone-800 text-stone-200 text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="performance">Best Performance</option>
          <option value="expiry">Expiring Soon</option>
        </select>
      </div>

      {/* Shadows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedShadows.map((shadow) => {
          const daysUntilExpiry = Math.ceil((shadow.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const subscriptionProgress = shadow.isActive 
            ? ((30 - Math.max(0, daysUntilExpiry)) / 30) * 100
            : 100;

          return (
            <Card key={shadow.id} className="bg-stone-800/50 p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={shadow.imageUrl} />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {shadow.ownerEns || `${shadow.ownerAddress.slice(0, 6)}...${shadow.ownerAddress.slice(-4)}`}
                    </p>
                    <p className="text-sm text-stone-400">Token {shadow.tokenId}</p>
                  </div>
                </div>
                <Badge variant={shadow.isActive ? "default" : "secondary"}>
                  {shadow.isActive ? "Active" : "Expired"}
                </Badge>
              </div>

              {/* Performance Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Performance</span>
                  <span className={shadow.performance.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {shadow.performance.totalReturn >= 0 ? '+' : ''}{shadow.performance.totalReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Win Rate</span>
                  <span>{shadow.performance.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Total Trades</span>
                  <span>{shadow.performance.totalTrades}</span>
                </div>
              </div>

              {/* Subscription Progress */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Subscription
                  </span>
                  <span className={daysUntilExpiry > 7 ? 'text-stone-200' : 'text-yellow-500'}>
                    {shadow.isActive ? `${Math.max(0, daysUntilExpiry)} days left` : 'Expired'}
                  </span>
                </div>
                <Progress value={subscriptionProgress} className="h-2" />
              </div>

              {/* Dates */}
              <div className="space-y-1 text-xs text-stone-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Minted {formatDistanceToNow(shadow.mintedAt, { addSuffix: true })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`https://opensea.io/assets/ethereum/${shadow.ownerAddress}/${shadow.tokenId}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  OpenSea
                </Button>
                {!shadow.isActive && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    Buy Shadow
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}