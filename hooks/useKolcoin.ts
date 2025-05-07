// Kolcoin/hooks/useKolcoin.ts
// React hook for using the Kolcoin SDK

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { KolcoinSDK } from '../lib/KolcoinSDK';
import {
  ApiCredentials,
  SdkConfig,
  VerificationResult,
  WhitelistStatus,
  KolMetrics,
  TransactionParams,
  TransactionResult,
  ApiResponse,
  EventType
} from '../types';

interface UseKolcoinHookOptions {
  apiKey: string;
  environment?: ApiCredentials['environment'];
  autoRetry?: boolean;
  maxRetries?: number;
  logLevel?: SdkConfig['logLevel'];
  cacheTime?: number;
}

interface EventHookResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * React hook for using the Kolcoin SDK in components
 */
export function useKolcoin(options: UseKolcoinHookOptions) {
  const {
    apiKey,
    environment = 'development',
    autoRetry = true,
    maxRetries = 3,
    logLevel = 'error',
    cacheTime = 60000
  } = options;
  
  // Create SDK instance and persist it in a ref
  const sdkRef = useRef<KolcoinSDK | null>(null);
  
  // Initialize SDK if needed
  useEffect(() => {
    if (!sdkRef.current) {
      // Configure SDK
      const config: SdkConfig = {
        apiCredentials: {
          apiKey,
          environment
        },
        autoRetry,
        maxRetries,
        logLevel,
        cacheTime
      };
      
      // Create SDK instance
      sdkRef.current = new KolcoinSDK(config);
    }
    
    // Cleanup on unmount
    return () => {
      if (sdkRef.current) {
        sdkRef.current.dispose();
        sdkRef.current = null;
      }
    };
  }, [apiKey, environment, autoRetry, maxRetries, logLevel, cacheTime]);
  
  /**
   * Hook for checking verification status
   */
  const useVerificationStatus = (wallet: string | null, options: { 
    enabled?: boolean;
    refetchInterval?: number;
  } = {}) => {
    const { enabled = true, refetchInterval } = options;
    const [result, setResult] = useState<ApiResponse<VerificationResult> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<number | null>(null);
    
    const fetchData = useCallback(async () => {
      if (!wallet || !enabled || !sdkRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await sdkRef.current.verification.checkStatus(wallet);
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }, [wallet, enabled]);
    
    // Initial fetch and interval setup
    useEffect(() => {
      fetchData();
      
      // Setup interval if specified
      if (refetchInterval && refetchInterval > 0) {
        intervalRef.current = window.setInterval(fetchData, refetchInterval);
      }
      
      return () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [fetchData, refetchInterval]);
    
    return {
      data: result?.success ? result.data : null,
      isLoading,
      error,
      refetch: fetchData,
      rawResponse: result
    };
  };
  
  /**
   * Hook for checking whitelist status
   */
  const useWhitelistStatus = (wallet: string | null, options: { 
    enabled?: boolean;
    refetchInterval?: number;
  } = {}) => {
    const { enabled = true, refetchInterval } = options;
    const [result, setResult] = useState<ApiResponse<WhitelistStatus> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<number | null>(null);
    
    const fetchData = useCallback(async () => {
      if (!wallet || !enabled || !sdkRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await sdkRef.current.whitelist.checkStatus(wallet);
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }, [wallet, enabled]);
    
    // Initial fetch and interval setup
    useEffect(() => {
      fetchData();
      
      // Setup interval if specified
      if (refetchInterval && refetchInterval > 0) {
        intervalRef.current = window.setInterval(fetchData, refetchInterval);
      }
      
      return () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [fetchData, refetchInterval]);
    
    return {
      data: result?.success ? result.data : null,
      isLoading,
      error,
      refetch: fetchData,
      rawResponse: result
    };
  };
  
  /**
   * Hook for fetching KOL metrics
   */
  const useKolMetrics = (wallet: string | null, options: { 
    enabled?: boolean;
    refetchInterval?: number;
  } = {}) => {
    const { enabled = true, refetchInterval } = options;
    const [result, setResult] = useState<ApiResponse<KolMetrics> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<number | null>(null);
    
    const fetchData = useCallback(async () => {
      if (!wallet || !enabled || !sdkRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await sdkRef.current.metrics.getKolMetrics(wallet);
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }, [wallet, enabled]);
    
    // Initial fetch and interval setup
    useEffect(() => {
      fetchData();
      
      // Setup interval if specified
      if (refetchInterval && refetchInterval > 0) {
        intervalRef.current = window.setInterval(fetchData, refetchInterval);
      }
      
      return () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [fetchData, refetchInterval]);
    
    return {
      data: result?.success ? result.data : null,
      isLoading,
      error,
      refetch: fetchData,
      rawResponse: result
    };
  };
  
  /**
   * Hook for watching events of a specific type
   */
  const useKolcoinEvents = <T = any>(eventType: EventType): EventHookResult<T> => {
    const [events, setEvents] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
      if (!sdkRef.current) {
        setError(new Error('SDK not initialized'));
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Load initial events from history
      try {
        const history = sdkRef.current.getEventHistory<T>(eventType);
        setEvents(history.map(item => item.data));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load event history'));
        setLoading(false);
      }
      
      // Subscribe to new events
      const unsubscribe = sdkRef.current.on<T>(eventType, (data) => {
        setEvents(prev => [data, ...prev]);
      });
      
      return () => {
        unsubscribe();
      };
    }, [eventType]);
    
    return {
      data: events,
      loading,
      error
    };
  };
  
  /**
   * Hook for sending tokens
   */
  const useSendTokens = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<ApiResponse<TransactionResult> | null>(null);
    
    const sendTokens = useCallback(async (params: TransactionParams) => {
      if (!sdkRef.current) {
        throw new Error('SDK not initialized');
      }
      
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      try {
        const response = await sdkRef.current.transactions.send(params);
        setResult(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send tokens');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);
    
    return {
      sendTokens,
      isLoading,
      error,
      result: result?.success ? result.data : null,
      rawResponse: result
    };
  };
  
  /**
   * Hook for claiming allocated tokens
   */
  const useClaimTokens = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<ApiResponse<any> | null>(null);
    
    const claimTokens = useCallback(async (wallet: string, amount: number) => {
      if (!sdkRef.current) {
        throw new Error('SDK not initialized');
      }
      
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      try {
        const response = await sdkRef.current.whitelist.claimTokens(wallet, amount);
        setResult(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to claim tokens');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);
    
    return {
      claimTokens,
      isLoading,
      error,
      result: result?.success ? result.data : null,
      rawResponse: result
    };
  };
  
  /**
   * Hook for getting transaction history
   */
  const useTransactionHistory = (wallet: string | null, options: { 
    enabled?: boolean;
    limit?: number;
    offset?: number;
    type?: 'all' | 'sent' | 'received';
    refetchInterval?: number;
  } = {}) => {
    const { 
      enabled = true, 
      limit = 10, 
      offset = 0, 
      type = 'all',
      refetchInterval 
    } = options;
    
    const [result, setResult] = useState<ApiResponse<any> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<number | null>(null);
    
    const fetchData = useCallback(async () => {
      if (!wallet || !enabled || !sdkRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await sdkRef.current.transactions.getHistory(wallet, { limit, offset, type });
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }, [wallet, enabled, limit, offset, type]);
    
    // Initial fetch and interval setup
    useEffect(() => {
      fetchData();
      
      // Setup interval if specified
      if (refetchInterval && refetchInterval > 0) {
        intervalRef.current = window.setInterval(fetchData, refetchInterval);
      }
      
      return () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [fetchData, refetchInterval]);
    
    return {
      data: result?.success ? result.data : null,
      isLoading,
      error,
      refetch: fetchData,
      rawResponse: result
    };
  };
  
  /**
   * Expose SDK methods and hooks
   */
  return useMemo(() => ({
    // Direct SDK access (if needed)
    sdk: sdkRef.current,
    
    // Data fetching hooks
    useVerificationStatus,
    useWhitelistStatus,
    useKolMetrics,
    useTransactionHistory,
    
    // Event hooks
    useKolcoinEvents,
    
    // Action hooks
    useSendTokens,
    useClaimTokens
  }), []);
} 