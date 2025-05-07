// Kolcoin/context/KolcoinProvider.tsx
// React context provider for Kolcoin SDK

import React, { createContext, useContext, ReactNode } from 'react';
import { useKolcoin } from '../hooks/useKolcoin';
import { SdkConfig } from '../types';

// Default API key for initialization - would be replaced in production
const DEFAULT_API_KEY = 'demo_api_key_for_testing_only';

interface KolcoinProviderProps {
  apiKey?: string;
  environment?: SdkConfig['apiCredentials']['environment'];
  children: ReactNode;
  logLevel?: SdkConfig['logLevel'];
  autoRetry?: boolean;
  maxRetries?: number;
  cacheTime?: number;
}

// Create context with undefined initial value
// The real value will be provided by the KolcoinProvider
const KolcoinContext = createContext<ReturnType<typeof useKolcoin> | undefined>(undefined);

/**
 * Provider component for Kolcoin SDK
 * Gives access to all Kolcoin SDK functionality through React Context
 */
export const KolcoinProvider: React.FC<KolcoinProviderProps> = ({
  apiKey = DEFAULT_API_KEY,
  environment = 'development',
  children,
  logLevel = 'error',
  autoRetry = true,
  maxRetries = 3,
  cacheTime = 60000
}) => {
  // Initialize SDK hooks
  const kolcoin = useKolcoin({
    apiKey,
    environment,
    logLevel,
    autoRetry,
    maxRetries,
    cacheTime
  });
  
  return (
    <KolcoinContext.Provider value={kolcoin}>
      {children}
    </KolcoinContext.Provider>
  );
};

/**
 * Hook to access the Kolcoin SDK context
 * @throws Error if used outside of KolcoinProvider
 */
export const useKolcoinContext = () => {
  const context = useContext(KolcoinContext);
  
  if (context === undefined) {
    throw new Error('useKolcoinContext must be used within a KolcoinProvider');
  }
  
  return context;
}; 