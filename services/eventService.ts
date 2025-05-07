// Kolcoin/services/eventService.ts
// Event handling service for Kolcoin

import { EventType, EventListener } from '../types';
import { Logger } from '../utils/logger';

interface EventServiceOptions {
  logger?: Logger;
  useLocalStorage?: boolean;
}

/**
 * KolcoinEventService - Handles event subscription, publishing, and persistence
 */
export class KolcoinEventService {
  private listeners: Map<EventType, Set<(data: any) => void>> = new Map();
  private eventHistory: Map<EventType, Array<{ timestamp: number; data: any }>> = new Map();
  private readonly historyLimit: number = 50;
  private logger: Logger;
  private useLocalStorage: boolean;
  
  constructor(options: EventServiceOptions = {}) {
    this.logger = options.logger || new Logger({ context: { service: 'KolcoinEventService' } });
    this.useLocalStorage = options.useLocalStorage !== false && typeof window !== 'undefined';
    
    // Load event history from localStorage if available
    if (this.useLocalStorage) {
      try {
        const savedHistory = localStorage.getItem('kolcoin_event_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          for (const [eventType, events] of Object.entries(parsed)) {
            this.eventHistory.set(eventType as EventType, events as Array<{ timestamp: number; data: any }>);
          }
        }
      } catch (error) {
        this.logger.warn('Failed to load event history from localStorage', { error });
      }
    }
    
