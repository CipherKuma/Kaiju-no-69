import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { shadowApi } from '@/lib/api/shadow-api';
import { Shadow, TradingPolicy } from '@/types/models';
import { 
  CreateShadowParams, 
  UpdateShadowParams, 
  ShadowFilters,
  ShadowEstimate,
  EmergencyStopParams 
} from '@/lib/api/shadow-api';

// Query keys
const shadowKeys = {
  all: ['shadows'] as const,
  lists: () => [...shadowKeys.all, 'list'] as const,
  list: (filters?: ShadowFilters) => [...shadowKeys.lists(), filters] as const,
  details: () => [...shadowKeys.all, 'detail'] as const,
  detail: (id: string) => [...shadowKeys.details(), id] as const,
  performance: (id: string) => [...shadowKeys.detail(id), 'performance'] as const,
  trades: (id: string) => [...shadowKeys.detail(id), 'trades'] as const,
  metadata: (id: string) => [...shadowKeys.detail(id), 'metadata'] as const,
  analytics: (id: string) => [...shadowKeys.detail(id), 'analytics'] as const,
  expiring: (days: number) => [...shadowKeys.all, 'expiring', days] as const,
  estimate: (params: CreateShadowParams) => [...shadowKeys.all, 'estimate', params] as const,
  recommendations: (kaijuId: string) => [...shadowKeys.all, 'recommendations', kaijuId] as const,
};

// Get user's shadows
export const useMyShadows = (
  filters?: ShadowFilters,
  options?: UseQueryOptions<Shadow[]>
) => {
  return useQuery({
    queryKey: shadowKeys.list(filters),
    queryFn: () => shadowApi.getMyShadows(filters),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Get multiple shadows with individual queries
export const useMultipleShadows = (shadowIds: string[]) => {
  const queries = useQuery({
    queryKey: ['multiple-shadows', shadowIds],
    queryFn: async () => {
      const shadows = await Promise.all(
        shadowIds.map(id => shadowApi.getShadow(id))
      );
      return shadows;
    },
    enabled: shadowIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  return queries;
};

// Get single shadow details
export const useShadow = (
  shadowId: string,
  options?: UseQueryOptions<Shadow>
) => {
  return useQuery({
    queryKey: shadowKeys.detail(shadowId),
    queryFn: () => shadowApi.getShadow(shadowId),
    enabled: !!shadowId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Get shadow creation estimate
export const useShadowEstimate = (
  params: CreateShadowParams,
  options?: UseQueryOptions<ShadowEstimate>
) => {
  return useQuery({
    queryKey: shadowKeys.estimate(params),
    queryFn: () => shadowApi.getShadowEstimate(params),
    enabled: !!params.kaijuId && params.policies.length > 0,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// Get expiring shadows
export const useExpiringShadows = (
  days: number = 3,
  options?: UseQueryOptions<Shadow[]>
) => {
  return useQuery({
    queryKey: shadowKeys.expiring(days),
    queryFn: () => shadowApi.getExpiringShadows(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    ...options,
  });
};

// Get policy recommendations
export const usePolicyRecommendations = (
  kaijuId: string,
  options?: UseQueryOptions<TradingPolicy[]>
) => {
  return useQuery({
    queryKey: shadowKeys.recommendations(kaijuId),
    queryFn: () => shadowApi.getPolicyRecommendations(kaijuId),
    enabled: !!kaijuId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Create shadow mutation
export const useCreateShadow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CreateShadowParams) => shadowApi.createShadow(params),
    onSuccess: (shadow) => {
      // Invalidate shadow list
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
      // Add the new shadow to cache
      queryClient.setQueryData(shadowKeys.detail(shadow.id), shadow);
    },
  });
};

// Update shadow mutation
export const useUpdateShadow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shadowId, params }: { shadowId: string; params: UpdateShadowParams }) => 
      shadowApi.updateShadow(shadowId, params),
    onSuccess: (shadow) => {
      // Update cache
      queryClient.setQueryData(shadowKeys.detail(shadow.id), shadow);
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
    },
  });
};

// Destroy shadow mutation
export const useDestroyShadow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shadowId: string) => shadowApi.destroyShadow(shadowId),
    onSuccess: (_, shadowId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: shadowKeys.detail(shadowId) });
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
    },
  });
};

// Pause/Resume shadow mutations
export const usePauseShadow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shadowId: string) => shadowApi.pauseShadow(shadowId),
    onSuccess: (shadow) => {
      queryClient.setQueryData(shadowKeys.detail(shadow.id), shadow);
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
    },
  });
};

export const useResumeShadow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shadowId: string) => shadowApi.resumeShadow(shadowId),
    onSuccess: (shadow) => {
      queryClient.setQueryData(shadowKeys.detail(shadow.id), shadow);
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
    },
  });
};

// Emergency stop mutation
export const useEmergencyStop = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: EmergencyStopParams = {}) => shadowApi.emergencyStop(params),
    onSuccess: () => {
      // Invalidate all shadow queries
      queryClient.invalidateQueries({ queryKey: shadowKeys.all });
    },
  });
};

// Extend shadow mutation
export const useExtendShadow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shadowId, additionalDays }: { 
      shadowId: string; 
      additionalDays: 7 | 14 | 30 
    }) => shadowApi.extendShadow(shadowId, additionalDays),
    onSuccess: (_result, { shadowId }) => {
      // Update shadow in cache
      queryClient.invalidateQueries({ queryKey: shadowKeys.detail(shadowId) });
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
    },
  });
};

// Batch operations
export const useBatchUpdatePolicies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shadowIds, policies }: { 
      shadowIds: string[]; 
      policies: TradingPolicy[] 
    }) => shadowApi.batchUpdatePolicies(shadowIds, policies),
    onSuccess: (result) => {
      // Invalidate updated shadows
      result.updated.forEach(shadowId => {
        queryClient.invalidateQueries({ queryKey: shadowKeys.detail(shadowId) });
      });
      queryClient.invalidateQueries({ queryKey: shadowKeys.lists() });
    },
  });
};

export const useBatchPause = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shadowIds: string[]) => shadowApi.batchPause(shadowIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shadowKeys.all });
    },
  });
};

export const useBatchResume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shadowIds: string[]) => shadowApi.batchResume(shadowIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shadowKeys.all });
    },
  });
};

// Get shadow analytics
export const useShadowAnalytics = (
  shadowId: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: shadowKeys.analytics(shadowId),
    queryFn: () => shadowApi.getShadowAnalytics(shadowId),
    enabled: !!shadowId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get shadow performance
export const useShadowPerformance = (
  shadowId: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: shadowKeys.performance(shadowId),
    queryFn: () => shadowApi.getShadowPerformance(shadowId),
    enabled: !!shadowId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// Validate policies
export const useValidatePolicies = () => {
  return useMutation({
    mutationFn: (policies: TradingPolicy[]) => shadowApi.validatePolicies(policies),
  });
};