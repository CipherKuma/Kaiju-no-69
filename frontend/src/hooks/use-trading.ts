import { useQuery, useMutation, useQueryClient, UseQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { tradingApi } from '@/lib/api/trading-api';
import { 
  TradeExecution, 
  TradingPolicy, 
  PaginatedResponse,
  Asset 
} from '@/types/models';
import { 
  TradingFeedParams,
  PolicyTemplate,
  MarketData,
  GasEstimate,
  PortfolioSummary 
} from '@/lib/api/trading-api';

// Query keys
const tradingKeys = {
  all: ['trading'] as const,
  feed: (params: TradingFeedParams) => [...tradingKeys.all, 'feed', params] as const,
  trade: (id: string) => [...tradingKeys.all, 'trade', id] as const,
  policies: () => [...tradingKeys.all, 'policies'] as const,
  myPolicies: () => [...tradingKeys.policies(), 'my'] as const,
  templates: (riskLevel?: number) => [...tradingKeys.policies(), 'templates', riskLevel] as const,
  portfolio: () => [...tradingKeys.all, 'portfolio'] as const,
  performance: (period: string) => [...tradingKeys.all, 'performance', period] as const,
  marketData: (assets: string[]) => [...tradingKeys.all, 'market', assets] as const,
  gasEstimates: (chains?: string[]) => [...tradingKeys.all, 'gas', chains] as const,
  dexes: (chain?: string) => [...tradingKeys.all, 'dexes', chain] as const,
  assets: (chain?: string) => [...tradingKeys.all, 'assets', chain] as const,
  alerts: () => [...tradingKeys.all, 'alerts'] as const,
  leaderboard: (period: string) => [...tradingKeys.all, 'leaderboard', period] as const,
};

// Trading feed with pagination
export const useTradingFeed = (
  params: TradingFeedParams = {},
  options?: UseQueryOptions<PaginatedResponse<TradeExecution>>
) => {
  return useInfiniteQuery({
    queryKey: tradingKeys.feed(params),
    queryFn: ({ pageParam = 1 }) => 
      tradingApi.getTradingFeed({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    ...options,
  });
};

// Single trade details
export const useTrade = (
  tradeId: string,
  options?: UseQueryOptions<TradeExecution>
) => {
  return useQuery({
    queryKey: tradingKeys.trade(tradeId),
    queryFn: () => tradingApi.getTrade(tradeId),
    enabled: !!tradeId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// Policy templates
export const usePolicyTemplates = (
  riskLevel?: number,
  options?: UseQueryOptions<PolicyTemplate[]>
) => {
  return useQuery({
    queryKey: tradingKeys.templates(riskLevel),
    queryFn: () => tradingApi.getPolicyTemplates(riskLevel),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// User's policies
export const useMyPolicies = (
  options?: UseQueryOptions<TradingPolicy[]>
) => {
  return useQuery({
    queryKey: tradingKeys.myPolicies(),
    queryFn: () => tradingApi.getMyPolicies(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// Portfolio summary
export const usePortfolioSummary = (
  options?: UseQueryOptions<PortfolioSummary>
) => {
  return useQuery({
    queryKey: tradingKeys.portfolio(),
    queryFn: () => tradingApi.getPortfolioSummary(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
};

// Trading performance
export const useTradingPerformance = (
  period: '24h' | '7d' | '30d' | '90d' | 'all' = '30d',
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: tradingKeys.performance(period),
    queryFn: () => tradingApi.getTradingPerformance(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Market data
export const useMarketData = (
  assets: string[],
  options?: UseQueryOptions<MarketData[]>
) => {
  return useQuery({
    queryKey: tradingKeys.marketData(assets),
    queryFn: () => tradingApi.getMarketData(assets),
    enabled: assets.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
};

// Gas estimates
export const useGasEstimates = (
  chains?: string[],
  options?: UseQueryOptions<GasEstimate[]>
) => {
  return useQuery({
    queryKey: tradingKeys.gasEstimates(chains),
    queryFn: () => tradingApi.getGasEstimates(chains),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
};

// Supported DEXes
export const useSupportedDexes = (
  chain?: string,
  options?: UseQueryOptions<any[]>
) => {
  return useQuery({
    queryKey: tradingKeys.dexes(chain),
    queryFn: () => tradingApi.getSupportedDexes(chain),
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// Supported assets
export const useSupportedAssets = (
  chain?: string,
  options?: UseQueryOptions<Asset[]>
) => {
  return useQuery({
    queryKey: tradingKeys.assets(chain),
    queryFn: () => tradingApi.getSupportedAssets(chain),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Price alerts
export const usePriceAlerts = (
  options?: UseQueryOptions<any[]>
) => {
  return useQuery({
    queryKey: tradingKeys.alerts(),
    queryFn: () => tradingApi.getPriceAlerts(),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Trading leaderboard
export const useTradingLeaderboard = (
  period: '24h' | '7d' | '30d' = '7d',
  options?: UseQueryOptions<any[]>
) => {
  return useQuery({
    queryKey: tradingKeys.leaderboard(period),
    queryFn: () => tradingApi.getTradingLeaderboard(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Mutations
export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (policy: Omit<TradingPolicy, 'id'>) => tradingApi.createPolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.myPolicies() });
    },
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ policyId, updates }: { 
      policyId: string; 
      updates: Partial<TradingPolicy> 
    }) => tradingApi.updatePolicy(policyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.myPolicies() });
    },
  });
};

export const useDeletePolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (policyId: string) => tradingApi.deletePolicy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.myPolicies() });
    },
  });
};

export const useSimulateTrade = () => {
  return useMutation({
    mutationFn: (params: {
      fromAsset: string;
      toAsset: string;
      amount: number;
      chain: string;
      dex?: string;
      policies?: TradingPolicy[];
    }) => tradingApi.simulateTrade(params),
  });
};

export const useExecuteTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: {
      fromAsset: string;
      toAsset: string;
      amount: number;
      chain: string;
      dex?: string;
      slippage?: number;
    }) => tradingApi.executeTrade(params),
    onSuccess: () => {
      // Invalidate portfolio and performance queries
      queryClient.invalidateQueries({ queryKey: tradingKeys.portfolio() });
      queryClient.invalidateQueries({ queryKey: tradingKeys.performance('24h') });
      queryClient.invalidateQueries({ queryKey: tradingKeys.feed({}) });
    },
  });
};

export const useSetPriceAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: {
      asset: string;
      targetPrice: number;
      condition: 'above' | 'below';
    }) => tradingApi.setPriceAlert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.alerts() });
    },
  });
};

export const useDeletePriceAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => tradingApi.deletePriceAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.alerts() });
    },
  });
};

// Custom hook for performance metrics with auto-refresh
export const usePerformanceMetrics = (
  period: '24h' | '7d' | '30d' | '90d' | 'all' = '30d'
) => {
  const performance = useTradingPerformance(period);
  const portfolio = usePortfolioSummary();
  
  return {
    performance: performance.data,
    portfolio: portfolio.data,
    isLoading: performance.isLoading || portfolio.isLoading,
    error: performance.error || portfolio.error,
    refetch: () => {
      performance.refetch();
      portfolio.refetch();
    },
  };
};