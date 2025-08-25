import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger, createPersistMiddleware } from './middleware';
import type { User, UserPreferences, Shadow } from './types';

interface UserState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  // Wallet
  walletAddress: string | null;
  walletConnected: boolean;
  walletBalance: bigint;
  chainId: number | null;

  // Preferences
  preferences: UserPreferences;

  // Shadows
  activeShadows: Shadow[];
  selectedShadowId: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  
  // Wallet Actions
  connectWallet: (address: string, chainId: number) => void;
  disconnectWallet: () => void;
  updateBalance: (balance: bigint) => void;
  
  // Preference Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
  
  // Shadow Actions
  addShadow: (shadow: Shadow) => void;
  removeShadow: (shadowId: string) => void;
  updateShadow: (shadowId: string, updates: Partial<Shadow>) => void;
  selectShadow: (shadowId: string | null) => void;
  moveShadow: (shadowId: string, position: Shadow['position']) => void;
  
  // Utility
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  soundEnabled: true,
  notificationsEnabled: true,
  autoSaveEnabled: true,
  language: 'en'
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  walletAddress: null,
  walletConnected: false,
  walletBalance: 0n,
  chainId: null,
  preferences: defaultPreferences,
  activeShadows: [],
  selectedShadowId: null
};

const persistMiddleware = createPersistMiddleware<UserState>('kaiju-user-store', {
  partialize: (state) => ({
    preferences: state.preferences,
    user: state.user
  }),
  version: 1
});

export const useUserStore = create<UserState>()(
  logger(
    devtools(
      persistMiddleware(
        (immer((set) => ({
          ...initialState,

          login: async (username: string, _password: string) => { // password will be used in actual implementation
            set((state) => {
              state.isLoading = true;
              state.authError = null;
            });

            try {
              // TODO: Implement actual authentication API call
              const mockUser: User = {
                id: '1',
                username,
                email: `${username}@example.com`,
                avatar: `/avatars/${username}.png`,
                createdAt: new Date(),
                lastActive: new Date()
              };

              set((state) => {
                state.user = mockUser;
                state.isAuthenticated = true;
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.authError = error instanceof Error ? error.message : 'Login failed';
                state.isLoading = false;
              });
            }
          },

          logout: () => {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.authError = null;
              state.activeShadows = [];
              state.selectedShadowId = null;
            });
          },

          register: async (username: string, email: string, password: string) => { // password will be used in actual implementation
            set((state) => {
              state.isLoading = true;
              state.authError = null;
            });

            try {
              // TODO: Implement actual registration API call
              const mockUser: User = {
                id: Date.now().toString(),
                username,
                email,
                createdAt: new Date(),
                lastActive: new Date()
              };

              set((state) => {
                state.user = mockUser;
                state.isAuthenticated = true;
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.authError = error instanceof Error ? error.message : 'Registration failed';
                state.isLoading = false;
              });
            }
          },

          updateUser: (updates) => {
            set((state) => {
              if (state.user) {
                Object.assign(state.user, updates);
              }
            });
          },

          connectWallet: (address, chainId) => {
            set((state) => {
              state.walletAddress = address;
              state.walletConnected = true;
              state.chainId = chainId;
            });
          },

          disconnectWallet: () => {
            set((state) => {
              state.walletAddress = null;
              state.walletConnected = false;
              state.walletBalance = 0n;
              state.chainId = null;
            });
          },

          updateBalance: (balance) => {
            set((state) => {
              state.walletBalance = balance;
            });
          },

          updatePreferences: (preferences) => {
            set((state) => {
              Object.assign(state.preferences, preferences);
            });
          },

          toggleTheme: () => {
            set((state) => {
              state.preferences.theme = state.preferences.theme === 'light' ? 'dark' : 'light';
            });
          },

          toggleSound: () => {
            set((state) => {
              state.preferences.soundEnabled = !state.preferences.soundEnabled;
            });
          },

          toggleNotifications: () => {
            set((state) => {
              state.preferences.notificationsEnabled = !state.preferences.notificationsEnabled;
            });
          },

          addShadow: (shadow) => {
            set((state) => {
              state.activeShadows.push(shadow);
            });
          },

          removeShadow: (shadowId) => {
            set((state) => {
              state.activeShadows = state.activeShadows.filter(s => s.id !== shadowId);
              if (state.selectedShadowId === shadowId) {
                state.selectedShadowId = null;
              }
            });
          },

          updateShadow: (shadowId, updates) => {
            set((state) => {
              const shadow = state.activeShadows.find(s => s.id === shadowId);
              if (shadow) {
                Object.assign(shadow, updates);
              }
            });
          },

          selectShadow: (shadowId) => {
            set((state) => {
              state.selectedShadowId = shadowId;
            });
          },

          moveShadow: (shadowId, position) => {
            set((state) => {
              const shadow = state.activeShadows.find(s => s.id === shadowId);
              if (shadow) {
                shadow.position = position;
                shadow.status = 'moving';
              }
            });
          },

          reset: () => {
            set(initialState);
          }
        })) as any)
      ),
      { name: 'user-store' }
    ),
    'UserStore'
  )
);

// Selectors for optimized re-renders
export const selectUser = (state: UserState) => state.user;
export const selectIsAuthenticated = (state: UserState) => state.isAuthenticated;
export const selectWalletAddress = (state: UserState) => state.walletAddress;
export const selectWalletConnected = (state: UserState) => state.walletConnected;
export const selectPreferences = (state: UserState) => state.preferences;
export const selectTheme = (state: UserState) => state.preferences.theme;
export const selectActiveShadows = (state: UserState) => state.activeShadows;
export const selectSelectedShadow = (state: UserState) => 
  state.activeShadows.find(s => s.id === state.selectedShadowId) || null;