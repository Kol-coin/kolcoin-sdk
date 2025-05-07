import { KolcoinSDK } from '../lib/KolcoinSDK';
import { ApiResponse, TransactionParams } from '../types';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the API service and event service
jest.mock('../services/apiService', () => {
  return {
    KolcoinApiService: jest.fn().mockImplementation(() => ({
      checkVerificationStatus: jest.fn().mockResolvedValue({
        success: true,
        data: {
          verified: true,
          status: 'active',
          tier: 'influencer',
          verifiedAt: '2025-05-01T00:00:00Z',
          expiresAt: '2025-05-01T00:00:00Z',
          score: 85
        }
      }),
      checkWhitelistStatus: jest.fn().mockResolvedValue({
        success: true,
        data: {
          isWhitelisted: true,
          whitelistedAt: '2025-05-02T00:00:00Z',
          eligibleForTokens: true,
          remainingAllocation: 75000,
          transactionCount: 5
        }
      }),
      getKolMetrics: jest.fn().mockResolvedValue({
        success: true,
        data: {
          followers: {
            twitter: 2500,
            youtube: 1800,
            discord: 900,
            telegram: 750,
            total: 5950
          },
          engagement: {
            averageRate: 3.8,
            weeklyPosts: 12,
            commentQuality: 78,
            overallScore: 82
          },
          content: {
            educationalValue: 75,
            analysisDepth: 80,
            communityBuilding: 85,
            overallScore: 80
          },
          historicalPerformance: []
        }
      }),
      transferTokens: jest.fn().mockResolvedValue({
        success: true,
        data: {
          success: true,
          transactionId: 'tx_mockId',
          timestamp: '2025-05-01T12:00:00Z',
          status: 'confirmed'
        }
      }),
      cancelAllRequests: jest.fn()
    }))
  };
});

jest.mock('../services/eventService', () => {
  return {
    KolcoinEventService: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnValue(() => {}),
      off: jest.fn(),
      emit: jest.fn(),
      getEventHistory: jest.fn().mockReturnValue([]),
      removeAllListeners: jest.fn()
    }))
  };
});

jest.mock('../utils/logger', () => {
  return {
    Logger: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn().mockReturnThis()
    }))
  };
});

describe('KolcoinSDK', () => {
  let sdk: KolcoinSDK;
  
  beforeEach(() => {
    // Create new SDK instance before each test
    sdk = new KolcoinSDK({
      apiCredentials: {
        apiKey: 'test-api-key',
        environment: 'development'
      }
    });
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Cleanup after each test
    sdk.dispose();
  });
  
  describe('Verification Module', () => {
    it('should check verification status', async () => {
      const wallet = 'testWalletAddress';
      const result = await sdk.verification.checkStatus(wallet);
      
      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
      expect(result.data?.tier).toBe('influencer');
    });
    
    it('should emit verification events', () => {
      const eventCallback = jest.fn();
      const eventData = { status: 'verified', wallet: 'testWallet' };
      
      // Subscribe to event
      const unsubscribe = sdk.on('verification.updated', eventCallback);
      
      // Emit event (for testing)
      sdk.verification.emitVerificationUpdate(eventData);
      
      // Assertions
      expect(eventCallback).toHaveBeenCalledWith(eventData);
      
      // Unsubscribe and ensure no more calls
      unsubscribe();
      sdk.verification.emitVerificationUpdate({ status: 'rejected' });
      expect(eventCallback).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Whitelist Module', () => {
    it('should check whitelist status', async () => {
      const wallet = 'testWalletAddress';
      const result = await sdk.whitelist.checkStatus(wallet);
      
      expect(result.success).toBe(true);
      expect(result.data?.isWhitelisted).toBe(true);
      expect(result.data?.eligibleForTokens).toBe(true);
    });
    
    it('should get token allocation', async () => {
      const wallet = 'testWalletAddress';
      const result = await sdk.whitelist.getAllocation(wallet);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.totalAllocation).toBeGreaterThan(0);
        expect(result.data.remaining).toBeDefined();
      }
    });
  });
  
  describe('Transaction Module', () => {
    it('should send tokens successfully', async () => {
      const params: TransactionParams = {
        from: 'senderWallet',
        to: 'recipientWallet',
        amount: 1000,
        memo: 'Test transaction'
      };
      
      const result = await sdk.transactions.send(params);
      
      expect(result.success).toBe(true);
      expect(result.data?.transactionId).toBe('tx_mockId');
      expect(result.data?.status).toBe('confirmed');
    });
    
    it('should get transaction history', async () => {
      const wallet = 'testWalletAddress';
      const result = await sdk.transactions.getHistory(wallet);
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Metrics Module', () => {
    it('should get KOL metrics', async () => {
      const wallet = 'testWalletAddress';
      const result = await sdk.metrics.getKolMetrics(wallet);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.followers.total).toBeGreaterThan(0);
        expect(result.data.engagement.averageRate).toBeGreaterThan(0);
      }
    });
    
    it('should get community metrics', async () => {
      const result = await sdk.metrics.getCommunityMetrics();
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.totalKols).toBeDefined();
        expect(result.data.growthRate).toBeDefined();
      }
    });
  });
  
  describe('Event handling', () => {
    it('should subscribe to events', () => {
      const callback = jest.fn();
      const unsubscribe = sdk.on('transaction.sent', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should unsubscribe from events', () => {
      const callback = jest.fn();
      sdk.on('transaction.sent', callback);
      sdk.off('transaction.sent', callback);
      
      // This is just checking the API works, not actual functionality since we're mocking
    });
  });
  
  describe('SDK lifecycle', () => {
    it('should dispose properly', () => {
      sdk.dispose();
      
      // Add assertions for cleanup if needed
    });
  });
}); 