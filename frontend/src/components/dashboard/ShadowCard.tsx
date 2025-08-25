"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shadow, Kaiju } from "@/types/models";
import { FloatingKaiju } from "@/components/ui/animated-components";
import { theme } from "@/lib/theme";

interface ShadowCardProps {
  shadow: Shadow;
  kaiju: Kaiju;
  recentTrades: any[];
  onQuickAction: (action: string, shadowId: string) => void;
}

export function ShadowCard({ shadow, kaiju, recentTrades, onQuickAction }: ShadowCardProps) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [timeColor, setTimeColor] = useState("text-white");
  const [isUrgent, setIsUrgent] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const expires = new Date(shadow.expiresAt);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Expired");
        setTimeColor("text-red-500");
        setIsUrgent(false);
        return;
      }
      
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      
      // Change color and animate based on time remaining
      if (totalHours <= 1) {
        setTimeColor("text-red-500");
        setIsUrgent(true);
      } else if (totalHours <= 6) {
        setTimeColor("text-orange-500");
        setIsUrgent(false);
      } else if (totalHours <= 24) {
        setTimeColor("text-yellow-500");
        setIsUrgent(false);
      } else {
        setTimeColor("text-white");
        setIsUrgent(false);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [shadow.expiresAt]);
  
  const pnlColor = shadow.currentPL >= 0 ? theme.colors.success.DEFAULT : theme.colors.danger.DEFAULT;
  const pnlSign = shadow.currentPL >= 0 ? "+" : "";
  
  // Generate sparkline data (mock for now - should come from real data)
  const sparklineData = Array.from({ length: 20 }, () => Math.random() * 100);
  const sparklinePath = sparklineData.reduce((path, value, index) => {
    const x = (index / (sparklineData.length - 1)) * 100;
    const y = 50 - (value / 2);
    return `${path} ${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }, '');
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <FloatingKaiju className="relative w-12 h-12">
            <img
              src={kaiju.imageUrl}
              alt={kaiju.name}
              className="w-full h-full rounded-full object-cover border-2 border-primary"
            />
            {shadow.isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </FloatingKaiju>
          <div>
            <h3 className="font-bold text-lg">{kaiju.name}</h3>
            <p className="text-sm text-gray-400">{shadow.rarity} Shadow</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Expires in</p>
          <motion.p 
            className={`font-mono text-sm ${timeColor}`}
            animate={isUrgent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={isUrgent ? { repeat: Infinity, duration: 1 } : { duration: 0 }}
          >
            {timeRemaining}
          </motion.p>
        </div>
      </div>
      
      {/* P&L Ticker */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm text-gray-400">Current P&L</p>
            <p className="text-2xl font-bold" style={{ color: pnlColor }}>
              {pnlSign}${Math.abs(shadow.currentPL).toLocaleString()}
            </p>
          </div>
          <div className="w-24 h-12">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path
                d={sparklinePath}
                fill="none"
                stroke={pnlColor}
                strokeWidth="2"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Recent Activity</p>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {recentTrades.slice(0, 5).map((trade, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-gray-500">
                {trade.type} {trade.assetPair.from.symbol}/{trade.assetPair.to.symbol}
              </span>
              <span className={trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onQuickAction("kingdom", shadow.nftId)}
          className="py-2 px-3 text-sm bg-primary hover:bg-primary-dark rounded-lg transition-colors font-medium"
        >
          Enter Kingdom
        </button>
        <button
          onClick={() => onQuickAction("view", shadow.nftId)}
          className="py-2 px-3 text-sm bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          View Details
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onQuickAction("pause", shadow.nftId)}
          className="py-2 px-3 text-sm bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {shadow.isActive ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => onQuickAction("policy", shadow.nftId)}
          className="py-2 px-3 text-sm bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Policy
        </button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onQuickAction("self-destruct", shadow.nftId)}
          className="py-2 px-3 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
        >
          Self-Destruct
        </motion.button>
      </div>
    </motion.div>
  );
}