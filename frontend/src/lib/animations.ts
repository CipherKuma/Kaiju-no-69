import { Variants } from "framer-motion";

// Floating animation for Kaiju sprites
export const floatingAnimation: Variants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Glow/pulse effects for active elements
export const glowAnimation: Variants = {
  initial: {
    boxShadow: "0 0 0 0 rgba(99, 102, 241, 0)",
  },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(99, 102, 241, 0)",
      "0 0 20px 10px rgba(99, 102, 241, 0.5)",
      "0 0 0 0 rgba(99, 102, 241, 0)",
    ],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Pulse animation for active elements
export const pulseAnimation: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Shake animation for damage feedback
export const shakeAnimation: Variants = {
  initial: {
    x: 0,
    rotate: 0,
  },
  shake: {
    x: [-10, 10, -10, 10, 0],
    rotate: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Smooth fade transitions
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Stagger children animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// Territory-specific animations
export const territoryAnimations = {
  fire: {
    initial: {
      filter: "brightness(1)",
    },
    animate: {
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  },
  water: {
    initial: {
      scale: 1,
    },
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  },
  earth: {
    initial: {
      rotate: 0,
    },
    animate: {
      rotate: [0, -1, 1, 0],
      transition: {
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  },
  air: {
    initial: {
      opacity: 0.8,
    },
    animate: {
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2.5,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  },
};

// Damage impact animation
export const damageImpact: Variants = {
  initial: {
    scale: 1,
    filter: "brightness(1) saturate(1)",
  },
  impact: {
    scale: [1, 0.95, 1.05, 1],
    filter: [
      "brightness(1) saturate(1)",
      "brightness(2) saturate(0)",
      "brightness(0.5) saturate(1.5)",
      "brightness(1) saturate(1)",
    ],
    transition: {
      duration: 0.6,
      ease: "easeInOut",
    },
  },
};

// Battle entrance animation
export const battleEntrance: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      duration: 0.8,
    },
  },
};

// Victory animation
export const victoryAnimation: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  victory: {
    scale: [1, 1.2, 1.1],
    rotate: [0, 360],
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

// Utility function to create custom spring animations
export const springTransition = (stiffness = 300, damping = 30) => ({
  type: "spring" as const,
  stiffness,
  damping,
});

// Utility function for elastic animations
export const elasticTransition = (duration = 0.5) => ({
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1],
  duration,
});