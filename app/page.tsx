'use client';
import { useState } from 'react';
import { 
  useAccount, 
  useBalance, 
  useToken, 
  usePublicClient 
} from 'wagmi';
import { 
  polygon, 
  mainnet, 
  polygonMumbai 
} from 'wagmi/chains'; // Fixed: Explicit chain imports [web:44]
import { formatEther, formatUnits, Address } from 'viem'; // Proper types [web:36]
import { OnchainKitProvider, CoinbaseSmartWalletProvider } from '@coinbase/onchainkit'; // From template [web:31]

const TEST_WALLET: Address = '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4' as Address; // Test addr w/ Polygon test assets [web:37]
const GAME_TOKEN = '0x2791Bca1f2aD161e1a43a2250A0fFfA4eD89b55d'; // Example game token (USDC Mumbai) [web:43]

export default function Home() {
  const [demoMode, setDemoMode] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(polygon.id); // Fixed: Numeric ID [web:35]

  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: selectedChainId });

  // Type-safe balance hook: specify chainId explicitly [web:42]
  const {  balanceData } = useBalance({
    address: demoMode ? TEST_WALLET : address,
    chainId: selectedChainId,
    watch: true,
  });

  // Type-safe ERC20 token data
  const {  tokenData } = useToken({
    address: GAME_TOKEN as Address,
    chainId: selectedChainId,
  });

  const chains = [polygon, polygonMumbai, mainnet]; // Fixed: Defined chains array for multi-chain [web:44]

  const switchChain = (chainId: number) => {
    setSelectedChainId(chainId);
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
            
            {/* Demo Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="mb-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {demoMode ? 'Use Real Wallet' : `Demo w/ Test Wallet (${TEST_WALLET.slice(0,6)}...`)}
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
                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600">
                  Export Clips
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600">
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