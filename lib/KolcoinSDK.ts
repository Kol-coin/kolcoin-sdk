// Kolcoin/lib/KolcoinSDK.ts
// Main SDK class for Kolcoin integration

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

import { KolcoinApiService } from '../services/apiService';
import { KolcoinEventService } from '../services/eventService';
import { Logger } from '../utils/logger';
import { isValidSolanaAddress } from '../utils/apiUtils';

/**
 * Main Kolcoin SDK class that provides a complete interface for interacting with
 * the Kolcoin ecosystem, including verification, whitelist, and token operations.
 */
export class KolcoinSDK {
  private apiService: KolcoinApiService;
  private eventService: KolcoinEventService;
  private logger: Logger;
  
  private _verification: VerificationModule;
  private _whitelist: WhitelistModule;
  private _transactions: TransactionModule;
  private _metrics: MetricsModule;
  
  /**
   * Creates a new instance of the Kolcoin SDK
   */
  constructor(config: SdkConfig) {
    // Initialize logger
    this.logger = new Logger({
      level: config.logLevel,
      context: { service: 'KolcoinSDK' }
    });
    
    this.logger.info('Initializing Kolcoin SDK', {
      environment: config.apiCredentials.environment,
      version: '1.0.0'
    });
    
    // Initialize services
    this.apiService = new KolcoinApiService({
      credentials: config.apiCredentials,
      autoRetry: config.autoRetry,
      maxRetries: config.maxRetries,
      logger: this.logger.createChild('ApiService'),
      cacheTime: config.cacheTime
    });
    
    this.eventService = new KolcoinEventService({
      logger: this.logger.createChild('EventService')
    });
    
    // Initialize modules
    this._verification = new VerificationModule(this.apiService, this.eventService, this.logger);
    this._whitelist = new WhitelistModule(this.apiService, this.eventService, this.logger);
    this._transactions = new TransactionModule(this.apiService, this.eventService, this.logger);
    this._metrics = new MetricsModule(this.apiService, this.logger);
    
    // Log SDK initialization complete
    this.logger.info('Kolcoin SDK initialized successfully');
  }
  
  /**
   * Access to verification-related functions
   */
  get verification(): VerificationModule {
    return this._verification;
  }
  
  /**
   * Access to whitelist-related functions
   */
  get whitelist(): WhitelistModule {
    return this._whitelist;
  }
  
  /**
   * Access to transaction-related functions
   */
  get transactions(): TransactionModule {
    return this._transactions;
  }
  
  /**
   * Access to metrics-related functions
   */
  get metrics(): MetricsModule {
    return this._metrics;
  }
  
  /**
   * Subscribe to an event
   */
  public on<T = any>(eventType: EventType, callback: (data: T) => void): () => void {
    return this.eventService.on(eventType, callback);
  }
  
  /**
   * Unsubscribe from an event
   */
  public off<T = any>(eventType: EventType, callback: (data: T) => void): void {
    this.eventService.off(eventType, callback);
  }
  
  /**
   * Get event history for a specific type
   */
  public getEventHistory<T = any>(eventType: EventType): Array<{ timestamp: number; data: T }> {
    return this.eventService.getEventHistory(eventType);
  }
  
  /**
   * Clean up resources used by the SDK
   */
  public dispose(): void {
    this.logger.info('Disposing Kolcoin SDK');
    
    // Cancel any pending API requests
    this.apiService.cancelAllRequests();
    
    // Remove all event listeners
    this.eventService.removeAllListeners();
    
    this.logger.info('Kolcoin SDK disposed');
  }
}

/**
 * Module for handling verification-related operations
 */
class VerificationModule {
  private apiService: KolcoinApiService;
  private eventService: KolcoinEventService;
  private logger: Logger;
  
  constructor(apiService: KolcoinApiService, eventService: KolcoinEventService, logger: Logger) {
    this.apiService = apiService;
    this.eventService = eventService;
    this.logger = logger.createChild('VerificationModule');
  }
  
