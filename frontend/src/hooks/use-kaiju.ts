import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { kaijuApi } from '@/lib/api/kaiju-api';
import { Kaiju, PaginatedResponse, PerformanceData } from '@/types/models';
import { KaijuFilters, KaijuSortOptions, KaijuListParams } from '@/lib/api/kaiju-api';

// Query keys
const kaijuKeys = {
  all: ['kaiju'] as const,
  lists: () => [...kaijuKeys.all, 'list'] as const,
  list: (params: KaijuListParams) => [...kaijuKeys.lists(), params] as const,
  details: () => [...kaijuKeys.all, 'detail'] as const,
  detail: (id: string) => [...kaijuKeys.details(), id] as const,
  performance: (id: string, period?: string) => [...kaijuKeys.detail(id), 'performance', period] as const,
  shadows: (id: string) => [...kaijuKeys.detail(id), 'shadows'] as const,
  trades: (id: string) => [...kaijuKeys.detail(id), 'trades'] as const,
  top: (period: string) => [...kaijuKeys.all, 'top', period] as const,
  trending: () => [...kaijuKeys.all, 'trending'] as const,
  search: (query: string) => [...kaijuKeys.all, 'search', query] as const,
  followed: () => [...kaijuKeys.all, 'followed'] as const,
};

// Get Kaiju list with filters
export const useKaijuList = (
  params: KaijuListParams = {},
  options?: UseQueryOptions<PaginatedResponse<Kaiju>>
) => {
  return useQuery({
    queryKey: kaijuKeys.list(params),
    queryFn: () => kaijuApi.getKaijuList(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Get single Kaiju details
export const useKaiju = (
  kaijuId: string,
  options?: UseQueryOptions<Kaiju>
) => {
  return useQuery({
    queryKey: kaijuKeys.detail(kaijuId),
    queryFn: () => kaijuApi.getKaiju(kaijuId),
    enabled: !!kaijuId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// Get Kaiju performance
export const useKaijuPerformance = (
  kaijuId: string,
  period: '24h' | '7d' | '30d' | '90d' | '1y' | 'all' = '30d',
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly',
  options?: UseQueryOptions<PerformanceData>
) => {
  return useQuery({
    queryKey: kaijuKeys.performance(kaijuId, period),
    queryFn: () => kaijuApi.getKaijuPerformance({ kaijuId, period, interval }),
    enabled: !!kaijuId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get top performing Kaiju
export const useTopKaiju = (
  limit: number = 10,
  period: string = '30d',
  options?: UseQueryOptions<Kaiju[]>
) => {
  return useQuery({
    queryKey: kaijuKeys.top(period),
    queryFn: () => kaijuApi.getTopKaiju(limit, period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get trending Kaiju
export const useTrendingKaiju = (
  limit: number = 10,
  options?: UseQueryOptions<Kaiju[]>
) => {
  return useQuery({
    queryKey: kaijuKeys.trending(),
    queryFn: () => kaijuApi.getTrendingKaiju(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Search Kaiju
export const useKaijuSearch = (
  query: string,
  options?: UseQueryOptions<Kaiju[]>
) => {
  return useQuery({
    queryKey: kaijuKeys.search(query),
    queryFn: () => kaijuApi.searchKaiju(query),
    enabled: query.length > 2, // Only search with 3+ characters
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Get followed Kaiju
export const useFollowedKaiju = (
  options?: UseQueryOptions<Kaiju[]>
) => {
  return useQuery({
    queryKey: kaijuKeys.followed(),
    queryFn: () => kaijuApi.getFollowedKaiju(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// Follow/unfollow mutations
export const useFollowKaiju = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (kaijuId: string) => kaijuApi.followKaiju(kaijuId),
    onSuccess: (_, kaijuId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: kaijuKeys.followed() });
      queryClient.invalidateQueries({ queryKey: kaijuKeys.detail(kaijuId) });
    },
  });
};

export const useUnfollowKaiju = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (kaijuId: string) => kaijuApi.unfollowKaiju(kaijuId),
    onSuccess: (_, kaijuId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: kaijuKeys.followed() });
      queryClient.invalidateQueries({ queryKey: kaijuKeys.detail(kaijuId) });
    },
  });
};

// Rate Kaiju mutation
export const useRateKaiju = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ kaijuId, rating }: { kaijuId: string; rating: number }) => 
      kaijuApi.rateKaiju(kaijuId, rating),
    onSuccess: (_, { kaijuId }) => {
      queryClient.invalidateQueries({ queryKey: kaijuKeys.detail(kaijuId) });
    },
  });
};

// Custom hook for Kaiju comparison
export const useKaijuComparison = (kaijuIds: string[]) => {
  const queries = useQuery({
    queryKey: ['kaiju-comparison', kaijuIds],
    queryFn: async () => {
      const kaijuData = await Promise.all(
        kaijuIds.map(id => kaijuApi.getKaiju(id))
      );
      const performanceData = await Promise.all(
        kaijuIds.map(id => kaijuApi.getKaijuPerformance({ kaijuId: id }))
      );
      
      return kaijuData.map((kaiju, index) => ({
        ...kaiju,
        performance: performanceData[index],
      }));
    },
    enabled: kaijuIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return queries;
};

// Infinite query for trading history
export const useKaijuTradingHistory = (kaijuId: string, pageSize: number = 20) => {
  return useQuery({
    queryKey: [...kaijuKeys.trades(kaijuId), pageSize],
    queryFn: ({ pageParam = 1 }) => 
      kaijuApi.getKaijuTradingHistory(kaijuId, pageParam, pageSize),
    enabled: !!kaijuId,
    staleTime: 30 * 1000, // 30 seconds
  });
};