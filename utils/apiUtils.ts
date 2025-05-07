// Kolcoin/utils/apiUtils.ts
// API utility functions for Kolcoin

import { ApiRequestConfig, ApiResponse, ApiCredentials } from '../types';

/**
 * Base URL for the Kolcoin API based on environment
 */
export const getApiBaseUrl = (environment: ApiCredentials['environment']): string => {
  switch (environment) {
    case 'mainnet':
      return 'https://api.kolcoin.xyz/v1';
    case 'testnet':
      return 'https://testnet-api.kolcoin.xyz/v1';
    case 'development':
    default:
      return 'https://dev-api.kolcoin.xyz/v1';
  }
};

/**
 * Formats API query parameters
 */
export const formatQueryParams = (params: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) return '';
  
  const validParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`).join('&');
      }
      // Handle objects
      if (typeof value === 'object') {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      // Handle primitive values
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  
  return `?${validParams}`;
};

/**
 * Builds the complete API URL
 */
export const buildApiUrl = (
  baseUrl: string,
  endpoint: ApiRequestConfig['endpoint'],
  params?: ApiRequestConfig['params']
): string => {
  const queryString = params ? formatQueryParams(params) : '';
  return `${baseUrl}${endpoint}${queryString}`;
};

/**
 * Creates authorization headers
 */
export const createAuthHeaders = (apiKey: string, additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': typeof window !== 'undefined' ? 'browser' : 'node',
    ...additionalHeaders
  };
};

/**
 * Handles API errors with detailed error messages
 */
export const handleApiError = (error: any): ApiResponse<null> => {
  // Network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the Kolcoin API. Please check your internet connection.'
      }
    };
  }

  // Parse API errors
  if (error.response) {
    try {
      const errorData = error.response.json();
      return {
        success: false,
        error: {
          code: errorData.code || `HTTP_${error.response.status}`,
          message: errorData.message || 'An error occurred while communicating with the Kolcoin API',
          details: errorData.details || null
        }
      };
    } catch {
      return {
        success: false,
        error: {
          code: `HTTP_${error.response.status}`,
          message: error.response.statusText || 'Unknown API error',
        }
      };
    }
  }

  // Fallback for other errors
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error
    }
  };
};

/**
 * Implements exponential backoff for API retries
 */
export const calculateBackoff = (attempt: number, baseDelay: number = 300): number => {
  const maxDelay = 10000; // 10 seconds max
  const jitter = Math.random() * 0.3 + 0.85; // 15% jitter
  const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt) * jitter);
  return delay;
};

/**
 * Validates a wallet address format for Solana
 */
export const isValidSolanaAddress = (address: string): boolean => {
  // Basic validation - real implementation would use more sophisticated checking
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

/**
 * Encodes special characters in API path segments
 */
export const sanitizePathSegment = (segment: string): string => {
  return segment.replace(/[^a-zA-Z0-9_-]/g, '_');
};

/**
 * Parses API response with error handling
 */
export const parseApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    return handleApiError({ response }) as ApiResponse<T>;
  }
  
  try {
    const data = await response.json();
    return {
      success: true,
      data: data as T,
      pagination: data.pagination
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse API response',
        details: error
      }
    };
  }
};

/**
 * Creates a cancellable fetch request
 */
export const createCancellableFetch = <T>(
  url: string, 
  options: RequestInit
): { promise: Promise<ApiResponse<T>>; cancel: () => void } => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const promise = fetch(url, { ...options, signal })
    .then(response => parseApiResponse<T>(response))
    .catch(error => {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'REQUEST_CANCELLED',
            message: 'The request was cancelled'
          }
        } as ApiResponse<T>;
      }
      return handleApiError(error) as ApiResponse<T>;
    });
  
  return {
    promise,
    cancel: () => controller.abort()
  };
}; 