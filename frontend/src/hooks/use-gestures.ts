"use client";

import { useRef, useEffect, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: SwipeHandlers,
  threshold = 50
) {
  const touchStart = useRef<TouchPoint | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      // Only register as swipe if it was quick enough (< 500ms)
      if (deltaTime < 500) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
              handlers.onSwipeRight?.();
            } else {
              handlers.onSwipeLeft?.();
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) {
              handlers.onSwipeDown?.();
            } else {
              handlers.onSwipeUp?.();
            }
          }
        }
      }

      touchStart.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers, threshold]);
}

// Pull to refresh hook
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold = 80
) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
        setIsPulling(distance > threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && !isRefreshing) {
        isRefreshing = true;
        setIsPulling(false);
        
        try {
          await onRefresh();
        } finally {
          isRefreshing = false;
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      
      startY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, onRefresh, threshold]);

  return { isPulling, pullDistance };
}

// Unified input hook for touch and mouse
interface PointerHandlers {
  onPointerDown?: (x: number, y: number) => void;
  onPointerMove?: (x: number, y: number) => void;
  onPointerUp?: (x: number, y: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
}

export function useUnifiedInput(
  elementRef: React.RefObject<HTMLElement>,
  handlers: PointerHandlers
) {
  const lastTap = useRef<number>(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const getCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoordinates(e);
      handlers.onPointerDown?.(x, y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoordinates(e);
      handlers.onPointerMove?.(x, y);
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoordinates(e);
      handlers.onPointerUp?.(x, y);

      // Handle tap and double tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTap.current;

      if (timeSinceLastTap < 300) {
        // Double tap
        if (tapTimeout.current) {
          clearTimeout(tapTimeout.current);
        }
        handlers.onDoubleTap?.(x, y);
        lastTap.current = 0;
      } else {
        // Single tap (with delay to check for double tap)
        tapTimeout.current = setTimeout(() => {
          handlers.onTap?.(x, y);
        }, 300);
        lastTap.current = now;
      }
    };

    // Mouse events
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mousemove', handleMove);
    element.addEventListener('mouseup', handleEnd);

    // Touch events
    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchmove', handleMove, { passive: true });
    element.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mousemove', handleMove);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);

      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
    };
  }, [elementRef, handlers, getCoordinates]);
}

// Long press hook
export function useLongPress(
  callback: () => void,
  delay = 500
) {
  const [isPressed, setIsPressed] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsPressed(true);
    timeout.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);

  const clear = useCallback(() => {
    setIsPressed(false);
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: clear,
    isPressed,
  };
}

import { useState } from 'react';