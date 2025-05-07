// Kolcoin/utils/logger.ts
// Logging utility for Kolcoin SDK

import { SdkConfig } from '../types';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEvent {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

/**
 * Maps string log levels to enum values
 */
const LOG_LEVEL_MAP: Record<NonNullable<SdkConfig['logLevel']>, LogLevel> = {
  'error': LogLevel.ERROR,
  'warn': LogLevel.WARN,
  'info': LogLevel.INFO,
  'debug': LogLevel.DEBUG
};

/**
 * A sophisticated logger for the Kolcoin SDK with support for log levels,
 * contexts, and custom formatters.
 */
export class Logger {
  private level: LogLevel;
  private history: LogEvent[] = [];
  private historyLimit: number;
  private context: Record<string, any> = {};
  private enableConsole: boolean;
  private formatter: (event: LogEvent) => string;
  private listeners: ((event: LogEvent) => void)[] = [];

  constructor(options: {
    level?: SdkConfig['logLevel'];
    historyLimit?: number;
    context?: Record<string, any>;
    enableConsole?: boolean;
    formatter?: (event: LogEvent) => string;
  } = {}) {
    this.level = LOG_LEVEL_MAP[options.level || 'info'] || LogLevel.INFO;
    this.historyLimit = options.historyLimit || 100;
    this.context = options.context || {};
    this.enableConsole = options.enableConsole !== false;
    this.formatter = options.formatter || this.defaultFormatter;
  }

  /**
   * Sets the current log level
   */
  setLevel(level: SdkConfig['logLevel']) {
    this.level = LOG_LEVEL_MAP[level || 'info'] || LogLevel.INFO;
  }

  /**
   * Updates the global context data
   */
  setContext(context: Record<string, any>) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clears the context data
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Default formatter for log events
   */
  private defaultFormatter(event: LogEvent): string {
    const { timestamp, level, message, context } = event;
    const levelName = LogLevel[level];
    
    let formatted = `[${timestamp}] [${levelName}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      try {
        formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
      } catch (e) {
        formatted += `\nContext: [Error serializing context]`;
      }
    }
    
    return formatted;
  }

  /**
   * Creates a log event
   */
  private createLogEvent(level: LogLevel, message: string, context?: Record<string, any>): LogEvent {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...(context || {}) }
    };
  }

  /**
   * Records and processes a log event
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (level > this.level) return;

    const event = this.createLogEvent(level, message, context);
    
    // Add to history with limit
    this.history.push(event);
    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }
    
    // Output to console if enabled
    if (this.enableConsole) {
      const formatted = this.formatter(event);
      switch (level) {
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
      }
    }
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in log listener:', e);
      }
    });
  }

  /**
   * Logs an error message
   */
  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Logs a warning message
   */
  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an info message
   */
  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a debug message
   */
  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Returns the log history
   */
  getHistory(): LogEvent[] {
    return [...this.history];
  }

  /**
   * Clears the log history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Adds a listener for log events
   */
  addListener(listener: (event: LogEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Removes all listeners
   */
  removeAllListeners() {
    this.listeners = [];
  }

  /**
   * Creates a child logger with inherited settings and extended context
   */
  createChild(name: string, extraContext?: Record<string, any>): Logger {
    const childLogger = new Logger({
      level: Object.entries(LOG_LEVEL_MAP).find(([_, value]) => value === this.level)?.[0] as SdkConfig['logLevel'],
      historyLimit: this.historyLimit,
      context: { ...this.context, logger: name, ...(extraContext || {}) },
      enableConsole: this.enableConsole,
      formatter: this.formatter
    });
    
    // Add parent as a listener to collect child logs
    childLogger.addListener((event) => {
      this.history.push(event);
      if (this.history.length > this.historyLimit) {
        this.history.shift();
      }
    });
    
    return childLogger;
  }
}

// Default logger instance
export const logger = new Logger(); 