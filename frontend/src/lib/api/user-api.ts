import { apiRequest, tokenManager } from './client';
import { User, VincentAgent } from '@/types/models';

export interface UserProfile {
  address: string;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: Date;
  lastActive: Date;
}

export interface UserStats {
  totalShadows: number;
  activeShadows: number;
  totalPL: number;
  winRate: number;
  totalTrades: number;
  favoriteKaiju: string[];
  joinedDate: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ja' | 'es' | 'fr' | 'zh' | 'ko';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  trading: TradingPreferences;
  display: DisplayPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  tradingAlerts: boolean;
  kaijuUpdates: boolean;
  shadowExpiry: boolean;
  performanceReports: boolean;
  systemUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showPortfolio: boolean;
  showTradingHistory: boolean;
  allowDirectMessages: boolean;
}

export interface TradingPreferences {
  defaultSlippage: number;
  defaultGasStrategy: 'slow' | 'standard' | 'fast';
  confirmBeforeTrade: boolean;
  autoCompound: boolean;
}

export interface DisplayPreferences {
  currency: 'USD' | 'EUR' | 'JPY' | 'GBP' | 'CNY' | 'KRW';
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  compactView: boolean;
}

export interface CreateUserParams {
  address: string;
  username?: string;
  email?: string;
  referralCode?: string;
}

export interface UpdateProfileParams {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
}

// User API functions
export const userApi = {
  // Authentication
  login: async (address: string, signature: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> => {
    const response = await apiRequest.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { address, signature });
    
    // Store tokens
    tokenManager.setTokens(response.accessToken, response.refreshToken);
    
    return response;
  },
  
  logout: async (): Promise<{ success: boolean }> => {
    try {
      const response = await apiRequest.post<{ success: boolean }>('/auth/logout');
      tokenManager.clearTokens();
      return response;
    } catch {
      tokenManager.clearTokens();
      return { success: true };
    }
  },
  
  // User management
  createUser: async (params: CreateUserParams): Promise<User> => {
    return apiRequest.post<User>('/users', params);
  },
  
  getCurrentUser: async (): Promise<UserProfile> => {
    return apiRequest.get<UserProfile>('/users/me');
  },
  
  updateProfile: async (params: UpdateProfileParams): Promise<UserProfile> => {
    return apiRequest.patch<UserProfile>('/users/me', params);
  },
  
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiRequest.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Preferences
  getPreferences: async (): Promise<UserPreferences> => {
    return apiRequest.get<UserPreferences>('/users/me/preferences');
  },
  
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    return apiRequest.patch<UserPreferences>('/users/me/preferences', preferences);
  },
  
  // Vincent Agent
  getVincentAgent: async (): Promise<VincentAgent | null> => {
    return apiRequest.get<VincentAgent | null>('/users/me/vincent-agent');
  },
  
  createVincentAgent: async (params: {
    personality: 'aggressive' | 'conservative' | 'balanced';
    tradingBehavior: {
      preferredDexes: string[];
      maxSlippage: number;
      gasStrategy: 'slow' | 'standard' | 'fast';
      rebalanceFrequency: 'hourly' | 'daily' | 'weekly';
    };
  }): Promise<VincentAgent> => {
    return apiRequest.post<VincentAgent>('/users/me/vincent-agent', params);
  },
  
  updateVincentAgent: async (updates: Partial<VincentAgent>): Promise<VincentAgent> => {
    return apiRequest.patch<VincentAgent>('/users/me/vincent-agent', updates);
  },
  
  toggleVincentAgent: async (isActive: boolean): Promise<VincentAgent> => {
    return apiRequest.patch<VincentAgent>('/users/me/vincent-agent/toggle', { isActive });
  },
  
  // Stats and activity
  getUserStats: async (): Promise<UserStats> => {
    return apiRequest.get<UserStats>('/users/me/stats');
  },
  
  getUserActivity: async (page: number = 1, pageSize: number = 20): Promise<{
    activities: UserActivity[];
    total: number;
    hasMore: boolean;
  }> => {
    return apiRequest.get(`/users/me/activity?page=${page}&pageSize=${pageSize}`);
  },
  
  // Wallet management
  connectWallet: async (address: string, chainId: string): Promise<{ success: boolean }> => {
    return apiRequest.post('/users/me/wallets', { address, chainId });
  },
  
  disconnectWallet: async (address: string): Promise<{ success: boolean }> => {
    return apiRequest.delete(`/users/me/wallets/${address}`);
  },
  
  getConnectedWallets: async (): Promise<{
    address: string;
    chainId: string;
    balance: number;
    isPrimary: boolean;
  }[]> => {
    return apiRequest.get('/users/me/wallets');
  },
  
  // Social features
  searchUsers: async (query: string): Promise<UserProfile[]> => {
    return apiRequest.get<UserProfile[]>(`/users/search?q=${encodeURIComponent(query)}`);
  },
  
  getUserByAddress: async (address: string): Promise<UserProfile> => {
    return apiRequest.get<UserProfile>(`/users/${address}`);
  },
  
  // Referrals
  getReferralCode: async (): Promise<{ code: string; uses: number; rewards: number }> => {
    return apiRequest.get('/users/me/referral');
  },
  
  getReferrals: async (): Promise<{
    referred: UserProfile[];
    totalRewards: number;
  }> => {
    return apiRequest.get('/users/me/referrals');
  },
  
  // Notifications
  getNotificationSettings: async (): Promise<NotificationPreferences> => {
    return apiRequest.get<NotificationPreferences>('/users/me/notifications');
  },
  
  updateNotificationSettings: async (
    settings: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    return apiRequest.patch<NotificationPreferences>('/users/me/notifications', settings);
  },
  
  // Export data
  exportUserData: async (): Promise<{ downloadUrl: string }> => {
    return apiRequest.post('/users/me/export');
  },
  
  // Delete account
  deleteAccount: async (confirmation: string): Promise<{ success: boolean }> => {
    return apiRequest.delete('/users/me', { data: { confirmation } });
  },
};

// Types
export interface UserActivity {
  id: string;
  type: 'trade' | 'shadow_created' | 'shadow_expired' | 'kaiju_followed' | 'achievement';
  description: string;
  metadata: any;
  timestamp: Date;
}