// Kolcoin/index.ts
// Main exports for the Kolcoin SDK

// Core SDK
export { KolcoinSDK } from './lib/KolcoinSDK';

// React integration
export { 
  KolcoinProvider, 
  useKolcoinContext 
} from './context/KolcoinProvider';
export { useKolcoin } from './hooks/useKolcoin';
export { KolcoinDashboard } from './components/KolcoinDashboard';

// Types
export * from './types';

// Utilities
export { logger } from './utils/logger';

// Individual services if needed directly
export { KolcoinApiService } from './services/apiService';
export { KolcoinEventService } from './services/eventService'; 