// Central export file for the Kaiju No. 69 Design System

// Theme and configuration
export * from "./theme";
export * from "./animations";

// Hooks
export { useTheme } from "@/hooks/use-theme";

// Animated Components
export * from "@/components/ui/animated-components";

// Re-export commonly used types
export type { TerritoryType, ThemeColors, ThemeFonts } from "./theme";