    // Setup websocket connection for live events
    this.setupWebSocketConnection();
  }
  
  /**
   * Setup WebSocket connection for real-time events
   */
  private setupWebSocketConnection(): void {
    // This would be implemented with a real WebSocket connection in production
    this.logger.debug('WebSocket connection would be established here in production');
    
    // Mock implementation for demo purposes
    const mockEventTypes: EventType[] = [
      'verification.updated',
      'whitelist.added',
      'transaction.sent',
      'transaction.received'
    ];
    
    // Simulate occasional events
    setInterval(() => {
      const randomEvent = mockEventTypes[Math.floor(Math.random() * mockEventTypes.length)];
      const mockData = this.generateMockEventData(randomEvent);
      
      this.logger.debug('Received mock WebSocket event', { type: randomEvent });
      this.processReceivedEvent(randomEvent, mockData);
    }, 15000); // Every 15 seconds
  }
  
  /**
   * Generates mock event data for simulation
   */
  private generateMockEventData(eventType: EventType): any {
    const timestamp = new Date().toISOString();
    const mockWallet = 'C01NvXkGkLadF2VDDaTZMPwVbYUAaQV8e5hJ3HEV9xLc';
    
    switch (eventType) {
      case 'verification.updated':
        return {
          wallet: mockWallet,
          verified: true,
          status: 'active',
          tier: 'influencer',
          verifiedAt: timestamp
        };
        
      case 'whitelist.added':
        return {
          wallet: mockWallet,
          whitelistedAt: timestamp,
          eligibleForTokens: true
        };
        
      case 'transaction.sent':
      case 'transaction.received':
        return {
          transactionId: `tx_${Math.random().toString(36).substring(2, 10)}`,
          from: mockWallet,
          to: 'D3fkqY2SWNEgpdVZBsLYJgtVvDJYk17gVzQmYJ8LZHbP',
          amount: Math.floor(Math.random() * 10000),
          timestamp
        };
        
      case 'metrics.updated':
        return {
          wallet: mockWallet,
          followers: {
            twitter: 1500 + Math.floor(Math.random() * 100),
            total: 2000 + Math.floor(Math.random() * 500)
          },
          engagement: {
            averageRate: 2.5 + Math.random()
          },
          timestamp
        };
        
      default:
        return { timestamp };
    }
  }
  
  /**
   * Process an event received from WebSocket or other sources
   */
  private processReceivedEvent(eventType: EventType, data: any): void {
    // Store in history
    this.addToEventHistory(eventType, data);
    
    // Notify listeners
    this.notifyListeners(eventType, data);
  }
  
  /**
   * Adds an event to the history, with limits and persistence
   */
  private addToEventHistory(eventType: EventType, data: any): void {
    const events = this.eventHistory.get(eventType) || [];
    const entry = { timestamp: Date.now(), data };
    
    // Add to start for most recent first
    events.unshift(entry);
    
    // Limit the history size
    if (events.length > this.historyLimit) {
      events.length = this.historyLimit;
    }
    
    this.eventHistory.set(eventType, events);
    
    // Persist to localStorage if enabled
    if (this.useLocalStorage) {
      try {
        const historyObject: Record<string, any> = {};
        for (const [type, typeEvents] of this.eventHistory.entries()) {
          historyObject[type] = typeEvents;
        }
        localStorage.setItem('kolcoin_event_history', JSON.stringify(historyObject));
      } catch (error) {
        this.logger.warn('Failed to persist event history to localStorage', { error });
      }
    }
  }
  
  /**
   * Notifies all listeners for a specific event type
   */
  private notifyListeners(eventType: EventType, data: any): void {
    const typeListeners = this.listeners.get(eventType);
    if (!typeListeners) return;
    
    this.logger.debug(`Notifying ${typeListeners.size} listeners`, { eventType });
    
    for (const callback of typeListeners) {
      try {
        callback(data);
      } catch (error) {
        this.logger.error('Error in event listener callback', { 
          error, 
          eventType 
        });
      }
    }
  }
  
  /**
   * Subscribe to a specific event type
   */
  public on<T = any>(eventType: EventType, callback: (data: T) => void): () => void {
    let typeListeners = this.listeners.get(eventType);
    
    if (!typeListeners) {
      typeListeners = new Set();
      this.listeners.set(eventType, typeListeners);
    }
    
    typeListeners.add(callback as any);
    this.logger.debug(`Added listener for ${eventType}`, { 
      listenerCount: typeListeners.size 
    });
    
    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }
  
  /**
   * Unsubscribe from a specific event type
   */
  public off<T = any>(eventType: EventType, callback: (data: T) => void): void {
    const typeListeners = this.listeners.get(eventType);
    if (!typeListeners) return;
    
    typeListeners.delete(callback as any);
    
    if (typeListeners.size === 0) {
      this.listeners.delete(eventType);
    }
    
    this.logger.debug(`Removed listener for ${eventType}`, { 
      remainingCount: typeListeners.size 
    });
  }
  
  /**
   * Remove all listeners for a specific event type
   */
  public removeAllListeners(eventType?: EventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
      this.logger.debug(`Removed all listeners for ${eventType}`);
    } else {
      this.listeners.clear();
      this.logger.debug('Removed all event listeners');
    }
  }
  
  /**
   * Manually emit an event (mostly for testing)
   */
  public emit(eventType: EventType, data: any): void {
    this.logger.debug(`Manually emitting ${eventType}`, { data });
    this.processReceivedEvent(eventType, data);
  }
  
  /**
   * Get event history for a specific type
   */
  public getEventHistory<T = any>(eventType: EventType): Array<{ timestamp: number; data: T }> {
    return [...(this.eventHistory.get(eventType) || [])];
  }
  
  /**
   * Clear event history for a specific type or all types
   */
  public clearEventHistory(eventType?: EventType): void {
    if (eventType) {
      this.eventHistory.delete(eventType);
      this.logger.debug(`Cleared event history for ${eventType}`);
    } else {
      this.eventHistory.clear();
      this.logger.debug('Cleared all event history');
    }
    
    // Update localStorage if enabled
    if (this.useLocalStorage) {
      try {
        if (!eventType) {
          localStorage.removeItem('kolcoin_event_history');
        } else {
          const historyObject: Record<string, any> = {};
          for (const [type, events] of this.eventHistory.entries()) {
            if (type !== eventType) {
              historyObject[type] = events;
            }
          }
          localStorage.setItem('kolcoin_event_history', JSON.stringify(historyObject));
        }
      } catch (error) {
        this.logger.warn('Failed to update localStorage after clearing history', { error });
      }
    }
  }
} 