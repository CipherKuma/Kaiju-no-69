import { apiRequest } from './client';
import { Kaiju, PaginatedResponse, PerformanceData } from '@/types/models';

export interface KaijuFilters {
  profitability?: {
    min?: number;
    max?: number;
  };
  popularity?: {
    min?: number;
    max?: number;
  };
  isOnline?: boolean;
  tradingStyle?: 'aggressive' | 'conservative' | 'balanced' | 'arbitrage';
  biome?: 'fire' | 'water' | 'earth' | 'air';
  search?: string;
}

export interface KaijuSortOptions {
  field: 'performance' | 'popularity' | 'name' | 'entryFee' | 'profitShare';
  order: 'asc' | 'desc';
}

export interface KaijuListParams {
  page?: number;
  pageSize?: number;
  filters?: KaijuFilters;
  sort?: KaijuSortOptions;
}

export interface KaijuPerformanceParams {
  kaijuId: string;
  period?: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface KaijuComparisonParams {
  kaijuIds: string[];
  metrics?: string[];
  period?: '24h' | '7d' | '30d' | '90d';
}

// Backend Kaiju type
interface BackendKaiju {
  id: string;
  nft_collection_address: string;
  name: string;
  bio: string;
  owner_id: string;
  algorithm_url: string;
  kaiju_image_url: string;
  shadow_image_url: string;
  is_active: boolean;
  avg_pnl_percentage: number;
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    wallet_address: string;
  };
  shadow_count?: [{
    count: number;
  }];
}

// Transform backend Kaiju to frontend Kaiju
const transformKaiju = (backendKaiju: BackendKaiju): Kaiju => {
  const winRate = backendKaiju.wins + backendKaiju.losses > 0 
    ? (backendKaiju.wins / (backendKaiju.wins + backendKaiju.losses)) * 100 
    : 0;

  const totalTrades = backendKaiju.wins + backendKaiju.losses;
  const shadowCount = backendKaiju.shadow_count?.[0]?.count || 0;

  // Determine trading style based on PnL and win rate
  let tradingStyle: 'aggressive' | 'conservative' | 'balanced' | 'arbitrage' = 'balanced';
  if (backendKaiju.avg_pnl_percentage > 50) {
    tradingStyle = 'aggressive';
  } else if (winRate > 70 && backendKaiju.avg_pnl_percentage > 20) {
    tradingStyle = 'arbitrage';
  } else if (winRate > 60 && backendKaiju.avg_pnl_percentage < 20) {
    tradingStyle = 'conservative';
  }

  // Determine territory/biome based on some logic (you can customize this)
  const biomes = ['fire-realm-1', 'water-realm-1', 'earth-realm-1', 'air-realm-1'];
  const territory = biomes[parseInt(backendKaiju.id.substring(0, 8), 16) % biomes.length];

  return {
    id: backendKaiju.id,
    name: backendKaiju.name,
    imageUrl: backendKaiju.kaiju_image_url,
    performance: {
      last30Days: backendKaiju.avg_pnl_percentage,
      totalReturn: backendKaiju.avg_pnl_percentage * 3, // Estimated total return
      winRate: winRate,
      totalTrades: totalTrades,
      sharpeRatio: winRate > 60 ? 2.5 : 1.5, // Simplified calculation
      maxDrawdown: -15, // Default value, should be calculated from real data
      dailyReturns: [] // Should be fetched from performance endpoint
    },
    territory: territory,
    isOnline: backendKaiju.is_active,
    shadows: [], // Should be fetched separately if needed
    traderTitle: getTradingTitle(winRate, backendKaiju.avg_pnl_percentage),
    entryFee: 0.5, // Default value, should be stored in DB
    profitShare: 20, // Default value, should be stored in DB
    description: backendKaiju.bio || 'Expert trading algorithm',
    tradingStyle: tradingStyle,
    popularity: shadowCount,
    stats: {
      winRate: winRate,
      totalTrades: totalTrades,
      avgProfit: backendKaiju.avg_pnl_percentage,
      riskLevel: getRiskLevel(backendKaiju.avg_pnl_percentage, winRate)
    }
  };
};

// Helper function to determine trading title
const getTradingTitle = (winRate: number, avgPnL: number): string => {
  if (winRate > 70 && avgPnL > 30) return 'Market Wizard';
  if (winRate > 60 && avgPnL > 20) return 'DeFi Master';
  if (winRate > 50) return 'Steady Trader';
  if (avgPnL > 50) return 'High-Risk Degen';
  return 'Emerging Trader';
};

