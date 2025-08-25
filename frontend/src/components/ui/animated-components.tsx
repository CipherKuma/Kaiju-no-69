"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import {
  floatingAnimation,
  glowAnimation,
  pulseAnimation,
  shakeAnimation,
  fadeInUp,
  fadeIn,
  staggerContainer,
  staggerItem,
  territoryAnimations,
  damageImpact,
  battleEntrance,
  victoryAnimation,
} from "@/lib/animations";

interface AnimatedComponentProps {
  children: ReactNode;
  className?: string;
}

// Floating Kaiju Component
export const FloatingKaiju = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={floatingAnimation}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

// Glowing Element Component
export const GlowingElement = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={glowAnimation}
    initial="initial"
    animate="animate"
    className={`rounded-lg ${className}`}
  >
    {children}
  </motion.div>
);

// Pulsing Element Component
export const PulsingElement = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={pulseAnimation}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

// Shake on Damage Component
interface ShakeOnDamageProps extends AnimatedComponentProps {
  trigger: boolean;
}

export const ShakeOnDamage = ({ children, className = "", trigger }: ShakeOnDamageProps) => (
  <motion.div
    variants={shakeAnimation}
    initial="initial"
    animate={trigger ? "shake" : "initial"}
    className={className}
  >
    {children}
  </motion.div>
);

// Fade In Up Component
export const FadeInUp = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    exit="exit"
    className={className}
  >
    {children}
  </motion.div>
);

// Fade In Component
export const FadeIn = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={fadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger Container Component
export const StaggerContainer = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger Item Component
export const StaggerItem = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div variants={staggerItem} className={className}>
    {children}
  </motion.div>
);

// Territory Animation Component
interface TerritoryAnimationProps extends AnimatedComponentProps {
  territory: "fire" | "water" | "earth" | "air";
}

export const TerritoryAnimation = ({ 
  children, 
  className = "", 
  territory 
}: TerritoryAnimationProps) => (
  <motion.div
    variants={territoryAnimations[territory] as any}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

// Damage Impact Component
interface DamageImpactProps extends AnimatedComponentProps {
  trigger: boolean;
}

export const DamageImpact = ({ children, className = "", trigger }: DamageImpactProps) => (
  <motion.div
    variants={damageImpact}
    initial="initial"
    animate={trigger ? "impact" : "initial"}
    className={className}
  >
    {children}
  </motion.div>
);

// Battle Entrance Component
export const BattleEntrance = ({ children, className = "" }: AnimatedComponentProps) => (
  <motion.div
    variants={battleEntrance}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

// Victory Animation Component
interface VictoryAnimationProps extends AnimatedComponentProps {
  trigger: boolean;
}

export const VictoryAnimation = ({ 
  children, 
  className = "", 
  trigger 
}: VictoryAnimationProps) => (
  <motion.div
    variants={victoryAnimation}
    initial="initial"
    animate={trigger ? "victory" : "initial"}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated Page Transition Wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);