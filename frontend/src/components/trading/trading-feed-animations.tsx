"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Trade entry animation variants
export const tradeEntryAnimation = {
  initial: { 
    opacity: 0, 
    x: -50,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    x: 50,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

// Profit celebration animation
export const profitCelebrationAnimation = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: [0, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 300
    }
  }
};

// Loss shake animation
export const lossShakeAnimation = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      type: "spring",
      stiffness: 400
    }
  }
};

// Pulse animation for pending trades
export const pendingPulseAnimation = {
  animate: {
    opacity: [0.7, 1, 0.7],
    scale: [0.98, 1.02, 0.98],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Success burst particles
interface SuccessBurstProps {
  children: ReactNode;
}

export function SuccessBurst({ children }: SuccessBurstProps) {
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-success"
            initial={{ 
              x: 0, 
              y: 0,
              scale: 0
            }}
            animate={{ 
              x: Math.cos(i * 60 * Math.PI / 180) * 40,
              y: Math.sin(i * 60 * Math.PI / 180) * 40,
              scale: [0, 1, 0],
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Trading volume indicator animation
interface VolumeIndicatorProps {
  volume: number;
  maxVolume: number;
  className?: string;
}

export function VolumeIndicator({ volume, maxVolume, className }: VolumeIndicatorProps) {
  const percentage = (volume / maxVolume) * 100;
  
  return (
    <div className={cn("relative h-1 bg-border rounded-full overflow-hidden", className)}>
      <motion.div
        className="absolute left-0 top-0 h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 30
        }}
      />
    </div>
  );
}

// Animated trade type badge
interface TradeTypeBadgeProps {
  type: "buy" | "sell" | "swap" | "arbitrage";
  className?: string;
}

export function TradeTypeBadge({ type, className }: TradeTypeBadgeProps) {
  const colors = {
    buy: "bg-success/10 text-success border-success/20",
    sell: "bg-danger/10 text-danger border-danger/20",
    swap: "bg-primary/10 text-primary border-primary/20",
    arbitrage: "bg-secondary/10 text-secondary border-secondary/20"
  };
  
  const icons = {
    buy: "↗",
    sell: "↘",
    swap: "↔",
    arbitrage: "⟲"
  };
  
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        colors[type],
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25
      }}
    >
      <span className="text-sm">{icons[type]}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </motion.span>
  );
}

// Animated P&L indicator
interface PnLIndicatorProps {
  value: number;
  percentage: number;
  className?: string;
}

export function PnLIndicator({ value, percentage, className }: PnLIndicatorProps) {
  const isPositive = value > 0;
  
  return (
    <motion.div
      className={cn("text-right", className)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      <motion.div
        className={cn(
          "font-semibold tabular-nums",
          isPositive ? "text-success" : "text-danger"
        )}
        animate={isPositive ? {
          textShadow: [
            "0 0 0px rgba(16, 185, 129, 0)",
            "0 0 10px rgba(16, 185, 129, 0.5)",
            "0 0 0px rgba(16, 185, 129, 0)"
          ]
        } : undefined}
        transition={{ duration: 1, repeat: isPositive ? 2 : 0 }}
      >
        {isPositive ? "+" : ""}{value.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </motion.div>
      <div className="text-sm text-muted-foreground tabular-nums">
        {isPositive ? "+" : ""}{percentage.toFixed(2)}%
      </div>
    </motion.div>
  );
}

// Live indicator dot
export function LiveIndicator() {
  return (
    <div className="relative">
      <motion.div
        className="h-2 w-2 rounded-full bg-success"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute inset-0 h-2 w-2 rounded-full bg-success"
        animate={{
          scale: [1, 2],
          opacity: [0.5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </div>
  );
}

// Shadow count animation
interface ShadowCountProps {
  count: number;
  className?: string;
}

export function ShadowCount({ count, className }: ShadowCountProps) {
  return (
    <motion.div
      className={cn("flex items-center gap-1", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="relative">
        {[...Array(Math.min(3, count))].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-4 w-4 rounded-full bg-muted-foreground/20 border border-muted-foreground/30"
            style={{ left: i * 12 }}
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{
              delay: i * 0.1,
              type: "spring",
              stiffness: 300
            }}
          />
        ))}
        {count > 3 && (
          <motion.div
            className="absolute h-4 w-4 rounded-full bg-muted-foreground/30 flex items-center justify-center text-[10px] font-medium"
            style={{ left: 36 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 300
            }}
          >
            +{count - 3}
          </motion.div>
        )}
      </div>
      <span className="text-sm text-muted-foreground ml-12">
        {count} shadow{count !== 1 ? "s" : ""}
      </span>
    </motion.div>
  );
}