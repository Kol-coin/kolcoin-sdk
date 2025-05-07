// Kolcoin/components/KolcoinDashboard.tsx
// Example dashboard component that uses the Kolcoin SDK

import React, { useState, useEffect } from 'react';
import { useKolcoinContext } from '../context/KolcoinProvider';

interface KolcoinDashboardProps {
  wallet?: string; // Optional wallet address
}

/**
 * Dashboard component demonstrating Kolcoin SDK usage
 */
export const KolcoinDashboard: React.FC<KolcoinDashboardProps> = ({ 
  wallet = 'C01NvXkGkLadF2VDDaTZMPwVbYUAaQV8e5hJ3HEV9xLc' // Default wallet for demo
}) => {
  const kolcoin = useKolcoinContext();
  const [activeTab, setActiveTab] = useState<'status' | 'metrics' | 'transactions' | 'events'>('status');
  
  // Use SDK hooks from the context
  const { 
    data: verificationData, 
    isLoading: verificationLoading, 
    error: verificationError 
  } = kolcoin.useVerificationStatus(wallet, { refetchInterval: 60000 });
  
  const { 
    data: whitelistData, 
    isLoading: whitelistLoading 
  } = kolcoin.useWhitelistStatus(wallet);
  
  const { 
    data: metricsData, 
    isLoading: metricsLoading 
  } = kolcoin.useKolMetrics(wallet);
  
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading 
  } = kolcoin.useTransactionHistory(wallet, { limit: 5 });
  
  const { 
    data: verificationEvents 
  } = kolcoin.useKolcoinEvents('verification.updated');
  
  const { 
    sendTokens, 
    isLoading: sendLoading 
  } = kolcoin.useSendTokens();
  
  const [amount, setAmount] = useState<string>('100');
  const [recipient, setRecipient] = useState<string>('');
  const [sendResult, setSendResult] = useState<string>('');
  
  // Event handlers
  const handleSendTokens = async () => {
    try {
      const response = await sendTokens({
        from: wallet,
        to: recipient,
        amount: parseFloat(amount),
        memo: 'Sent from Dashboard'
      });
      
      if (response.success) {
        setSendResult(`Success! Transaction ID: ${response.data?.transactionId}`);
      } else {
        setSendResult(`Error: ${response.error?.message}`);
      }
    } catch (error) {
      setSendResult(`Failed to send tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Render different tabs based on active selection
  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <div className="grid gap-4">
            <StatusCard 
              title="Verification Status" 
              loading={verificationLoading}
              error={verificationError}
            >
              {verificationData && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${verificationData.verified ? 'text-green-500' : 'text-red-500'}`}>
                      {verificationData.verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  {verificationData.verified && (
                    <>
                      <div className="flex justify-between">
                        <span>Level:</span>
                        <span className="font-medium">{verificationData.tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verified At:</span>
                        <span>{new Date(verificationData.verifiedAt || '').toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </StatusCard>
            
            <StatusCard 
              title="Whitelist Status" 
              loading={whitelistLoading}
            >
              {whitelistData && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Whitelisted:</span>
                    <span className={`font-medium ${whitelistData.isWhitelisted ? 'text-green-500' : 'text-red-500'}`}>
                      {whitelistData.isWhitelisted ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {whitelistData.isWhitelisted && (
                    <>
                      <div className="flex justify-between">
                        <span>Token Eligible:</span>
                        <span className={`font-medium ${whitelistData.eligibleForTokens ? 'text-green-500' : 'text-yellow-500'}`}>
                          {whitelistData.eligibleForTokens ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {whitelistData.whitelistedAt && (
                        <div className="flex justify-between">
                          <span>Whitelisted At:</span>
                          <span>{new Date(whitelistData.whitelistedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </StatusCard>
            
            <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-500/20">
              <h3 className="text-lg font-medium mb-4">Send Tokens</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Recipient Wallet</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter recipient wallet address"
                    className="w-full p-2 bg-black/30 border border-blue-500/30 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 bg-black/30 border border-blue-500/30 rounded"
                    min="1"
                  />
                </div>
                <button
                  onClick={handleSendTokens}
                  disabled={sendLoading || !recipient || !amount}
                  className="w-full py-2 bg-blue-600 rounded font-medium disabled:bg-gray-600"
                >
                  {sendLoading ? 'Sending...' : 'Send Tokens'}
                </button>
                {sendResult && (
                  <p className="text-sm mt-2">{sendResult}</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'metrics':
        return (
          <StatusCard 
            title="KOL Metrics" 
            loading={metricsLoading}
          >
            {metricsData && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Followers</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricItem label="Twitter" value={metricsData.followers.twitter} />
                    <MetricItem label="YouTube" value={metricsData.followers.youtube} />
                    <MetricItem label="Discord" value={metricsData.followers.discord} />
                    <MetricItem label="Telegram" value={metricsData.followers.telegram} />
                    <MetricItem label="Total" value={metricsData.followers.total} className="font-bold" />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Engagement</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricItem 
                      label="Average Rate" 
                      value={`${metricsData.engagement.averageRate.toFixed(2)}%`} 
                    />
                    <MetricItem 
                      label="Weekly Posts" 
                      value={metricsData.engagement.weeklyPosts} 
                    />
                    <MetricItem 
                      label="Comment Quality" 
                      value={metricsData.engagement.commentQuality} 
                    />
                    <MetricItem 
                      label="Overall Score" 
                      value={metricsData.engagement.overallScore} 
                      className="font-bold" 
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Content</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricItem 
                      label="Educational Value" 
                      value={metricsData.content.educationalValue} 
                    />
                    <MetricItem 
                      label="Analysis Depth" 
                      value={metricsData.content.analysisDepth} 
                    />
                    <MetricItem 
                      label="Community Building" 
                      value={metricsData.content.communityBuilding} 
                    />
                    <MetricItem 
                      label="Overall Score" 
                      value={metricsData.content.overallScore} 
                      className="font-bold" 
                    />
                  </div>
                </div>
              </div>
            )}
          </StatusCard>
        );
        
      case 'transactions':
        return (
          <StatusCard 
            title="Recent Transactions" 
            loading={transactionsLoading}
          >
            {transactionsData?.transactions && (
              <div className="space-y-3">
                {transactionsData.transactions.length === 0 ? (
                  <p>No transactions found</p>
                ) : (
                  transactionsData.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-black/20 rounded border border-blue-500/10">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs opacity-70">
                          {new Date(tx.timestamp).toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                          tx.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Amount:</span>
                        <span className="font-medium">
                          {tx.amount.toLocaleString()} KOLCOIN
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-sm">
                        <div>
                          <div className="opacity-70">From</div>
                          <div className="truncate">{tx.from}</div>
                        </div>
                        <div>
                          <div className="opacity-70">To</div>
                          <div className="truncate">{tx.to}</div>
                        </div>
                      </div>
                      {tx.memo && (
                        <div className="mt-2 text-sm opacity-70">
                          Memo: {tx.memo}
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {transactionsData.total > 5 && (
                  <div className="text-center">
                    <button className="text-sm text-blue-400 hover:underline">
                      View all {transactionsData.total} transactions
                    </button>
                  </div>
                )}
              </div>
            )}
          </StatusCard>
        );
        
      case 'events':
        return (
          <StatusCard 
            title="Recent Events" 
            loading={false}
          >
            <div className="space-y-3">
              <h4 className="font-medium">Verification Events</h4>
              {verificationEvents.length === 0 ? (
                <p className="text-sm opacity-70">No recent verification events</p>
              ) : (
                verificationEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-black/20 rounded border border-purple-500/10">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs opacity-70">
                        {new Date(event.verifiedAt || '').toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.verified ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {event.verified ? 'Verified' : 'Verification Failed'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="opacity-70">Wallet</div>
                      <div className="truncate">{event.wallet}</div>
                    </div>
                    {event.tier && (
                      <div className="mt-1 text-sm">
                        <span className="opacity-70">Tier: </span>
                        <span>{event.tier}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </StatusCard>
        );
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4 text-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          KOLCOIN Dashboard
        </h2>
        <p className="text-gray-300 mt-1">
          Connected wallet: <span className="font-mono">{wallet.substring(0, 8)}...{wallet.substring(wallet.length - 4)}</span>
        </p>
      </div>
      
      <div className="mb-6 flex border-b border-gray-700">
        <TabButton 
          active={activeTab === 'status'} 
          onClick={() => setActiveTab('status')}
        >
          Status
        </TabButton>
        <TabButton 
          active={activeTab === 'metrics'} 
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </TabButton>
        <TabButton 
          active={activeTab === 'transactions'} 
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </TabButton>
        <TabButton 
          active={activeTab === 'events'} 
          onClick={() => setActiveTab('events')}
        >
          Events
        </TabButton>
      </div>
      
      {renderTabContent()}
    </div>
  );
};

// Helper UI components
interface StatusCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, children, loading, error }) => {
  return (
    <div className="p-4 bg-gray-900/60 rounded-lg border border-blue-500/20">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded">
          Error: {error.message}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

interface MetricItemProps {
  label: string;
  value: number | string;
  className?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, className = '' }) => {
  return (
    <div className={`flex justify-between ${className}`}>
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium ${
        active 
          ? 'text-blue-400 border-b-2 border-blue-500' 
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}; 