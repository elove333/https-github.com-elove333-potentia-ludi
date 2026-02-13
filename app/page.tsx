export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Potentia Ludi
          </h1>
          <p className="text-xl text-gray-300">
            Conversational Web3 Wallet Hub - Powered by Natural Language Intents
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* SIWE Authentication */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">🔐 SIWE Auth</h3>
            <p className="text-gray-300 mb-4">
              Sign-In with Ethereum authentication with secure session management
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ /api/siwe/nonce</li>
              <li>✓ /api/siwe/verify</li>
              <li>✓ /api/siwe/logout</li>
            </ul>
          </div>

          {/* Intent Processing */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">🎯 Intent Pipeline</h3>
            <p className="text-gray-300 mb-4">
              Natural language → Structured JSON intents
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ balances.get</li>
              <li>✓ trade.swap</li>
              <li>✓ bridge.transfer</li>
              <li>✓ rewards.claim</li>
            </ul>
          </div>

          {/* Read Layer */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">📊 Read Layer</h3>
            <p className="text-gray-300 mb-4">
              Portfolio balances, NFTs, and approvals
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ Alchemy Portfolio API</li>
              <li>✓ Alchemy NFT API</li>
              <li>✓ Moralis Fallback</li>
            </ul>
          </div>

          {/* DEX Swaps */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">💱 DEX Swaps</h3>
            <p className="text-gray-300 mb-4">
              Token swaps with optimal routing
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ 0x API Integration</li>
              <li>✓ Uniswap Fallback</li>
              <li>✓ Slippage Control</li>
            </ul>
          </div>

          {/* Preview & Safety */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">🛡️ Safety Preview</h3>
            <p className="text-gray-300 mb-4">
              Transaction simulation and risk assessment
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ Tenderly Simulation</li>
              <li>✓ Decoded Calls</li>
              <li>✓ Risk Assessment</li>
            </ul>
          </div>

          {/* Rewards */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">🏆 Rewards</h3>
            <p className="text-gray-300 mb-4">
              Aggregate gaming rewards and quests
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ Galxe Integration</li>
              <li>✓ RabbitHole API</li>
              <li>✓ Layer3 Support</li>
            </ul>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Backend Stack</h4>
              <ul className="text-gray-300 space-y-2">
                <li>• Next.js 14 with App Router</li>
                <li>• PostgreSQL (Neon) for data persistence</li>
                <li>• Redis (Upstash) for caching & sessions</li>
                <li>• Iron Session for secure cookies</li>
                <li>• Pino for structured logging</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Security Features</h4>
              <ul className="text-gray-300 space-y-2">
                <li>• SIWE authentication</li>
                <li>• Transaction simulation before execution</li>
                <li>• Daily spend limits</li>
                <li>• Approval bounds with Permit2</li>
                <li>• Prompt injection hardening</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-6">API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">GET /api/siwe/nonce</code>
              <p className="text-sm text-gray-400 mt-1">Generate SIWE nonce</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">POST /api/siwe/verify</code>
              <p className="text-sm text-gray-400 mt-1">Verify signature & create session</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">POST /api/siwe/logout</code>
              <p className="text-sm text-gray-400 mt-1">Destroy session</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">GET /api/balances</code>
              <p className="text-sm text-gray-400 mt-1">Fetch portfolio balances</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">POST /api/intents/quote</code>
              <p className="text-sm text-gray-400 mt-1">Get swap quote</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">POST /api/intents/preview</code>
              <p className="text-sm text-gray-400 mt-1">Preview transaction with risks</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <code className="text-green-400">GET /api/rewards</code>
              <p className="text-sm text-gray-400 mt-1">Aggregate gaming rewards</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
const switchChain: (chainId: number) => void = (chainId) => {
    setSelectedChainId(chainId);
}
