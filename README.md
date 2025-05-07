<div align="center">
  <img src="https://via.placeholder.com/200x200.png?text=KOLCOIN+SDK" alt="KOLCOIN SDK Logo" width="200" height="200">
  <h1>KOLCOIN SDK</h1>
  <p>Official SDK for integrating with the KOLCOIN ecosystem</p>
  <p>
    <a href="https://www.npmjs.com/package/kolcoin-sdk"><img src="https://img.shields.io/npm/v/kolcoin-sdk.svg" alt="npm version"></a>
    <a href="https://github.com/kolcoin/kolcoin-sdk/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/kolcoin-sdk.svg" alt="license"></a>
    <a href="https://github.com/kolcoin/kolcoin-sdk/actions"><img src="https://github.com/kolcoin/kolcoin-sdk/workflows/CI/badge.svg" alt="build status"></a>
  </p>
</div>

## 📋 Overview

The KOLCOIN SDK provides developers with tools to integrate with the KOLCOIN ecosystem, a token platform designed for verified Key Opinion Leaders (KOLs) in the cryptocurrency space. This SDK simplifies building applications that interact with the KOLCOIN blockchain and API services.

## 🚀 Key Features

- **🔍 Verification Status**: Check if a wallet is verified as a KOL
- **📋 Whitelist Management**: Verify if wallets are whitelisted for transactions
- **💸 Transactions**: Send and claim tokens with built-in validation
- **📊 Metrics**: Access KOL performance metrics and analytics
- **📡 Event Subscription**: React to ecosystem events in real-time
- **⚛️ React Components**: Ready-to-use React components and hooks

## 📦 Installation

```bash
npm install kolcoin-sdk
```

or using yarn:

```bash
yarn add kolcoin-sdk
```

## 🔧 Getting Started

To use the KOLCOIN SDK, you'll need an API key. Sign up at [kolcoin.xyz](https://kolcoin.xyz) to get your API key.

### Basic SDK Usage

```typescript
import { KolcoinSDK } from 'kolcoin-sdk';

const sdk = new KolcoinSDK({
  apiKey: 'your-api-key',
  environment: 'production' // or 'development'
});

// Check verification status
sdk.verification.checkStatus('wallet-address')
  .then(status => console.log('Verification status:', status))
  .catch(error => console.error('Error:', error));

// Subscribe to verification events
const unsubscribe = sdk.onEvent('verification', (event) => {
  console.log('Verification event:', event);
});

// Clean up when done
sdk.dispose();
```

### React Integration

```tsx
import { KolcoinProvider, useKolcoinContext, KolcoinDashboard } from 'kolcoin-sdk';

function App() {
  return (
    <KolcoinProvider 
      apiKey="your-api-key"
      environment="production"
    >
      <YourApp />
    </KolcoinProvider>
  );
}

function YourApp() {
  const { 
    useVerificationStatus, 
    useWhitelistStatus,
    useSendTokens 
  } = useKolcoinContext();
  
  const { status, loading } = useVerificationStatus('wallet-address');
  const { isWhitelisted } = useWhitelistStatus('wallet-address');
  const { sendTokens, result, error } = useSendTokens();
  
  const handleSend = () => {
    sendTokens('recipient-address', 100);
  };
  
  return (
    <div>
      {loading ? (
        <p>Loading verification status...</p>
      ) : (
        <p>Verification status: {status}</p>
      )}
      <p>Whitelist status: {isWhitelisted ? 'Whitelisted' : 'Not whitelisted'}</p>
      <button onClick={handleSend}>Send 100 Tokens</button>
      
      {/* Or use the pre-built dashboard component */}
      <KolcoinDashboard walletAddress="wallet-address" />
    </div>
  );
}
```

## 📚 API Reference

### KolcoinSDK Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `apiKey` | `string` | Your API key for authentication | *Required* |
| `environment` | `'production'` \| `'development'` | API environment to use | `'production'` |
| `logLevel` | `'error'` \| `'warn'` \| `'info'` \| `'debug'` | Logging verbosity | `'error'` |
| `autoRetry` | `boolean` | Enable automatic retry on API failure | `true` |
| `maxRetries` | `number` | Maximum number of retry attempts | `3` |
| `cacheTime` | `number` | Duration in ms to cache API responses | `60000` |

