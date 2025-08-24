"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Users,
  Clock,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useLiveTradingFeed, useSocketConnection } from "@/hooks/use-realtime";
import { useTradingFeed } from "@/hooks/use-trading";
import { TradeExecution } from "@/types/models";
import { cn } from "@/lib/utils";
import { fadeInUp, glowAnimation } from "@/lib/animations";
import Image from "next/image";

interface TradingFeedProps {
  kaijuIds?: string[];
  className?: string;
}

interface TradeFilters {
  tradeTypes: Set<TradeExecution["type"]>;
  minValue: number;
  followedOnly: boolean;
}

const TRADE_TYPE_COLORS = {
  buy: "text-green-400",
  sell: "text-red-400",
  swap: "text-blue-400",
  arbitrage: "text-purple-400"
} as const;

const TRADE_TYPE_BG = {
  buy: "bg-green-500/10 border-green-500/30",
  sell: "bg-red-500/10 border-red-500/30", 
  swap: "bg-blue-500/10 border-blue-500/30",
  arbitrage: "bg-purple-500/10 border-purple-500/30"
} as const;

const TRADE_TYPE_GLOW = {
  buy: "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
  sell: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
  swap: "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
  arbitrage: "shadow-[0_0_10px_rgba(147,51,234,0.3)]"
} as const;