  /**
   * Check verification status of a wallet
   */
  public async checkStatus(wallet: string): Promise<ApiResponse<VerificationResult>> {
    this.logger.debug('Checking verification status', { wallet });
    
    if (!isValidSolanaAddress(wallet)) {
      this.logger.warn('Invalid wallet address provided', { wallet });
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'The provided wallet address is invalid'
        }
      };
    }
    
    return this.apiService.checkVerificationStatus(wallet);
  }
  
  /**
   * Request verification for a wallet with social proof
   */
  public async requestVerification(params: {
    wallet: string;
    socialProofs: {
      twitter?: string;
      discord?: string;
      telegram?: string;
      youtube?: string;
    };
    email?: string;
  }): Promise<ApiResponse<{ requestId: string; estimatedTime: string }>> {
    this.logger.debug('Requesting verification', { 
      wallet: params.wallet,
      socialProofs: Object.keys(params.socialProofs)
    });
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        requestId: `vr_${Math.random().toString(36).substring(2, 10)}`,
        estimatedTime: '24h'
      }
    };
  }
  
  /**
   * Get detailed verification metrics
   */
  public async getVerificationDetails(wallet: string): Promise<ApiResponse<{
    verificationScore: number;
    criteriaResults: {
      followers: { score: number; details: any };
      engagement: { score: number; details: any };
      content: { score: number; details: any };
      reputation: { score: number; details: any };
    };
    lastUpdated: string;
  }>> {
    this.logger.debug('Getting verification details', { wallet });
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        verificationScore: 76,
        criteriaResults: {
          followers: { 
            score: 85, 
            details: { twitter: 1800, youtube: 950, total: 2750 } 
          },
          engagement: { 
            score: 72, 
            details: { averageRate: 3.2, commentQuality: 68 } 
          },
          content: { 
            score: 81, 
            details: { frequency: 'high', quality: 'good' } 
          },
          reputation: { 
            score: 65, 
            details: { communityFeedback: 'positive' } 
          }
        },
        lastUpdated: new Date().toISOString()
      }
    };
  }
  
  /**
   * Manually emit a verification update event (for testing)
   */
  public emitVerificationUpdate(data: any): void {
    this.eventService.emit('verification.updated', data);
  }
}

/**
 * Module for handling whitelist-related operations
 */
class WhitelistModule {
  private apiService: KolcoinApiService;
  private eventService: KolcoinEventService;
  private logger: Logger;
  
  constructor(apiService: KolcoinApiService, eventService: KolcoinEventService, logger: Logger) {
    this.apiService = apiService;
    this.eventService = eventService;
    this.logger = logger.createChild('WhitelistModule');
  }
  
  /**
   * Check whitelist status of a wallet
   */
  public async checkStatus(wallet: string): Promise<ApiResponse<WhitelistStatus>> {
    this.logger.debug('Checking whitelist status', { wallet });
    
    if (!isValidSolanaAddress(wallet)) {
      this.logger.warn('Invalid wallet address provided', { wallet });
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'The provided wallet address is invalid'
        }
      };
    }
    
    return this.apiService.checkWhitelistStatus(wallet);
  }
  
  /**
   * Get whitelisted tokens allocation for a wallet
   */
  public async getAllocation(wallet: string): Promise<ApiResponse<{
    totalAllocation: number;
    claimed: number;
    remaining: number;
    nextClaimDate?: string;
  }>> {
    this.logger.debug('Getting token allocation', { wallet });
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        totalAllocation: 100000,
        claimed: 25000,
        remaining: 75000,
        nextClaimDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }
  
  /**
   * Claim allocated tokens to a whitelisted wallet
   */
  public async claimTokens(wallet: string, amount: number): Promise<ApiResponse<{
    success: boolean;
    transactionId?: string;
    claimed: number;
    remaining: number;
  }>> {
    this.logger.debug('Claiming tokens', { wallet, amount });
    
    if (!isValidSolanaAddress(wallet)) {
      return {
        success: false,
        error: {
          code: 'INVALID_WALLET',
          message: 'The provided wallet address is invalid'
        }
      };
    }
    
    if (amount <= 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Claim amount must be greater than zero'
        }
      };
    }
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        success: true,
        transactionId: `tx_${Math.random().toString(36).substring(2, 10)}`,
        claimed: amount,
        remaining: 75000 - amount
      }
    };
  }
}

/**
 * Module for handling transaction-related operations
 */
class TransactionModule {
  private apiService: KolcoinApiService;
  private eventService: KolcoinEventService;
  private logger: Logger;
  
  constructor(apiService: KolcoinApiService, eventService: KolcoinEventService, logger: Logger) {
    this.apiService = apiService;
    this.eventService = eventService;
    this.logger = logger.createChild('TransactionModule');
  }
  
  /**
   * Send tokens from one wallet to another
   */
  public async send(params: TransactionParams): Promise<ApiResponse<TransactionResult>> {
    this.logger.debug('Sending tokens', { 
      from: params.from, 
      to: params.to, 
      amount: params.amount 
    });
    
    return this.apiService.transferTokens(params);
  }
  