### KolcoinProvider Props

The `KolcoinProvider` React component accepts the same options as the `KolcoinSDK` constructor.

## 🔄 Core Services

### Verification Service

```typescript
// Check if a wallet is verified
const status = await sdk.verification.checkStatus('wallet-address');

// Get verification details
const details = await sdk.verification.getDetails('wallet-address');

// Start verification process
await sdk.verification.requestVerification({
  walletAddress: 'wallet-address',
  email: 'kol@example.com',
  socialProfiles: {
    twitter: 'twitter-handle',
    youtube: 'channel-id'
  }
});
```

### Transaction Service

```typescript
// Send tokens
await sdk.transactions.send({
  recipient: 'recipient-address',
  amount: 100,
  message: 'Thanks for the content!'
});

// Claim tokens
await sdk.transactions.claim({
  transactionId: 'tx-id'
});

// Get transaction history
const history = await sdk.transactions.getHistory('wallet-address', {
  page: 1,
  limit: 10,
  type: 'send' // 'send', 'receive', or 'claim'
});
```

### Whitelist Service

```typescript
// Check if address is whitelisted
const isWhitelisted = await sdk.whitelist.checkStatus('wallet-address');

// Apply for whitelist
await sdk.whitelist.apply('wallet-address', {
  reason: 'I am a content creator with 10k+ followers'
});
```

### Metrics Service

```typescript
// Get KOL metrics
const metrics = await sdk.metrics.getKolMetrics('wallet-address');

// Get ecosystem metrics
const ecosystemMetrics = await sdk.metrics.getEcosystemMetrics();
```

## 🔄 Advanced Usage

### Custom Event Handling

```typescript
import { KolcoinSDK, EventType } from 'kolcoin-sdk';

const sdk = new KolcoinSDK({ apiKey: 'your-api-key' });

// Listen to multiple event types
const eventTypes: EventType[] = ['verification', 'transaction', 'whitelist'];
eventTypes.forEach(type => {
  sdk.onEvent(type, (event) => {
    console.log(`${type} event:`, event);
  });
});
```

### Error Handling

```typescript
try {
  await sdk.transactions.send({
    recipient: 'recipient-address',
    amount: 100
  });
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough tokens to complete transaction');
  } else if (error.code === 'RECIPIENT_NOT_WHITELISTED') {
    console.error('Recipient is not whitelisted');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Custom HTTP Configuration

```typescript
const sdk = new KolcoinSDK({
  apiKey: 'your-api-key',
  httpConfig: {
    timeout: 10000, // 10 seconds
    headers: {
      'X-Custom-Header': 'value'
    },
    proxy: {
      host: 'proxy.example.com',
      port: 8080
    }
  }
});
```

## 📱 UI Components

The SDK provides ready-to-use React components:

- `<KolcoinButton />` - Button for token transactions
- `<KolcoinDashboard />` - Complete dashboard for KOL metrics
- `<KolcoinStatus />` - Displays verification status
- `<KolcoinTransactionHistory />` - Displays transaction history
- `<KolcoinWallet />` - Wallet component for managing tokens

Example:

```tsx
import { KolcoinDashboard, KolcoinWallet } from 'kolcoin-sdk';

function YourApp() {
  return (
    <div>
      <h1>My KOLCOIN App</h1>
      <KolcoinWallet walletAddress="wallet-address" />
      <KolcoinDashboard walletAddress="wallet-address" />
    </div>
  );
}
```

## 📋 TypeScript Support

The SDK is built with TypeScript and includes full type definitions:

```typescript
import { Transaction, KolVerificationStatus, KolMetrics } from 'kolcoin-sdk';

// Type-safe usage
const handleTransaction = (transaction: Transaction) => {
  console.log(`Received ${transaction.amount} tokens from ${transaction.sender}`);
};
```

## 🔗 Resources

- [API Documentation](https://docs.kolcoin.xyz/api)
- [SDK Documentation](https://docs.kolcoin.xyz/sdk)
- [Examples](https://github.com/kolcoin/kolcoin-sdk/tree/main/examples)
- [KOLCOIN Website](https://kolcoin.xyz)

## 🤝 Contributing

Contributions are welcome! Please check out our [contributing guidelines](CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 