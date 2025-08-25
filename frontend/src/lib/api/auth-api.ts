import { apiRequest, tokenManager } from './client';

export interface AuthUser {
  id: string;
  walletAddress: string;
  serverWalletAddress: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// Auth API functions
export const authApi = {
  // Connect wallet and authenticate
  connectWallet: async (walletAddress: string): Promise<AuthResponse> => {
    const response = await apiRequest.post<{
      status: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/connect-wallet', { walletAddress });
    
    // Save token
    tokenManager.setTokens(response.data.token);
    
    // Transform response to match expected format
    return {
      token: response.data.token,
      user: {
        id: response.data.user.id,
        walletAddress: response.data.user.wallet_address,
        serverWalletAddress: response.data.user.server_wallet_address || '',
        createdAt: response.data.user.created_at
      }
    };
  },
  
  // Get current user profile
  getProfile: async (): Promise<{
    user: AuthUser & { updatedAt: string };
    kaijus: any[];
    shadows: any[];
  }> => {
    const response = await apiRequest.get<{
      status: string;
      data: {
        user: AuthUser & { updatedAt: string };
        kaijus: any[];
        shadows: any[];
      };
    }>('/auth/profile');
    
    return response.data;
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenManager.getAccessToken();
  },
  
  // Logout
  logout: () => {
    tokenManager.clearTokens();
  }
};