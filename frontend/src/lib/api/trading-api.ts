import { apiRequest } from './client';
import { 
  TradingPolicy, 
  TradeExecution, 
  PaginatedResponse,
  Asset,
  Chain 
} from '@/types/models';

export interface TradingFeedParams {
  page?: number;
  pageSize?: number;
  kaijuIds?: string[];
  followedOnly?: boolean;
  tradeTypes?: ('buy' | 'sell' | 'swap' | 'arbitrage')[];
  minValue?: number;
  chains?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  policies: TradingPolicy[];
  recommendedFor: string[];
}

export interface MarketData {
  asset: Asset;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

export interface GasEstimate {
  chain: string;
  slow: number;
  standard: number;
  fast: number;
  baseFee: number;
  priorityFee: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPL: number;
  totalPLPercentage: number;
  assets: PortfolioAsset[];
  byChain: ChainBreakdown[];
}

export interface PortfolioAsset {
  asset: Asset;
  balance: number;
  value: number;
  price: number;
  change24h: number;
}

export interface ChainBreakdown {
  chain: Chain;
  value: number;
  percentage: number;
}

export interface SwapRoute {
  dex: string;
  path: string[];
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  gas: number;
}

// Trading API functions
export const tradingApi = {
  // Get live trading feed
  getTradingFeed: async (params: TradingFeedParams = {}): Promise<PaginatedResponse<TradeExecution>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.kaijuIds?.length) queryParams.append('kaijuIds', params.kaijuIds.join(','));
    if (params.followedOnly !== undefined) queryParams.append('followedOnly', params.followedOnly.toString());
    if (params.tradeTypes?.length) queryParams.append('tradeTypes', params.tradeTypes.join(','));
    if (params.minValue !== undefined) queryParams.append('minValue', params.minValue.toString());
    if (params.chains?.length) queryParams.append('chains', params.chains.join(','));
    if (params.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) queryParams.append('endDate', params.endDate.toISOString());
    
    return apiRequest.get<PaginatedResponse<TradeExecution>>(`/trading/feed?${queryParams.toString()}`);
  },
  
  // Get trade details
  getTrade: async (tradeId: string): Promise<TradeExecution> => {
    return apiRequest.get<TradeExecution>(`/trading/trades/${tradeId}`);
  },
  
  // Get policy templates
  getPolicyTemplates: async (riskLevel?: number): Promise<PolicyTemplate[]> => {
    const url = riskLevel ? `/trading/policy-templates?riskLevel=${riskLevel}` : '/trading/policy-templates';
    return apiRequest.get<PolicyTemplate[]>(url);
  },
  
  // Create custom policy
  createPolicy: async (policy: Omit<TradingPolicy, 'id'>): Promise<TradingPolicy> => {
    return apiRequest.post<TradingPolicy>('/trading/policies', policy);
  },
  
  // Update policy
  updatePolicy: async (policyId: string, updates: Partial<TradingPolicy>): Promise<TradingPolicy> => {
    return apiRequest.patch<TradingPolicy>(`/trading/policies/${policyId}`, updates);
  },
  
  // Delete policy
  deletePolicy: async (policyId: string): Promise<{ success: boolean }> => {
    return apiRequest.delete(`/trading/policies/${policyId}`);
  },
  
  // Get user's policies
  getMyPolicies: async (): Promise<TradingPolicy[]> => {
    return apiRequest.get<TradingPolicy[]>('/trading/policies/my');
  },
  
  // Simulate trade execution
  simulateTrade: async (params: {
    fromAsset: string;
    toAsset: string;
    amount: number;
    chain: string;
    dex?: string;
    policies?: TradingPolicy[];
  }): Promise<{
    estimatedOutput: number;
    priceImpact: number;
    fees: {
      network: number;
      dex: number;
      total: number;
    };
    route: SwapRoute[];
  }> => {
    return apiRequest.post('/trading/simulate', params);
  },
  
  // Execute trade
  executeTrade: async (params: {
    fromAsset: string;
    toAsset: string;
    amount: number;
    chain: string;
    dex?: string;
    slippage?: number;
  }): Promise<{
    success: boolean;
    txHash: string;
    executedPrice: number;
    receivedAmount: number;
  }> => {
    return apiRequest.post('/trading/execute', params);
  },
  
  // Get market data
  getMarketData: async (assets: string[]): Promise<MarketData[]> => {
    return apiRequest.post<MarketData[]>('/trading/market-data', { assets });
  },
  
  // Get gas estimates
  getGasEstimates: async (chains?: string[]): Promise<GasEstimate[]> => {
    const url = chains?.length 
      ? `/trading/gas-estimates?chains=${chains.join(',')}`
      : '/trading/gas-estimates';
    return apiRequest.get<GasEstimate[]>(url);
  },
  
  // Get portfolio summary
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    return apiRequest.get<PortfolioSummary>('/trading/portfolio');
  },
  
  // Get trading performance metrics
  getTradingPerformance: async (period: '24h' | '7d' | '30d' | '90d' | 'all' = '30d'): Promise<{
    totalTrades: number;
    winRate: number;
    totalPL: number;
    avgTradeSize: number;
    bestTrade: TradeExecution;
    worstTrade: TradeExecution;
    dailyPL: { date: Date; pl: number }[];
  }> => {
    return apiRequest.get(`/trading/performance?period=${period}`);
  },
  
  // Get supported DEXes
  getSupportedDexes: async (chain?: string): Promise<{
    name: string;
    id: string;
    chains: string[];
    logoUrl: string;
  }[]> => {
    const url = chain ? `/trading/dexes?chain=${chain}` : '/trading/dexes';
    return apiRequest.get(url);
  },
  
  // Get supported assets
  getSupportedAssets: async (chain?: string): Promise<Asset[]> => {
    const url = chain ? `/trading/assets?chain=${chain}` : '/trading/assets';
    return apiRequest.get<Asset[]>(url);
  },
  
  // Set price alerts
  setPriceAlert: async (params: {
    asset: string;
    targetPrice: number;
    condition: 'above' | 'below';
  }): Promise<{
    id: string;
    success: boolean;
  }> => {
    return apiRequest.post('/trading/alerts', params);
  },
  
  // Get price alerts
  getPriceAlerts: async (): Promise<{
    id: string;
    asset: Asset;
    targetPrice: number;
    currentPrice: number;
    condition: 'above' | 'below';
    triggered: boolean;
    createdAt: Date;
  }[]> => {
    return apiRequest.get('/trading/alerts');
  },
  
  // Delete price alert
  deletePriceAlert: async (alertId: string): Promise<{ success: boolean }> => {
    return apiRequest.delete(`/trading/alerts/${alertId}`);
  },
  
  // Get trading leaderboard
  getTradingLeaderboard: async (period: '24h' | '7d' | '30d' = '7d'): Promise<{
    rank: number;
    userId: string;
    username: string;
    avatar: string;
    totalPL: number;
    winRate: number;
    totalTrades: number;
  }[]> => {
    return apiRequest.get(`/trading/leaderboard?period=${period}`);
  },
};