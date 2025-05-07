import { KolcoinSDK } from '../lib/KolcoinSDK';

// Initialize the SDK
const sdk = new KolcoinSDK({
  apiCredentials: {
    apiKey: 'your-api-key-here',
    environment: 'development'
  },
  logLevel: 'info'
});

// Example: Check verification status for a wallet
async function checkVerificationStatus() {
  try {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const response = await sdk.verification.checkStatus(walletAddress);
    console.log(`Verification status for ${walletAddress}: ${response.success ? JSON.stringify(response.data) : 'Error'}`);
    return response;
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
}

// Example: Check whitelist status for a wallet
async function checkWhitelistStatus() {
  try {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const response = await sdk.whitelist.checkStatus(walletAddress);
    console.log(`Whitelist status for ${walletAddress}: ${response.success ? 
      (response.data?.isWhitelisted ? 'Whitelisted' : 'Not whitelisted') : 'Error'}`);
    return response;
  } catch (error) {
    console.error('Error checking whitelist status:', error);
    throw error;
  }
}

// Example: Subscribe to verification events
function subscribeToVerificationEvents() {
  const unsubscribe = sdk.on('verification.updated', (event: any) => {
    console.log('Received verification event:', event);
    
    // Example of how to unsubscribe after receiving an event
    if (event.status === 'verified') {
      console.log('Unsubscribing from verification events');
      unsubscribe();
    }
  });
  
  console.log('Subscribed to verification events');
  
  // The unsubscribe function can be called later when no longer needed
  return unsubscribe;
}

// Example: Send tokens to another wallet
async function sendTokens() {
  try {
    const recipientWallet = '0xabcdef1234567890abcdef1234567890abcdef12';
    const amount = 100;
    
    const result = await sdk.transactions.send({
      from: '0x1234567890abcdef1234567890abcdef12345678', // Sender wallet
      to: recipientWallet,
      amount: amount
    });
    
    console.log('Token transfer result:', result);
    return result;
  } catch (error) {
    console.error('Error sending tokens:', error);
    throw error;
  }
}

// Example: Get transaction history
async function getTransactionHistory() {
  try {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const options = {
      limit: 10,
      offset: 0,
      type: 'all' as const
    };
    
    const history = await sdk.transactions.getHistory(walletAddress, options);
    console.log('Transaction history:', history);
    return history;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

// Example: Get KOL metrics
async function getKolMetrics() {
  try {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const metrics = await sdk.metrics.getKolMetrics(walletAddress);
    console.log('KOL metrics:', metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching KOL metrics:', error);
    throw error;
  }
}

// Run examples
async function runExamples() {
  try {
    console.log('--- Running SDK Examples ---');
    
    // Subscribe to events before making API calls
    const unsubscribe = subscribeToVerificationEvents();
    
    // Run API calls
    await checkVerificationStatus();
    await checkWhitelistStatus();
    await sendTokens();
    await getTransactionHistory();
    await getKolMetrics();
    
    // Cleanup
    unsubscribe();
    sdk.dispose();
    
    console.log('--- Examples Complete ---');
  } catch (error) {
    console.error('Error in examples:', error);
  }
}

// Run all examples
runExamples(); 