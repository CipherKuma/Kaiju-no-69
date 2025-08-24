"use client";

import { theme, getColor, getTerritoryColor, TerritoryType } from "@/lib/theme";
import { useCallback } from "react";

export const useTheme = () => {
  const color = useCallback((colorPath: string) => getColor(colorPath), []);
  
  const territoryColor = useCallback(
    (territory: TerritoryType) => getTerritoryColor(territory),
    []
  );

  const spacing = useCallback((size: keyof typeof theme.spacing) => {
    return theme.spacing[size];
  }, []);

  const fontSize = useCallback((size: keyof typeof theme.fontSize) => {
    return theme.fontSize[size];
  }, []);

  const borderRadius = useCallback((size: keyof typeof theme.borderRadius) => {
    return theme.borderRadius[size];
  }, []);

  const boxShadow = useCallback((type: keyof typeof theme.boxShadow) => {
    return theme.boxShadow[type];
  }, []);

  const font = useCallback((type: keyof typeof theme.fonts) => {
    return theme.fonts[type];
  }, []);

  return {
    theme,
    color,
    territoryColor,
    spacing,
    fontSize,
    borderRadius,
    boxShadow,
    font,
    colors: theme.colors,
    fonts: theme.fonts,
  };
};