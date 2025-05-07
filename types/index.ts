// Kolcoin/types/index.ts
// Type definitions for the Kolcoin library

export type VerificationStatus = 'pending' | 'active' | 'rejected' | 'expired';

export type KolTier = 'beginner' | 'influencer' | 'authority' | 'celebrity';

export interface VerificationResult {
  verified: boolean;
  status: VerificationStatus;
  tier?: KolTier;
  verifiedAt?: string;
  expiresAt?: string;
  score?: number;
  failureReason?: string;
}

export interface WhitelistStatus {
  isWhitelisted: boolean;
  whitelistedAt?: string;
  eligibleForTokens: boolean;
  remainingAllocation?: number;
  transactionCount?: number;
}

export interface KolMetrics {
  followers: {
    twitter: number;
    youtube: number;
    discord: number;
    telegram: number;
    total: number;
  };
  engagement: {
    averageRate: number;
    weeklyPosts: number;
    commentQuality: number;
    overallScore: number;
  };
  content: {
    educationalValue: number;
    analysisDepth: number;
    communityBuilding: number;
    overallScore: number;
  };
  historicalPerformance: Array<{
    timestamp: string;
    followers: number;
    engagement: number;
    contentScore: number;
  }>;
}

export interface ApiCredentials {
  apiKey: string;
  environment: 'mainnet' | 'testnet' | 'development';
  version?: string;
}

export interface TransactionParams {
  from: string;
  to: string;
  amount: number;
  memo?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  timestamp?: string;
  status?: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export type ApiEndpoint = 
  | '/verification/status'
  | '/whitelist/check'
  | '/token/balance'
  | '/token/transfer'
  | '/metrics/kol'
  | '/metrics/community';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiRequestConfig {
  endpoint: ApiEndpoint;
  method: HttpMethod;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export type EventType = 
  | 'verification.updated'
  | 'whitelist.added'
  | 'transaction.sent'
  | 'transaction.received'
  | 'token.allocated'
  | 'metrics.updated';

export interface EventListener<T = any> {
  eventType: EventType;
  callback: (data: T) => void;
}

export interface SdkConfig {
  apiCredentials: ApiCredentials;
  autoRetry?: boolean;
  maxRetries?: number;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  cacheTime?: number;
} 