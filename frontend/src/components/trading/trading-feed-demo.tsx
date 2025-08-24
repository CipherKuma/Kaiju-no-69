"use client";

import { useEffect } from "react";
import { TradingFeed } from "./trading-feed";
import { LiveIndicator } from "./trading-feed-animations";
import { useLiveTradingFeed } from "@/hooks/use-realtime";
import { mockTrades, generateRandomTrade } from "@/lib/mock-data/trading-feed";

export function TradingFeedDemo() {
  const { trades } = useLiveTradingFeed();
  
  // Simulate live trades for demo if no real connection
  useEffect(() => {
    if (trades.length === 0) {
      // Simulate incoming trades every few seconds
      const interval = setInterval(() => {
        const event = new CustomEvent('trade:executed', { 
          detail: generateRandomTrade() 
        });
        window.dispatchEvent(event);
      }, 3000 + Math.random() * 5000); // Random interval between 3-8 seconds
      
      // Add initial mock trades
      mockTrades.forEach((trade, index) => {
        setTimeout(() => {
          const event = new CustomEvent('trade:executed', { detail: trade });
          window.dispatchEvent(event);
        }, index * 1000);
      });
      
      return () => clearInterval(interval);
    }
  }, [trades.length]);
  
  return (
    <div className="w-full h-[600px] bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/50">
        <LiveIndicator />
        <h3 className="font-heading font-semibold">Live Trading Activity</h3>
      </div>
      <TradingFeed className="h-[calc(100%-60px)]" />
    </div>
  );
}