import { apiRequest } from './client';
import { Shadow, TradingPolicy, PaginatedResponse, TradeExecution } from '@/types/models';

export interface CreateShadowParams {
  kaijuId: string;
  duration: 7 | 14 | 30; // days
  policies: TradingPolicy[];
  initialBudget: number;
}

export interface UpdateShadowParams {
  policies?: TradingPolicy[];
  isActive?: boolean;
}

export interface ShadowFilters {
  kaijuId?: string;
  isActive?: boolean;
  expiringWithin?: number; // days
  minPL?: number;
  maxPL?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ShadowEstimate {
  entryCost: number;
  gasFees: number;
  totalCost: number;
  estimatedRarity: string;
  powerLevel: number;
}

export interface EmergencyStopParams {
  shadowIds?: string[]; // If not provided, stops all shadows
  reason?: string;
}

export interface ShadowPerformance {
  totalTrades: number;
  winRate: number;
  totalPL: number;
  avgTradeSize: number;
  riskScore: number;
  dailyReturns: { date: Date; return: number }[];
  topAssets: { asset: string; volume: number; profit: number }[];
}

export interface ShadowMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  externalUrl?: string;
}

export interface ShadowAnalytics {
  totalTrades: number;
  successRate: number;
  avgProfit: number;
  bestTrade: TradeExecution;
  worstTrade: TradeExecution;
  riskScore: number;
}

// Shadow API functions
export const shadowApi = {
  // Create a new shadow (mint NFT)
  createShadow: async (params: CreateShadowParams): Promise<Shadow> => {
    return apiRequest.post<Shadow>('/shadows', params);
  },
  
  // Get shadow creation estimate
  getShadowEstimate: async (params: CreateShadowParams): Promise<ShadowEstimate> => {
    return apiRequest.post<ShadowEstimate>('/shadows/estimate', params);
  },
  
  // Get user's shadows
  getMyShadows: async (filters?: ShadowFilters): Promise<Shadow[]> => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.kaijuId) queryParams.append('kaijuId', filters.kaijuId);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters.expiringWithin) queryParams.append('expiringWithin', filters.expiringWithin.toString());
      if (filters.minPL !== undefined) queryParams.append('minPL', filters.minPL.toString());
      if (filters.maxPL !== undefined) queryParams.append('maxPL', filters.maxPL.toString());
      if (filters.rarity) queryParams.append('rarity', filters.rarity);
    }
    
    return apiRequest.get<Shadow[]>(`/shadows/my?${queryParams.toString()}`);
  },
  
  // Get single shadow details
  getShadow: async (shadowId: string): Promise<Shadow> => {
    return apiRequest.get<Shadow>(`/shadows/${shadowId}`);
  },
  
  // Update shadow (policies, active state)
  updateShadow: async (shadowId: string, params: UpdateShadowParams): Promise<Shadow> => {
    return apiRequest.patch<Shadow>(`/shadows/${shadowId}`, params);
  },
  
  // Destroy shadow (burn NFT)
  destroyShadow: async (shadowId: string): Promise<{ success: boolean; refund?: number }> => {
    return apiRequest.delete(`/shadows/${shadowId}`);
  },
  
  // Get shadow performance metrics
  getShadowPerformance: async (shadowId: string): Promise<ShadowPerformance> => {
    return apiRequest.get<ShadowPerformance>(`/shadows/${shadowId}/performance`);
  },
  
  // Get shadow trading history
  getShadowTrades: async (
    shadowId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedResponse<TradeExecution>> => {
    return apiRequest.get<PaginatedResponse<TradeExecution>>(
      `/shadows/${shadowId}/trades?page=${page}&pageSize=${pageSize}`
    );
  },
  
  // Pause/resume shadow trading
  pauseShadow: async (shadowId: string): Promise<Shadow> => {
    return apiRequest.post<Shadow>(`/shadows/${shadowId}/pause`);
  },
  
  resumeShadow: async (shadowId: string): Promise<Shadow> => {
    return apiRequest.post<Shadow>(`/shadows/${shadowId}/resume`);
  },
  
  // Emergency stop for shadows
  emergencyStop: async (params: EmergencyStopParams = {}): Promise<{ 
    success: boolean; 
    affectedShadows: string[] 
  }> => {
    return apiRequest.post('/shadows/emergency-stop', params);
  },
  
  // Get shadow NFT metadata
  getShadowMetadata: async (shadowId: string): Promise<ShadowMetadata> => {
    return apiRequest.get<ShadowMetadata>(`/shadows/${shadowId}/metadata`);
  },
  
  // Transfer shadow NFT
  transferShadow: async (shadowId: string, toAddress: string): Promise<{ 
    success: boolean; 
    txHash: string 
  }> => {
    return apiRequest.post(`/shadows/${shadowId}/transfer`, { toAddress });
  },
  
  // Get shadow policy recommendations
  getPolicyRecommendations: async (kaijuId: string): Promise<TradingPolicy[]> => {
    return apiRequest.get<TradingPolicy[]>(`/shadows/recommendations/${kaijuId}`);
  },
  
  // Validate shadow policies
  validatePolicies: async (policies: TradingPolicy[]): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> => {
    return apiRequest.post('/shadows/validate-policies', { policies });
  },
  
  // Get expiring shadows notification
  getExpiringShadows: async (days: number = 3): Promise<Shadow[]> => {
    return apiRequest.get<Shadow[]>(`/shadows/expiring?days=${days}`);
  },
  
  // Extend shadow duration
  extendShadow: async (shadowId: string, additionalDays: 7 | 14 | 30): Promise<{
    success: boolean;
    newExpiryDate: Date;
    cost: number;
  }> => {
    return apiRequest.post(`/shadows/${shadowId}/extend`, { additionalDays });
  },
  
  // Get shadow analytics
  getShadowAnalytics: async (shadowId: string): Promise<ShadowAnalytics> => {
    return apiRequest.get<ShadowAnalytics>(`/shadows/${shadowId}/analytics`);
  },
  
  // Batch operations
  batchUpdatePolicies: async (shadowIds: string[], policies: TradingPolicy[]): Promise<{
    success: boolean;
    updated: string[];
    failed: string[];
  }> => {
    return apiRequest.post('/shadows/batch/update-policies', { shadowIds, policies });
  },
  
  batchPause: async (shadowIds: string[]): Promise<{
    success: boolean;
    paused: string[];
    failed: string[];
  }> => {
    return apiRequest.post('/shadows/batch/pause', { shadowIds });
  },
  
  batchResume: async (shadowIds: string[]): Promise<{
    success: boolean;
    resumed: string[];
    failed: string[];
  }> => {
    return apiRequest.post('/shadows/batch/resume', { shadowIds });
  },
};