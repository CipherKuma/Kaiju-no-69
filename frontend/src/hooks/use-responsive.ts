"use client";

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveState {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isTouchDevice: boolean;
  isOnline: boolean;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1280,
        height: 720,
        deviceType: 'desktop',
        orientation: 'landscape',
        isTouchDevice: false,
        isOnline: true,
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      deviceType: getDeviceType(window.innerWidth),
      orientation: getOrientation(window.innerWidth, window.innerHeight),
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isOnline: navigator.onLine,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setState(prev => ({
        ...prev,
        width,
        height,
        deviceType: getDeviceType(width),
        orientation: getOrientation(width, height),
      }));
    };

    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return state;
}

// Hook for viewport management
export function useViewport() {
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    if (typeof window === 'undefined') return 720;
    return window.innerHeight;
  });

  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return { viewportHeight };
}

// Hook for keyboard shortcuts (desktop)
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const { deviceType } = useResponsive();

  useEffect(() => {
    if (deviceType !== 'desktop') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Build key combination string
      let combo = '';
      if (ctrl) combo += 'ctrl+';
      if (shift) combo += 'shift+';
      if (alt) combo += 'alt+';
      combo += key;

      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, deviceType]);
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

// Predefined media query hooks
export const useIsMobile = () => useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
export const useIsTablet = () => useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`);
export const useIsDesktop = () => useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  return isTouch;
};