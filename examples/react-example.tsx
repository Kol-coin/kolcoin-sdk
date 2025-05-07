import React, { useState } from 'react';
import { KolcoinProvider, useKolcoinContext, KolcoinDashboard } from '..';

// Example App Component wrapping everything with the KolcoinProvider
function App() {
  return (
    <KolcoinProvider 
      apiKey="your-api-key"
      environment="development"
      logLevel="info"
      autoRetry={true}
      maxRetries={3}
      cacheTime={60000}
    >
      <div className="app">
        <h1>KOLCOIN SDK React Example</h1>
        <div className="container">
          {/* Basic Example */}
          <BasicExample />
          
          {/* Pre-built Dashboard Component */}
          <DashboardExample />
        </div>
      </div>
    </KolcoinProvider>
  );
}

// Basic example showcasing various hooks
function BasicExample() {
  // Get wallet address from state
  const [walletAddress, setWalletAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0);
  
  // Get Kolcoin hooks from context
  const { 
    useVerificationStatus, 
    useWhitelistStatus,
    useKolMetrics,
    useSendTokens,
    useKolcoinEvents
  } = useKolcoinContext();
  
  // Use hooks with the wallet address
  const { data: verificationData, isLoading: verificationLoading, error: verificationError } = 
    useVerificationStatus(walletAddress || null);
  
  const { data: whitelistData, isLoading: whitelistLoading } = 
    useWhitelistStatus(walletAddress || null);
  
  const { data: metricsData, isLoading: metricsLoading } = 
    useKolMetrics(walletAddress || null);
  
  // Token sending functionality
  const { sendTokens, isLoading: sendLoading, error: sendError, result } = useSendTokens();
  
  // Event subscription
  const { data: events } = useKolcoinEvents('verification.updated');
  
  // Handle form submission for sending tokens
  const handleSendTokens = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress && recipient && amount > 0) {
      sendTokens({
        from: walletAddress,
        to: recipient,
        amount: amount
      });
    }
  };
  
  return (
    <div className="basic-example">
      <h2>Basic SDK Integration</h2>
      
      {/* Wallet Input */}
      <div className="form-group">
        <label htmlFor="wallet">Wallet Address:</label>
        <input 
          type="text" 
          id="wallet" 
          value={walletAddress} 
          onChange={e => setWalletAddress(e.target.value)}
          placeholder="Enter wallet address"
        />
      </div>
      
      {/* Verification Status */}
      <div className="status-card">
        <h3>Verification Status</h3>
        {verificationLoading ? (
          <p>Loading...</p>
        ) : verificationError ? (
          <p className="error">Error: {verificationError.message}</p>
        ) : verificationData ? (
          <div>
            <p>Verified: {verificationData.verified ? 'Yes' : 'No'}</p>
            <p>Status: {verificationData.status}</p>
            {verificationData.tier && <p>Tier: {verificationData.tier}</p>}
            {verificationData.score && <p>Score: {verificationData.score}</p>}
          </div>
        ) : (
          <p>Not checked yet</p>
        )}
      </div>
      
      {/* Whitelist Status */}
      <div className="status-card">
        <h3>Whitelist Status</h3>
        {whitelistLoading ? (
          <p>Loading...</p>
        ) : whitelistData ? (
          <p>Whitelisted: {whitelistData.isWhitelisted ? 'Yes' : 'No'}</p>
        ) : (
          <p>Not checked yet</p>
        )}
      </div>
      
      {/* Metrics */}
      <div className="status-card">
        <h3>KOL Metrics</h3>
        {metricsLoading ? (
          <p>Loading...</p>
        ) : metricsData ? (
          <div>
            <p>Total Followers: {metricsData.followers.total}</p>
            <p>Engagement: {metricsData.engagement.averageRate}</p>
            <p>Content Score: {metricsData.content.overallScore}</p>
          </div>
        ) : (
          <p>No metrics available</p>
        )}
      </div>
      
      {/* Send Tokens Form */}
      <div className="form-card">
        <h3>Send Tokens</h3>
        <form onSubmit={handleSendTokens}>
          <div className="form-group">
            <label htmlFor="recipient">Recipient:</label>
            <input 
              type="text" 
              id="recipient" 
              value={recipient} 
              onChange={e => setRecipient(e.target.value)}
              placeholder="Recipient address"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input 
              type="number" 
              id="amount" 
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              min="0"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!walletAddress || !recipient || amount <= 0 || sendLoading}
          >
            {sendLoading ? 'Sending...' : 'Send Tokens'}
          </button>
          
          {result && (
            <div className="result">
              <p>Transaction ID: {result.transactionId}</p>
              <p>Status: {result.status}</p>
            </div>
          )}
          
          {sendError && (
            <p className="error">Error: {sendError.message}</p>
          )}
        </form>
      </div>
      
      {/* Events */}
      <div className="events-card">
        <h3>Verification Events</h3>
        {events.length === 0 ? (
          <p>No events received yet</p>
        ) : (
          <ul>
            {events.map((event, index) => (
              <li key={index}>
                {new Date(event.timestamp).toLocaleString()}: {JSON.stringify(event.data)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Example using the pre-built dashboard component
function DashboardExample() {
  const [walletAddress, setWalletAddress] = useState('');
  
  return (
    <div className="dashboard-example">
      <h2>Pre-built Dashboard Component</h2>
      
      <div className="form-group">
        <label htmlFor="dashboardWallet">Wallet Address:</label>
        <input 
          type="text" 
          id="dashboardWallet" 
          value={walletAddress} 
          onChange={e => setWalletAddress(e.target.value)}
          placeholder="Enter wallet address"
        />
      </div>
      
      {walletAddress ? (
        <KolcoinDashboard wallet={walletAddress} />
      ) : (
        <p>Enter a wallet address to view the dashboard</p>
      )}
    </div>
  );
}

export default App; 