export function TradingFeed({ kaijuIds, className }: TradingFeedProps) {
  const { trades: liveTrades, paused, pauseFeed, resumeFeed } = useLiveTradingFeed(kaijuIds);
  const { data: historicalData, fetchNextPage, hasNextPage } = useTradingFeed({ kaijuIds });
  const { connected } = useSocketConnection();
  
  const [filters, setFilters] = useState<TradeFilters>({
    tradeTypes: new Set(["buy", "sell", "swap", "arbitrage"]),
    minValue: 0,
    followedOnly: false
  });
  
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);
  
  // Combine live and historical trades
  const allTrades = [
    ...liveTrades,
    ...(historicalData?.pages.flatMap(page => page.data) || [])
  ];
  
  // Filter trades
  const filteredTrades = allTrades.filter(trade => {
    if (!filters.tradeTypes.has(trade.type)) return false;
    if (trade.amount < filters.minValue) return false;
    // TODO: Implement followed-only filter when user follows are available
    return true;
  });
  
  const toggleTradeType = (type: TradeExecution["type"]) => {
    const newTypes = new Set(filters.tradeTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setFilters(prev => ({ ...prev, tradeTypes: newTypes }));
  };
  
  const toggleExpanded = (tradeId: string) => {
    const newExpanded = new Set(expandedTrades);
    if (newExpanded.has(tradeId)) {
      newExpanded.delete(tradeId);
    } else {
      newExpanded.add(tradeId);
    }
    setExpandedTrades(newExpanded);
  };
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };
  
  // Load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current || !hasNextPage) return;
      
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchNextPage();
      }
    };
    
    const current = feedRef.current;
    current?.addEventListener("scroll", handleScroll);
    return () => current?.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage]);
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-heading font-bold">Live Trading Feed</h2>
          <div className="flex items-center gap-2">
            <motion.div
              animate={connected ? {
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              } : {}}
              transition={connected ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-green-400" : "bg-red-400"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={paused ? resumeFeed : pauseFeed}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              paused && "text-muted-foreground"
            )}
            title={paused ? "Resume feed" : "Pause feed"}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          
          {/* Filter Button */}
          <button
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Filter trades"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Trade Type Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["buy", "sell", "swap", "arbitrage"] as const).map(type => (
            <button
              key={type}
              onClick={() => toggleTradeType(type)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-all",
                "border",
                filters.tradeTypes.has(type)
                  ? cn(TRADE_TYPE_BG[type], TRADE_TYPE_COLORS[type], "border-current")
                  : "border-border text-muted-foreground hover:border-current"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Min Value Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Min value:</span>
          <input
            type="number"
            value={filters.minValue}
            onChange={(e) => setFilters(prev => ({ ...prev, minValue: Number(e.target.value) }))}
            className="w-24 px-2 py-1 text-sm rounded-md border border-border bg-background"
            placeholder="0"
          />
        </div>
      </div>
      
      {/* Trading Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredTrades.map((trade, index) => {
            const isNew = index < liveTrades.length && Date.now() - new Date(trade.timestamp).getTime() < 5000;
            return (
              <motion.div
                key={trade.id}
                layout
                initial={{ 
                  opacity: 0, 
                  x: -50, 
                  scale: 0.95,
                  rotateX: -15 
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  rotateX: 0 
                }}
                exit={{ 
                  opacity: 0, 
                  x: 50, 
                  scale: 0.95,
                  rotateX: 15 
                }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeOut",
                  delay: isNew ? index * 0.1 : 0 
                }}
                className={cn(
                  "border-b border-border relative overflow-hidden",
                  trade.status === "pending" && "opacity-70",
                  isNew && cn(
                    "animate-pulse",
                    TRADE_TYPE_GLOW[trade.type]
                  )
                )}
                whileHover={{ 
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
              >
                {isNew && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10"
                  />
                )}
                <TradeCard
                  trade={trade}
                  isExpanded={expandedTrades.has(trade.id)}
                  onToggleExpand={() => toggleExpanded(trade.id)}
                  formatTimestamp={formatTimestamp}
                  formatAmount={formatAmount}
                  isNew={isNew}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredTrades.length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No trades match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TradeCardProps {
  trade: TradeExecution;
  isExpanded: boolean;
  onToggleExpand: () => void;
  formatTimestamp: (date: Date) => string;
  formatAmount: (amount: number) => string;
  isNew?: boolean;
}

function TradeCard({ 
  trade, 
  isExpanded, 
  onToggleExpand,
  formatTimestamp,
  formatAmount,
  isNew = false
}: TradeCardProps) {
  const isProfitable = trade.pnl > 0;
  
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Kaiju Avatar */}
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0">
          <Image
            src={trade.kaijuAvatar}
            alt={trade.kaijuName}
            width={48}
            height={48}
            className="object-cover"
          />
          {trade.status === "pending" && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Trade Details */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{trade.kaijuName}</h3>
              <div className="flex items-center gap-2 text-sm">
                <motion.span 
                  className={cn(
                    "px-3 py-1 rounded-full font-semibold border text-xs uppercase tracking-wide",
                    "backdrop-blur-sm transition-all duration-200",
                    TRADE_TYPE_BG[trade.type],
                    TRADE_TYPE_COLORS[trade.type],
                    isNew && "animate-pulse"
                  )}
                  initial={isNew ? { scale: 1.2 } : { scale: 1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {trade.type}
                </motion.span>
                <span className="text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTimestamp(trade.timestamp)}
                </span>
              </div>
            </div>
            
            {/* P&L */}
            <div className="text-right">
              <motion.div 
                className={cn(
                  "font-bold text-lg",
                  isProfitable ? "text-green-400" : "text-red-400"
                )}
                initial={isNew ? { scale: 1.2, filter: "brightness(1.5)" } : { scale: 1 }}
                animate={{ scale: 1, filter: "brightness(1)" }}
                transition={{ duration: 0.4 }}
              >
                {isProfitable ? "+" : ""}{formatAmount(Math.abs(trade.pnl))}
              </motion.div>
              <div className={cn(
                "text-sm font-medium",
                isProfitable ? "text-green-300/80" : "text-red-300/80"
              )}>
                {isProfitable ? "+" : ""}{trade.pnlPercentage.toFixed(2)}%
              </div>
            </div>
          </div>
          
          {/* Asset Pair */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Image
                src={trade.assetPair.from.logoUrl}
                alt={trade.assetPair.from.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="font-medium">{trade.assetPair.from.symbol}</span>
            </div>
            
            <motion.div
              initial={isNew ? { rotate: -90, scale: 1.2 } : { rotate: 0, scale: 1 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "p-1 rounded-full border",
                TRADE_TYPE_BG[trade.type]
              )}
            >
              {trade.direction === "out" ? (
                <ArrowUpRight className={cn("h-4 w-4", TRADE_TYPE_COLORS[trade.type])} />
              ) : (
                <ArrowDownRight className={cn("h-4 w-4", TRADE_TYPE_COLORS[trade.type])} />
              )}
            </motion.div>
            
            <div className="flex items-center gap-1">
              <Image
                src={trade.assetPair.to.logoUrl}
                alt={trade.assetPair.to.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="font-medium">{trade.assetPair.to.symbol}</span>
            </div>
            
            <span className="text-muted-foreground ml-2">
              {formatAmount(trade.amount)}
            </span>
          </div>
          
          {/* Shadow Participants */}
          <div className="flex items-center justify-between mt-2">
            <motion.div 
              className="flex items-center gap-2 text-sm"
              initial={isNew ? { scale: 1.1 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full",
                "bg-muted/50 border border-border"
              )}>
                <Users className="h-3 w-3 text-blue-400" />
                <span className="font-medium text-foreground">{trade.shadowParticipants}</span>
                <span className="text-muted-foreground text-xs">shadows</span>
              </div>
            </motion.div>
            
            <button
              onClick={onToggleExpand}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Details
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-180"
              )} />
            </button>
          </div>
          
          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <a
                      href={`https://etherscan.io/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {trade.txHash.slice(0, 6)}...{trade.txHash.slice(-4)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Chain:</span>
                    <span>{trade.assetPair.from.chainId}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn(
                      "font-medium",
                      trade.status === "success" && "text-success",
                      trade.status === "failed" && "text-danger",
                      trade.status === "pending" && "text-warning"
                    )}>
                      {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Success/Failure Animation Overlay */}
      {isNew && trade.status === "success" && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute inset-0 pointer-events-none z-20"
        >
          {isProfitable ? (
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{
                  scale: [0, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 0.8 }}
                className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center"
              >
                <TrendingUp className="h-4 w-4 text-white" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 2, 3],
                  opacity: [0.8, 0.4, 0]
                }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 rounded-full bg-green-500/20"
              />
            </div>
          ) : (
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{
                  scale: [0, 1.2, 1],
                  rotate: [0, -180, -360]
                }}
                transition={{ duration: 0.8 }}
                className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center"
              >
                <TrendingDown className="h-4 w-4 text-white" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 2, 3],
                  opacity: [0.8, 0.4, 0]
                }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 rounded-full bg-red-500/20"
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}