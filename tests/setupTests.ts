// This file contains setup for Jest tests

// Make process.env available in tests
declare global {
  var process: {
    env: {
      NODE_ENV: string;
      [key: string]: string | undefined;
    };
  };
}

// Set up test environment
process.env.NODE_ENV = 'test';

// This is needed for Jest to work with TypeScript
export {};

// Create global fetch mock
declare global {
  namespace NodeJS {
    interface Global {
      fetch: any;
    }
  }
}

// No need to import jest or use global - Jest will automatically define these in the test environment 