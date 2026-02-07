'use client';
'import { useState } from 'react';
'import axios from 'axios';
'import { 
  useAccount, 
  useBalance, 
  useToken, 
  usePublicClient 
} from 'wagmi';
'import { 
  polygon, 
  mainnet, 
  polygonMumbai 
} from 'wagmi/chains'; // Fixed: Explicit chain imports [web:44]
'import { formatEther, formatUnits, Address } from 'viem'; // Proper types [web:36]
'const TEST_WALLET: Address = '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4' as Address; // Test addr w/ Polygon test assets [web:37]
const GAME_TOKEN = '0x2791Bca1f2aD161e1a43a2250A0fFfA4eD89b55d'; // Example game token (USDC Mumbai) [web:43]

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

// Warn if using fallback URL
if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn('⚠️ NEXT_PUBLIC_APP_URL not set, using fallback:', API_BASE_URL);
}

'export default function Home() {
  const [demoMode, setDemoMode] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(polygon.id); // Fixed: Numeric ID [web:35]
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { address } = useAccount();

  // Type-safe balance hook: specify chainId explicitly [web:42]
  const { data: balanceData } = useBalance({
    address: demoMode ? TEST_WALLET : address,
    chainId: selectedChainId,
    watch: true,
  });

  // Type-safe ERC20 token data
  const { data: tokenData } = useToken({
    address: GAME_TOKEN as Address,
    chainId: selectedChainId,
  });

  const chains = [polygon, polygonMumbai, mainnet]; // Fixed: Defined chains array for multi-chain [web:44]

  const switchChain = (chainId: number) => {
    console.log('🔗 Switching chain to:', chainId);
    setSelectedChainId(chainId);
  };

  // Handler for Seed Games button
  const handleSeedGames = async () => {
    try {
      console.log('🌱 Seed Games button clicked');
      setLoading('Seeding games...');
      setError(null);
      setSuccessMessage(null);

      const response = await axios.post(`${API_BASE_URL}/api/games/seed`);
      
      console.log('✅ Games seeded successfully:', response.data);
      setSuccessMessage(`Successfully seeded ${response.data.count} games!`);
    } catch (err) {
      console.error('❌ Error seeding games:', err);
      setError(err instanceof Error ? err.message : 'Failed to seed games');
    } finally {
      setLoading(null);
    }
  };

  // Handler for Get Token Balances button
  const handleGetBalances = async () => {
    try {
      const walletAddress = demoMode ? TEST_WALLET : address;
      if (!walletAddress) {
        console.log('❌ No wallet address available');
        setError('Please connect wallet first');
        return;
      }

      console.log('💰 Get Token Balances button clicked');
      console.log('🔗 Wallet:', walletAddress);
      console.log('🔗 Chain:', selectedChainId);
      
      setLoading('Fetching balances...');
      setError(null);
      setSuccessMessage(null);

      const response = await axios.post(`${API_BASE_URL}/api/alchemy/get-token-balances`, {
        address: walletAddress,
        chainId: selectedChainId
      });
      
      console.log('✅ Balances fetched:', response.data);
      setSuccessMessage(`Found ${response.data.totalCount} token balances!`);
    } catch (err) {
      console.error('❌ Error fetching balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setLoading(null);
    }
  };

  // Handler for Setup Webhook button
  const handleSetupWebhook = async () => {
    try {
      console.log('🔗 Setup Webhook button clicked');
      setLoading('Setting up webhook...');
      setError(null);
      setSuccessMessage(null);

      // Use some example game contracts
      const contractAddresses = [
        '0x3845badade8e6dff049820680d1f14bd3903a5d0', // The Sandbox
        '0xccC8cb5229B0ac8069C51fd58367Fd1e622aFD97'  // Gods Unchained
      ];

      const response = await axios.post(`${API_BASE_URL}/api/alchemy/setup-webhook`, {
        contractAddresses,
        chainId: selectedChainId
      });
      
      console.log('✅ Webhook setup response:', response.data);
      setSuccessMessage('Webhook configuration prepared! Check console for instructions.');
    } catch (err) {
      console.error('❌ Error setting up webhook:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup webhook');
    } finally {
      setLoading(null);
    }
  };

  // Handler for Test Webhook button
  const handleTestWebhook = async () => {
    try {
      const walletAddress = demoMode ? TEST_WALLET : address;
      if (!walletAddress) {
        console.log('❌ No wallet address available');
        setError('Please connect wallet first');
        return;
      }

      console.log('🧪 Test Webhook button clicked');
      console.log('🔗 Wallet:', walletAddress);
      
      setLoading('Testing webhook...');
      setError(null);
      setSuccessMessage(null);

      const response = await axios.post(`${API_BASE_URL}/api/webhooks/test`, {
        walletAddress,
        contractAddress: '0x3845badade8e6dff049820680d1f14bd3903a5d0', // The Sandbox
        chainId: 1
      });
      
      console.log('✅ Test webhook complete:', response.data);
      setSuccessMessage('Test webhook sent successfully! Check console for details.');
    } catch (err) {
      console.error('❌ Error testing webhook:', err);
      setError(err instanceof Error ? err.message : 'Failed to test webhook');
    } finally {
      setLoading(null);
    }
  };

  // Handler for Check Config button
  const handleCheckConfig = async () => {
    try {
      console.log('🔧 Check Config button clicked');
      setLoading('Checking config...');
      setError(null);
      setSuccessMessage(null);

      const response = await axios.get(`${API_BASE_URL}/api/config`);
      
      console.log('✅ Config checked:', response.data);
      setSuccessMessage(`Config OK! Webhook URL: ${response.data.webhookURL}`);
    } catch (err) {
      console.error('❌ Error checking config:', err);
      setError(err instanceof Error ? err.message : 'Failed to check config');
    } finally {
      setLoading(null);
    }
  };

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY || ''}
      chains={chains} // Fixed: Pass chains prop [web:38]
    >
      <CoinbaseSmartWalletProvider>
        <main className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">
              Potentia_Ludi: Universal Gaming Wallet Hub
            </h1>
            
            {/* Status Messages */}
            {loading && (
              <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
                <p className="text-blue-200">⏳ {loading}</p>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-200">❌ {error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                <p className="text-green-200">✅ {successMessage}</p>
              </div>
            )}

            {/* Demo Toggle */}
            <button
              onClick={() => {
                console.log('🔄 Demo mode toggled');
                setDemoMode(!demoMode);
              }}
              className="mb-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {demoMode ? 'Use Real Wallet' : `Demo w/ Test Wallet (${TEST_WALLET.slice(0,6)}...)`}
            </button>

            {/* Chain Selector - Fixed IDs */}
            <div className="mb-8 flex gap-2">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => switchChain(chain.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedChainId === chain.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {chain.name}
                </button>
              ))}
            </div>

            {/* Functions API Buttons */}
            <div className="mb-8 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">🎮 Functions API</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={handleCheckConfig}
                  disabled={!!loading}
                  className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  🔧 Check Config
                </button>
                
                <button
                  onClick={handleSeedGames}
                  disabled={!!loading}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  🌱 Seed Games
                </button>
                
                <button
                  onClick={handleGetBalances}
                  disabled={!!loading}
                  className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  💰 Get Balances
                </button>
                
                <button
                  onClick={handleSetupWebhook}
                  disabled={!!loading}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  🔗 Setup Webhook
                </button>
                
                <button
                  onClick={handleTestWebhook}
                  disabled={!!loading}
                  className="px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  🧪 Test Webhook
                </button>
              </div>
            </div>

            {/* Wallet Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Native Balance */}
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Native Balance</h3>
                <p className="text-3xl font-bold text-cyan-400">
                  {balanceData ? `${Number(formatEther(balanceData.value)).toFixed(4)} ${chains.find(c => c.id === selectedChainId)?.nativeCurrency?.symbol}` : 'Loading...'}
                </p>
                <p className="text-sm text-gray-300 mt-1">{demoMode ? TEST_WALLET : address?.slice(0,6)}...</p>
              </div>

              {/* Game Token Balance */}
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Game Token (USDC)</h3>
                <p className="text-3xl font-bold text-emerald-400">
                  {tokenData ? `${Number(formatUnits(tokenData.value || 0n, 6)).toFixed(2)}` : '0.00'}
                </p>
                <p className="text-sm text-gray-300">{GAME_TOKEN.slice(0,6)}...</p>
              </div>

              {/* NFT Count Placeholder */}
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">NFTs Owned</h3>
                <p className="text-3xl font-bold text-purple-400">12</p> {/* Mock; add Alchemy NFT API */}
                <p className="text-sm text-gray-300">Across games</p>
              </div>
            </div>

            {/* Creator Stats Card */}
            <div className="mt-12 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Creator Dashboard</h2>
              <p className="text-gray-300 mb-4">Total Earnings: $1,247.50 | Sessions: 42 | Highlights: 15</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => console.log('📤 Export Clips button clicked')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600"
                >
                  Export Clips
                </button>
                <button 
                  onClick={() => console.log('📋 Copy Referral button clicked')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600"
                >
                  Copy Referral
                </button>
              </div>
            </div>
          </div>
        </main>
      </CoinbaseSmartWalletProvider>
    </OnchainKitProvider>
  );
}