import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/models';

// API configuration
const API_BASE_URL = '/api'; // Use Next.js API routes instead of external backend
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Storage keys
const AUTH_TOKEN_KEY = 'kaiju-auth-token';
const REFRESH_TOKEN_KEY = 'kaiju-refresh-token';

// Token management
export const tokenManager = {
  getAccessToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },
  
  getRefreshToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },
  
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  },
  
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: number };
    
    // Handle network errors
    if (!error.response) {
      throw {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
      } as ApiError;
    }
    
    // Handle 401 - try to refresh token
    if (error.response.status === 401 && !originalRequest.url?.includes('/auth/refresh')) {
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          tokenManager.setTokens(accessToken, newRefreshToken);
          
          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        tokenManager.clearTokens();
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding';
        }
      }
    }
    
    // Handle 429 - rate limiting with retry
    if (error.response.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60') * 1000;
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      if (originalRequest._retry <= MAX_RETRIES) {
        await sleep(retryAfter);
        return apiClient(originalRequest);
      }
    }
    
    // Handle 503 - service unavailable with retry
    if (error.response.status === 503) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      if (originalRequest._retry <= MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retry - 1); // Exponential backoff
        await sleep(delay);
        return apiClient(originalRequest);
      }
    }
    
    // Transform error to consistent format
    const apiError: ApiError = {
      code: error.response.data?.code || error.code || 'UNKNOWN_ERROR',
      message: error.response.data?.message || error.message || 'An unexpected error occurred',
      details: error.response.data?.details,
    };
    
    throw apiError;
  }
);

// Utility functions
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Request helpers
export const apiRequest = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(res => res.data),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(res => res.data),
};

// Upload helper for multipart data
export const uploadFile = async (url: string, file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  }).then(res => res.data);
};

export default apiClient;