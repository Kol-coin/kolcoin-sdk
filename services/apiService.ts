// Kolcoin/services/apiService.ts
// API Service implementation for Kolcoin

import {
  ApiCredentials,
  ApiRequestConfig,
  ApiResponse,
  VerificationResult,
  WhitelistStatus,
  KolMetrics,
  TransactionParams,
  TransactionResult
} from '../types';

import {
  getApiBaseUrl,
  buildApiUrl,
  createAuthHeaders,
  createCancellableFetch,
  calculateBackoff,
  isValidSolanaAddress
} from '../utils/apiUtils';

import { Logger } from '../utils/logger';

interface ApiServiceOptions {
  credentials: ApiCredentials;
  autoRetry?: boolean;
  maxRetries?: number;
  logger?: Logger;
  cacheTime?: number;
}

/**
 * In-memory cache implementation
 */
class ApiCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  
  set(key: string, data: any, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * KolcoinApiService - Handles all API communication with Kolcoin backend
 */
export class KolcoinApiService {
  private baseUrl: string;
  private apiKey: string;
  private autoRetry: boolean;
  private maxRetries: number;
  private logger: Logger;
  private pendingRequests: Map<string, { cancel: () => void }> = new Map();
  private cache: ApiCache = new ApiCache();
  private cacheTime: number;
  
  constructor(options: ApiServiceOptions) {
    this.baseUrl = getApiBaseUrl(options.credentials.environment);
    this.apiKey = options.credentials.apiKey;
    this.autoRetry = options.autoRetry !== false;
    this.maxRetries = options.maxRetries || 3;
    this.logger = options.logger || new Logger({ context: { service: 'KolcoinApiService' } });
    this.cacheTime = options.cacheTime || 60000; // Default 1 minute cache
    
    // Cleanup expired cache entries periodically
    setInterval(() => this.cache.clearExpired(), 60000);
  }
  
  /**
   * Creates a unique request ID for caching and cancellation
   */
  private createRequestId(config: ApiRequestConfig): string {
    return `${config.method}:${config.endpoint}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.body || {})}`;
  }
  
  /**
   * Executes an API request with retry and caching logic
   */
  private async executeRequest<T>(
    config: ApiRequestConfig, 
    options: { 
      useCache?: boolean;
      bypassCache?: boolean;
      retryCount?: number;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { useCache = true, bypassCache = false, retryCount = 0 } = options;
    const requestId = this.createRequestId(config);
    
    // Check cache if enabled and not bypassed
    if (useCache && !bypassCache) {
      const cachedData = this.cache.get<ApiResponse<T>>(requestId);
      if (cachedData) {
        this.logger.debug('Using cached response', { requestId, endpoint: config.endpoint });
        return cachedData;
      }
    }
    
    // Cancel any pending duplicate requests
    if (this.pendingRequests.has(requestId)) {
      this.logger.debug('Cancelling existing request', { requestId, endpoint: config.endpoint });
      this.pendingRequests.get(requestId)?.cancel();
      this.pendingRequests.delete(requestId);
    }
    
    try {
      // Prepare request URL and headers
      const url = buildApiUrl(this.baseUrl, config.endpoint, config.params);
      const headers = createAuthHeaders(this.apiKey, config.headers);
      
      // Create fetch options
      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
        ...(config.body ? { body: JSON.stringify(config.body) } : {})
      };
      
      this.logger.debug('Executing API request', { 
        url, 
        method: config.method, 
        requestId,
        retryCount
      });
      
      // Create cancellable request
      const { promise, cancel } = createCancellableFetch<T>(url, fetchOptions);
      
      // Store the cancel function
      this.pendingRequests.set(requestId, { cancel });
      
      // Execute the request
      const response = await promise;
      
      // Remove from pending requests
      this.pendingRequests.delete(requestId);
      
      // Handle server errors with retries
      if (!response.success && this.autoRetry && retryCount < this.maxRetries) {
        const shouldRetry = response.error?.code?.startsWith('HTTP_5') || 
                            response.error?.code === 'NETWORK_ERROR';
        
        if (shouldRetry) {
          const delay = calculateBackoff(retryCount);
          this.logger.info(`Retrying request in ${delay}ms`, { 
            requestId, 
            retryCount: retryCount + 1,
            maxRetries: this.maxRetries
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.executeRequest<T>(config, {
            useCache,
            bypassCache: true, // Don't use cache for retries
            retryCount: retryCount + 1
          });
        }
      }
      
      // Cache successful responses
      if (response.success && useCache) {
        this.cache.set(requestId, response, this.cacheTime);
      }
      
      return response;
    } catch (error) {
      this.logger.error('API request failed', { 
        error, 
        endpoint: config.endpoint,
        requestId
      });
      
      // Remove from pending requests if there's an error
      this.pendingRequests.delete(requestId);
      
      return {
        success: false,
        error: {
          code: 'REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }
  
  /**
   * Invalidates cache for specific patterns
   */
  public invalidateCache(pattern?: RegExp): void {
    if (!pattern) {
      this.cache.clear();
      this.logger.debug('Cache cleared');
      return;
    }
    
    // Implementation would be more complex in a real cache system
    this.logger.debug('Pattern-based cache invalidation not implemented');
    this.cache.clear();
  }
  
  /**
   * Cancels all pending requests
   */
  public cancelAllRequests(): void {
    for (const [requestId, { cancel }] of this.pendingRequests.entries()) {
      cancel();
      this.logger.debug('Request cancelled', { requestId });
    }
    this.pendingRequests.clear();
  }
  
  /**
   * Checks verification status of a wallet
   */
  public async checkVerificationStatus(wallet: string): Promise<ApiResponse<VerificationResult>> {
    if (!isValidSolanaAddress(wallet)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'The provided wallet address is invalid'
        }
      };
    }
    
    return this.executeRequest<VerificationResult>({
      endpoint: '/verification/status',
      method: 'GET',
      params: { wallet }
    });
  }
  
  /**
   * Checks whitelist status of a wallet
   */
  public async checkWhitelistStatus(walletAddress: string): Promise<ApiResponse<WhitelistStatus>> {
    if (!isValidSolanaAddress(walletAddress)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'The provided wallet address is invalid'
        }
      };
    }
    
    return this.executeRequest<WhitelistStatus>({
      endpoint: '/whitelist/check',
      method: 'POST',
      body: { walletAddress }
    });
  }
  
  /**
   * Retrieves KOL metrics for a wallet
   */
  public async getKolMetrics(wallet: string): Promise<ApiResponse<KolMetrics>> {
    if (!isValidSolanaAddress(wallet)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'The provided wallet address is invalid'
        }
      };
    }
    
    return this.executeRequest<KolMetrics>({
      endpoint: '/metrics/kol',
      method: 'GET',
      params: { wallet }
    });
  }
  
  /**
   * Initiates a token transfer between wallets
   */
  public async transferTokens(params: TransactionParams): Promise<ApiResponse<TransactionResult>> {
    if (!isValidSolanaAddress(params.from) || !isValidSolanaAddress(params.to)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'One or more wallet addresses are invalid'
        }
      };
    }
    
    if (params.amount <= 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Transfer amount must be greater than zero'
        }
      };
    }
    
    return this.executeRequest<TransactionResult>({
      endpoint: '/token/transfer',
      method: 'POST',
      body: params
    }, {
      // Don't cache transaction requests
      useCache: false
    });
  }
} 