"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  Trophy, 
  Users, 
  Copy, 
  Eye, 
  EyeOff,
  Crown,
  RefreshCw,
  Search,
  UserPlus,
  Award,
  Target,
  Activity
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { TradeExecution } from '@/types/models';
import { useTradingStore } from '@/stores/tradingStore';

interface TraderProfile {
  id: string;
  username: string;
  avatar: string;
  kaijuName: string;
  kaijuAvatar: string;
  performance: {
    totalReturn: number;
    winRate: number;
    totalTrades: number;
    averageReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  followers: number;
  isFollowed: boolean;
  rank: number;
  shadowCount: number;
  recentTrades: TradeExecution[];
  badge?: 'legendary' | 'master' | 'expert' | 'rising';
}

interface TradingPostOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  territoryId: string;
  territoryName: string;
}

// Mock data for demonstration
const MOCK_TRADERS: TraderProfile[] = [
  {
    id: '1',
    username: 'DragonSlayer',
    avatar: '/avatars/user1.jpg',
    kaijuName: 'Inferno Rex',
    kaijuAvatar: '/kaiju/fire1.jpg',
    performance: {
      totalReturn: 245.7,
      winRate: 78.4,
      totalTrades: 156,
      averageReturn: 12.3,
      sharpeRatio: 2.8,
      maxDrawdown: -8.2
    },
    followers: 1247,
    isFollowed: false,
    rank: 1,
    shadowCount: 89,
    recentTrades: [],
    badge: 'legendary'
  },
  {
    id: '2', 
    username: 'WaveRider',
    avatar: '/avatars/user2.jpg',
    kaijuName: 'Tidal Force',
    kaijuAvatar: '/kaiju/water1.jpg',
    performance: {
      totalReturn: 189.3,
      winRate: 72.1,
      totalTrades: 203,
      averageReturn: 8.7,
      sharpeRatio: 2.2,
      maxDrawdown: -12.5
    },
    followers: 892,
    isFollowed: true,
    rank: 2,
    shadowCount: 67,
    recentTrades: [],
    badge: 'master'
  },
  {
    id: '3',
    username: 'StormChaser', 
    avatar: '/avatars/user3.jpg',
    kaijuName: 'Thunder Wing',
    kaijuAvatar: '/kaiju/air1.jpg',
    performance: {
      totalReturn: 167.8,
      winRate: 69.5,
      totalTrades: 178,
      averageReturn: 9.4,
      sharpeRatio: 2.0,
      maxDrawdown: -15.3
    },
    followers: 634,
    isFollowed: false,
    rank: 3,
    shadowCount: 45,
    recentTrades: [],
    badge: 'expert'
  }
];

const MOCK_LIVE_TRADES: TradeExecution[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 30000),
    type: 'buy',
    direction: 'in',
    kaijuId: '1',
    kaijuName: 'Inferno Rex',
    kaijuAvatar: '/kaiju/fire1.jpg',
    assetPair: {
      from: { symbol: 'ETH', name: 'Ethereum', logoUrl: '/tokens/eth.png', chainId: '1' },
      to: { symbol: 'USDC', name: 'USD Coin', logoUrl: '/tokens/usdc.png', chainId: '1' }
    },
    amount: 2500,
    pnl: 125.50,
    pnlPercentage: 5.2,
    status: 'success',
    shadowParticipants: 23,
    txHash: '0x123...abc'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 45000),
    type: 'sell',
    direction: 'out', 
    kaijuId: '2',
    kaijuName: 'Tidal Force',
    kaijuAvatar: '/kaiju/water1.jpg',
    assetPair: {
      from: { symbol: 'BTC', name: 'Bitcoin', logoUrl: '/tokens/btc.png', chainId: '1' },
      to: { symbol: 'ETH', name: 'Ethereum', logoUrl: '/tokens/eth.png', chainId: '1' }
    },
    amount: 5200,
    pnl: -87.30,
    pnlPercentage: -1.7,
    status: 'success',
    shadowParticipants: 18,
    txHash: '0x456...def'
  }
];