// Helper function to calculate risk level
const getRiskLevel = (avgPnL: number, winRate: number): number => {
  if (avgPnL > 50) return 5; // Very high risk
  if (avgPnL > 30 && winRate < 60) return 4; // High risk
  if (avgPnL > 20 && winRate > 60) return 2; // Low risk
  if (winRate > 70) return 1; // Very low risk
  return 3; // Medium risk
};

// Kaiju API functions
export const kaijuApi = {
  // Get paginated list of Kaiju with filters
  getKaijuList: async (params: KaijuListParams = {}): Promise<PaginatedResponse<Kaiju>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('limit', params.pageSize.toString());
    
    // Add sorting
    if (params.sort) {
      const sortBy = params.sort.field === 'performance' ? 'avg_pnl_percentage' : params.sort.field;
      queryParams.append('sortBy', sortBy);
    }
    
    const response = await apiRequest.get<{
      status: string;
      data: {
        kaijus: BackendKaiju[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>(`/kaijus?${queryParams.toString()}`);
    
    // Transform backend response to frontend format
    const transformedKaijus = response.data.kaijus.map(transformKaiju);
    
    // Apply frontend filters
    let filteredKaijus = transformedKaijus;
    
    if (params.filters) {
      const { filters } = params;
      
      if (filters.profitability?.min !== undefined || filters.profitability?.max !== undefined) {
        filteredKaijus = filteredKaijus.filter(k => {
          const profit = k.performance.last30Days;
          if (filters.profitability?.min !== undefined && profit < filters.profitability.min) return false;
          if (filters.profitability?.max !== undefined && profit > filters.profitability.max) return false;
          return true;
        });
      }
      
      if (filters.popularity?.min !== undefined || filters.popularity?.max !== undefined) {
        filteredKaijus = filteredKaijus.filter(k => {
          const popularity = k.popularity || 0;
          if (filters.popularity?.min !== undefined && popularity < filters.popularity.min) return false;
          if (filters.popularity?.max !== undefined && popularity > filters.popularity.max) return false;
          return true;
        });
      }
      
      if (filters.isOnline !== undefined) {
        filteredKaijus = filteredKaijus.filter(k => k.isOnline === filters.isOnline);
      }
      
      if (filters.tradingStyle) {
        filteredKaijus = filteredKaijus.filter(k => k.tradingStyle === filters.tradingStyle);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredKaijus = filteredKaijus.filter(k => 
          k.name.toLowerCase().includes(searchLower) ||
          k.description?.toLowerCase().includes(searchLower)
        );
      }
    }
    
    return {
      data: filteredKaijus,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      pageSize: response.data.pagination.limit,
      hasMore: response.data.pagination.page < response.data.pagination.totalPages
    };
  },
  
  // Get single Kaiju details
  getKaiju: async (kaijuId: string): Promise<Kaiju> => {
    const response = await apiRequest.get<{
      status: string;
      data: BackendKaiju & {
        stats: {
          totalShadows: number;
          totalVolume: number;
          winRate: string;
        };
      };
    }>(`/kaijus/${kaijuId}`);
    
    return transformKaiju(response.data);
  },
  
  // Get Kaiju performance data
  getKaijuPerformance: async (params: KaijuPerformanceParams): Promise<PerformanceData> => {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    
    const response = await apiRequest.get<{
      status: string;
      data: {
        period: string;
        totalTrades: number;
        closedTrades: number;
        profitableTrades: number;
        winRate: string;
        totalPnL: number;
        trades: Array<{
          id: string;
          trade_type: string;
          status: string;
          created_at: string;
          closed_at: string | null;
          totalPnL: number;
        }>;
      };
    }>(`/kaijus/${params.kaijuId}/performance?${queryParams.toString()}`);
    
    const data = response.data;
    
    // Convert trades to daily returns
    const dailyReturns = data.trades
      .filter(t => t.status === 'closed')
      .map(t => ({
        date: new Date(t.closed_at || t.created_at),
        return: t.totalPnL,
        volume: Math.abs(t.totalPnL) * 1000 // Estimated volume
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return {
      last30Days: data.totalPnL,
      totalReturn: data.totalPnL * 3, // Estimated
      winRate: parseFloat(data.winRate),
      totalTrades: data.totalTrades,
      sharpeRatio: parseFloat(data.winRate) > 60 ? 2.5 : 1.5,
      maxDrawdown: -15, // Should be calculated from real data
      dailyReturns
    };
  },
  
  // Get top performing Kaiju
  getTopKaiju: async (limit: number = 10): Promise<Kaiju[]> => {
    const response = await apiRequest.get<{
      status: string;
      data: {
        kaijus: BackendKaiju[];
      };
    }>(`/kaijus?sortBy=avg_pnl_percentage&limit=${limit}`);
    
    return response.data.kaijus.map(transformKaiju);
  },
  
  // Get trending Kaiju (based on shadow count growth)
  getTrendingKaiju: async (limit: number = 10): Promise<Kaiju[]> => {
    // For now, return kaijus sorted by shadow count
    const response = await apiRequest.get<{
      status: string;
      data: {
        kaijus: BackendKaiju[];
      };
    }>(`/kaijus?limit=${limit}`);
    
    return response.data.kaijus
      .map(transformKaiju)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  },
  
  // Search Kaiju by name or description
  searchKaiju: async (query: string): Promise<Kaiju[]> => {
    const response = await apiRequest.get<{
      status: string;
      data: {
        kaijus: BackendKaiju[];
      };
    }>('/kaijus');
    
    const searchLower = query.toLowerCase();
    return response.data.kaijus
      .map(transformKaiju)
      .filter(k => 
        k.name.toLowerCase().includes(searchLower) ||
        k.description?.toLowerCase().includes(searchLower)
      );
  },
  
  // Get Kaiju by territory biome
  getKaijuByBiome: async (biome: 'fire' | 'water' | 'earth' | 'air'): Promise<Kaiju[]> => {
    const response = await apiRequest.get<{
      status: string;
      data: {
        kaijus: BackendKaiju[];
      };
    }>('/kaijus');
    
    return response.data.kaijus
      .map(transformKaiju)
      .filter(k => k.territory.includes(biome));
  },
  
  // Compare multiple Kaiju
  compareKaiju: async (params: KaijuComparisonParams): Promise<any> => {
    // Fetch multiple kaijus and compare
    const kaijus = await Promise.all(
      params.kaijuIds.map(id => kaijuApi.getKaiju(id))
    );
    
    return {
      kaijus,
      comparison: {
        avgPnL: kaijus.map(k => ({ id: k.id, value: k.performance.last30Days })),
        winRate: kaijus.map(k => ({ id: k.id, value: k.performance.winRate })),
        totalTrades: kaijus.map(k => ({ id: k.id, value: k.performance.totalTrades })),
        popularity: kaijus.map(k => ({ id: k.id, value: k.popularity || 0 }))
      }
    };
  },
  
  // Get Kaiju's active shadows
  getKaijuShadows: async (_kaijuId: string): Promise<any[]> => {
    // This would need a new endpoint in the backend
    return [];
  },
  
  // Get Kaiju's trading history
  getKaijuTradingHistory: async (
    kaijuId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedResponse<any>> => {
    const response = await apiRequest.get<{
      status: string;
      data: any;
    }>(`/kaijus/${kaijuId}/performance`);
    
    // Transform the trades data
    const trades = response.data.trades || [];
    
    return {
      data: trades,
      total: trades.length,
      page: page,
      pageSize: pageSize,
      hasMore: false
    };
  },
  
  // Create a new Kaiju (after NFT collection is created)
  createKaiju: async (data: {
    nftCollectionAddress: string;
    name: string;
    bio?: string;
    algorithmUrl: string;
    kaijuImageUrl: string;
    shadowImageUrl: string;
  }): Promise<Kaiju> => {
    const response = await apiRequest.post<{
      status: string;
      data: BackendKaiju;
    }>('/kaijus', {
      // Map frontend fields to backend fields
      nftCollectionAddress: data.nftCollectionAddress,
      name: data.name,
      bio: data.bio,
      algorithmUrl: data.algorithmUrl,
      kaijuImageUrl: data.kaijuImageUrl,
      shadowImageUrl: data.shadowImageUrl
    });
    
    return transformKaiju(response.data);
  },

  // Other methods can be implemented as needed...
  followKaiju: async (_kaijuId: string): Promise<{ success: boolean }> => {
    return { success: true };
  },
  
  unfollowKaiju: async (_kaijuId: string): Promise<{ success: boolean }> => {
    return { success: true };
  },
  
  getFollowedKaiju: async (): Promise<Kaiju[]> => {
    return [];
  },
  
  rateKaiju: async (_kaijuId: string, _rating: number): Promise<{ success: boolean }> => {
    return { success: true };
  },
  
  reportKaiju: async (_kaijuId: string, _reason: string): Promise<{ success: boolean }> => {
    return { success: true };
  },
};