// Kaiju No. 69 Theme Configuration
// This file consolidates all design system settings for easy access and modification

export const theme = {
  // Color System
  colors: {
    primary: {
      DEFAULT: "#6366f1", // Electric blue
      rgb: "99 102 241",
      oklch: "0.678 0.182 265.754",
    },
    secondary: {
      DEFAULT: "#8b5cf6", // Purple
      rgb: "139 92 246",
      oklch: "0.678 0.182 292.365",
    },
    success: {
      DEFAULT: "#10b981", // Green
      rgb: "16 185 129",
      oklch: "0.678 0.198 142.495",
    },
    warning: {
      DEFAULT: "#f59e0b", // Orange
      rgb: "245 158 11",
      oklch: "0.795 0.184 75.834",
    },
    danger: {
      DEFAULT: "#ef4444", // Red
      rgb: "239 68 68",
      oklch: "0.628 0.259 25.545",
    },
    dark: {
      DEFAULT: "#1e1b4b", // Deep navy
      rgb: "30 27 75",
      oklch: "0.281 0.085 285.854",
    },
    territories: {
      fire: {
        DEFAULT: "#ef4444", // Fire red
        rgb: "239 68 68",
        oklch: "0.628 0.259 25.545",
      },
      water: {
        DEFAULT: "#6366f1", // Water blue
        rgb: "99 102 241",
        oklch: "0.678 0.182 265.754",
      },
      earth: {
        DEFAULT: "#10b981", // Earth green
        rgb: "16 185 129",
        oklch: "0.678 0.198 142.495",
      },
      air: {
        DEFAULT: "#8b5cf6", // Air purple
        rgb: "139 92 246",
        oklch: "0.678 0.182 292.365",
      },
    },
  },

  // Typography
  fonts: {
    sans: "var(--font-inter)",
    heading: "var(--font-orbitron)",
    pixel: "var(--font-pixel)",
    mono: "var(--font-space-mono)",
  },

  // Font Sizes (following Tailwind's type scale)
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
    "7xl": ["4.5rem", { lineHeight: "1" }],
    "8xl": ["6rem", { lineHeight: "1" }],
    "9xl": ["8rem", { lineHeight: "1" }],
  },

  // Spacing
  spacing: {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },

  // Border Radius
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    DEFAULT: "0.625rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },

  // Shadows
  boxShadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
    // Game-specific shadows
    glow: "0 0 20px rgba(99, 102, 241, 0.5)",
    "glow-success": "0 0 20px rgba(16, 185, 129, 0.5)",
    "glow-warning": "0 0 20px rgba(245, 158, 11, 0.5)",
    "glow-danger": "0 0 20px rgba(239, 68, 68, 0.5)",
  },

  // Transitions
  transition: {
    DEFAULT: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "all 100ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    // Game-specific transitions
    damage: "all 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    victory: "all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Z-Index layers
  zIndex: {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    // Game-specific layers
    gameCanvas: "100",
    gameUI: "200",
    gameOverlay: "300",
    gameModal: "400",
    gameToast: "500",
  },
};

// Utility functions for theme access
export const getColor = (colorPath: string): string => {
  const keys = colorPath.split(".");
  let value: any = theme.colors;
  
  for (const key of keys) {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && key in value) {
      value = value[key];
    } else {
      return "";
    }
    if (!value) return "";
  }
  
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'DEFAULT' in value) return value.DEFAULT;
  return "";
};

export const getTerritoryColor = (territory: keyof typeof theme.colors.territories): string => {
  return theme.colors.territories[territory]?.DEFAULT || "";
};

// CSS Custom Properties generator
export const generateCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (key === "territories") {
      Object.entries(value).forEach(([territoryKey, territoryValue]) => {
        cssVars[`--color-territory-${territoryKey}`] = territoryValue.DEFAULT;
      });
    } else if (typeof value === 'string') {
      cssVars[`--color-${key}`] = value;
    } else if (typeof value === 'object' && value !== null && 'DEFAULT' in value) {
      cssVars[`--color-${key}`] = value.DEFAULT;
    }
  });
  
  // Fonts
  Object.entries(theme.fonts).forEach(([key, value]) => {
    cssVars[`--font-${key}`] = value;
  });
  
  return cssVars;
};

// Export theme types
export type ThemeColors = typeof theme.colors;
export type ThemeFonts = typeof theme.fonts;
export type TerritoryType = keyof typeof theme.colors.territories;