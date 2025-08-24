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
      data: AuthResponse;
    }>('/auth/connect', { walletAddress });
    
    // Save token
    tokenManager.setTokens(response.data.token);
    
    return response.data;
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