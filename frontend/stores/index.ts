// Re-export all stores
export * from './userStore';
export * from './gameStore';
export * from './tradingStore';
export * from './uiStore';

// Re-export types
export * from './types';

// Store hooks for convenience
import { useUserStore } from './userStore';
import { useGameStore } from './gameStore';
import { useTradingStore } from './tradingStore';
import { useUIStore } from './uiStore';

export const useStores = () => ({
  user: useUserStore(),
  game: useGameStore(),
  trading: useTradingStore(),
  ui: useUIStore()
});

// Global actions that affect multiple stores
export const resetAllStores = () => {
  useUserStore.getState().reset();
  useGameStore.getState().reset();
  useTradingStore.getState().reset();
  useUIStore.getState().reset();
};

// Example of cross-store subscription
export const subscribeToAuthChanges = () => {
  let prevIsAuthenticated = useUserStore.getState().isAuthenticated;
  
  return useUserStore.subscribe((state) => {
    const isAuthenticated = state.isAuthenticated;
    if (prevIsAuthenticated && !isAuthenticated) {
      // Clear sensitive data from other stores when user logs out
      useGameStore.getState().reset();
      useTradingStore.getState().reset();
      useUIStore.getState().clearNotifications();
    }
    prevIsAuthenticated = isAuthenticated;
  });
};