export function TradingPostOverlay({ 
  isOpen, 
  onClose, 
  territoryId: _territoryId, 
  territoryName 
}: TradingPostOverlayProps) {
  const [activeTab, setActiveTab] = useState<'trades' | 'leaderboard' | 'following'>('trades');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedTraders, setFollowedTraders] = useState<Set<string>>(new Set(['2']));
  const [copiedTraders, setCopiedTraders] = useState<Set<string>>(new Set());
  const [liveTrades, setLiveTrades] = useState<TradeExecution[]>(MOCK_LIVE_TRADES);
  
  const { portfolio } = useTradingStore();

  // Simulate live trade updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const newTrade: TradeExecution = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        direction: Math.random() > 0.5 ? 'in' : 'out',
        kaijuId: MOCK_TRADERS[Math.floor(Math.random() * MOCK_TRADERS.length)].id,
        kaijuName: MOCK_TRADERS[Math.floor(Math.random() * MOCK_TRADERS.length)].kaijuName,
        kaijuAvatar: MOCK_TRADERS[Math.floor(Math.random() * MOCK_TRADERS.length)].kaijuAvatar,
        assetPair: {
          from: { symbol: 'ETH', name: 'Ethereum', logoUrl: '/tokens/eth.png', chainId: '1' },
          to: { symbol: 'USDC', name: 'USD Coin', logoUrl: '/tokens/usdc.png', chainId: '1' }
        },
        amount: Math.random() * 10000 + 100,
        pnl: (Math.random() - 0.4) * 500,
        pnlPercentage: (Math.random() - 0.4) * 10,
        status: 'success',
        shadowParticipants: Math.floor(Math.random() * 50) + 5,
        txHash: '0x' + Math.random().toString(36).substr(2, 9) + '...' + Math.random().toString(36).substr(2, 3)
      };

      setLiveTrades(prev => [newTrade, ...prev.slice(0, 49)]);
    }, 3000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const filteredTraders = useMemo(() => {
    return MOCK_TRADERS.filter(trader => 
      trader.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trader.kaijuName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const followingTraders = useMemo(() => {
    return MOCK_TRADERS.filter(trader => followedTraders.has(trader.id));
  }, [followedTraders]);

  const handleToggleFollow = (traderId: string) => {
    setFollowedTraders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(traderId)) {
        newSet.delete(traderId);
      } else {
        newSet.add(traderId);
      }
      return newSet;
    });
  };

  const handleToggleCopy = (traderId: string) => {
    setCopiedTraders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(traderId)) {
        newSet.delete(traderId);
      } else {
        newSet.add(traderId);
      }
      return newSet;
    });
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'legendary': return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'master': return <Trophy className="h-4 w-4 text-purple-400" />;
      case 'expert': return <Award className="h-4 w-4 text-blue-400" />;
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-400" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Main Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="relative bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-6xl h-[80vh] mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl">
              <Activity className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trading Post</h2>
              <p className="text-gray-400">{territoryName} Territory</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-6 pb-4 border-b border-gray-700/30">
          {[
            { key: 'trades', label: 'Live Trades', icon: TrendingUp },
            { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { key: 'following', label: `Following (${followingTraders.length})`, icon: Users }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/30"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Live Trades Tab */}
            {activeTab === 'trades' && (
              <motion.div
                key="trades"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Trades Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-white">Territory Activity</h3>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-400">Live</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{liveTrades.length} trades</span>
                      <RefreshCw className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Trades List */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {liveTrades.map((trade, index) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: -20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-stone-800/40 rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Image
                                src={trade.kaijuAvatar}
                                alt={trade.kaijuName}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-gray-600"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{trade.kaijuName}</span>
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    trade.type === 'buy' 
                                      ? "bg-green-500/20 text-green-400" 
                                      : "bg-red-500/20 text-red-400"
                                  )}>
                                    {trade.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <span>{trade.assetPair.from.symbol} → {trade.assetPair.to.symbol}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(trade.timestamp)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={cn(
                                "font-bold text-lg",
                                trade.pnl > 0 ? "text-green-400" : "text-red-400"
                              )}>
                                {trade.pnl > 0 ? '+' : ''}{formatAmount(trade.pnl)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {trade.shadowParticipants} shadows copying
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Search Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search traders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-stone-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Leaderboard List */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-3">
                    {filteredTraders.map((trader) => (
                      <motion.div
                        key={trader.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-800/40 rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                                trader.rank <= 3 
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black"
                                  : "bg-gray-700 text-gray-300"
                              )}>
                                {trader.rank}
                              </span>
                              {getBadgeIcon(trader.badge)}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Image
                                src={trader.kaijuAvatar}
                                alt={trader.kaijuName}
                                width={48}
                                height={48}
                                className="rounded-full border-2 border-gray-600"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{trader.username}</span>
                                  <span className="text-sm text-gray-400">•</span>
                                  <span className="text-sm text-gray-300">{trader.kaijuName}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>{trader.followers} followers</span>
                                  <span>{trader.shadowCount} shadows</span>
                                  <span>{trader.performance.totalTrades} trades</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-400">
                                +{trader.performance.totalReturn.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-400">
                                {trader.performance.winRate.toFixed(1)}% win rate
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleFollow(trader.id)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                  followedTraders.has(trader.id)
                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                                )}
                              >
                                {followedTraders.has(trader.id) ? (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    Following
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4" />
                                    Follow
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleToggleCopy(trader.id)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                  copiedTraders.has(trader.id)
                                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                                )}
                              >
                                {copiedTraders.has(trader.id) ? (
                                  <>
                                    <Target className="h-4 w-4" />
                                    Copying
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <motion.div
                key="following"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Performance Comparison */}
                <div className="p-6 pb-4">
                  <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-lg p-4 border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-white mb-3">Your Performance vs Following</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{portfolio.performance.totalReturn.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">Your Return</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          +{followingTraders.reduce((avg, trader) => avg + trader.performance.totalReturn, 0) / followingTraders.length || 0}%
                        </div>
                        <div className="text-sm text-gray-400">Average Following</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{followingTraders.length}</div>
                        <div className="text-sm text-gray-400">Following</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Following List */}
                <div className="flex-1 overflow-y-auto px-6">
                  {followingTraders.length > 0 ? (
                    <div className="space-y-3">
                      {followingTraders.map((trader) => (
                        <motion.div
                          key={trader.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-stone-800/40 rounded-lg p-4 border border-gray-700/30"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Image
                                src={trader.kaijuAvatar}
                                alt={trader.kaijuName}
                                width={48}
                                height={48}
                                className="rounded-full border-2 border-blue-500/50"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{trader.username}</span>
                                  <span className="text-sm text-gray-400">•</span>
                                  <span className="text-sm text-gray-300">{trader.kaijuName}</span>
                                  {getBadgeIcon(trader.badge)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>Rank #{trader.rank}</span>
                                  <span>{trader.performance.totalTrades} trades</span>
                                  <span>{trader.performance.winRate.toFixed(1)}% win rate</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-400">
                                  +{trader.performance.totalReturn.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-400">
                                  Sharpe: {trader.performance.sharpeRatio.toFixed(1)}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleFollow(trader.id)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-all"
                                >
                                  <EyeOff className="h-4 w-4" />
                                  Unfollow
                                </button>
                                
                                <button
                                  onClick={() => handleToggleCopy(trader.id)}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                    copiedTraders.has(trader.id)
                                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                                  )}
                                >
                                  {copiedTraders.has(trader.id) ? (
                                    <>
                                      <Target className="h-4 w-4" />
                                      Copying
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      Copy Trades
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Traders Followed</h3>
                        <p className="text-gray-500 mb-4">Start following traders from the leaderboard to see their performance here.</p>
                        <button
                          onClick={() => setActiveTab('leaderboard')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Browse Traders
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}