  /**
   * Get transaction history for a wallet
   */
  public async getHistory(wallet: string, options: {
    limit?: number;
    offset?: number;
    type?: 'all' | 'sent' | 'received';
  } = {}): Promise<ApiResponse<{
    transactions: Array<{
      id: string;
      from: string;
      to: string;
      amount: number;
      timestamp: string;
      status: 'pending' | 'confirmed' | 'failed';
      memo?: string;
    }>;
    total: number;
  }>> {
    this.logger.debug('Getting transaction history', { wallet, options });
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        transactions: Array(5).fill(0).map((_, i) => ({
          id: `tx_${Math.random().toString(36).substring(2, 10)}`,
          from: i % 2 === 0 ? wallet : 'D3fkqY2SWNEgpdVZBsLYJgtVvDJYk17gVzQmYJ8LZHbP',
          to: i % 2 === 0 ? 'D3fkqY2SWNEgpdVZBsLYJgtVvDJYk17gVzQmYJ8LZHbP' : wallet,
          amount: Math.floor(Math.random() * 10000),
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          status: 'confirmed',
          memo: i % 3 === 0 ? 'Payment for services' : undefined
        })),
        total: 24
      }
    };
  }
  
  /**
   * Get transaction details
   */
  public async getTransaction(transactionId: string): Promise<ApiResponse<{
    id: string;
    from: string;
    to: string;
    amount: number;
    timestamp: string;
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    fee: number;
    memo?: string;
    blockHeight?: number;
  }>> {
    this.logger.debug('Getting transaction details', { transactionId });
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        id: transactionId,
        from: 'C01NvXkGkLadF2VDDaTZMPwVbYUAaQV8e5hJ3HEV9xLc',
        to: 'D3fkqY2SWNEgpdVZBsLYJgtVvDJYk17gVzQmYJ8LZHbP',
        amount: 5000,
        timestamp: new Date().toISOString(),
        status: 'confirmed',
        confirmations: 42,
        fee: 0.000005,
        memo: 'Payment for services',
        blockHeight: 12345678
      }
    };
  }
}

/**
 * Module for handling metrics-related operations
 */
class MetricsModule {
  private apiService: KolcoinApiService;
  private logger: Logger;
  
  constructor(apiService: KolcoinApiService, logger: Logger) {
    this.apiService = apiService;
    this.logger = logger.createChild('MetricsModule');
  }
  
  /**
   * Get KOL metrics for a wallet
   */
  public async getKolMetrics(wallet: string): Promise<ApiResponse<KolMetrics>> {
    this.logger.debug('Getting KOL metrics', { wallet });
    
    return this.apiService.getKolMetrics(wallet);
  }
  
  /**
   * Get community metrics (global stats)
   */
  public async getCommunityMetrics(): Promise<ApiResponse<{
    totalKols: number;
    totalTransactions: number;
    averageEngagement: number;
    topCategories: Array<{ name: string; kolCount: number }>;
    growthRate: number;
    lastUpdated: string;
  }>> {
    this.logger.debug('Getting community metrics');
    
    // This would make a real API call in production
    // Mock implementation for demo
    return {
      success: true,
      data: {
        totalKols: 1250,
        totalTransactions: 48752,
        averageEngagement: 3.7,
        topCategories: [
          { name: 'DeFi', kolCount: 425 },
          { name: 'NFTs', kolCount: 375 },
          { name: 'Trading', kolCount: 280 },
          { name: 'Gaming', kolCount: 170 }
        ],
        growthRate: 8.5,
        lastUpdated: new Date().toISOString()
      }
    };
  }
  
  /**
   * Get leaderboard of KOLs by different metrics
   */
  public async getLeaderboard(options: {
    metric: 'followers' | 'engagement' | 'content' | 'transactions';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    leaderboard: Array<{
      wallet: string;
      displayName?: string;
      avatar?: string;
      score: number;
      rank: number;
    }>;
    total: number;
  }>> {
    this.logger.debug('Getting leaderboard', { options });
    
    // This would make a real API call in production
    // Mock implementation for demo
    const { metric, limit = 10 } = options;
    
    return {
      success: true,
      data: {
        leaderboard: Array(limit).fill(0).map((_, i) => ({
          wallet: `C01NvXkGkLad${Math.random().toString(36).substring(2, 8)}`,
          displayName: `KOL_${i + 1}`,
          avatar: i % 3 === 0 ? `https://example.com/avatar${i}.png` : undefined,
          score: 100 - i * (90 / limit),
          rank: i + 1
        })),
        total: 1250
      }
    };
  }
} 