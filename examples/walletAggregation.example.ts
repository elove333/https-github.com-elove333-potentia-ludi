/**
 * Wallet Aggregation Example
 * 
 * Demonstrates unified tracking of wallets across Ethereum, Solana, and other supported chains
 * using @circle-fin/adapter-circle-wallets v1.0.0
 */

import { circleWalletService } from '../src/services/circleWalletService';

async function walletAggregationExample() {
  console.log('=== Wallet Aggregation Example ===\n');

  try {
    // Initialize Circle Wallet Service
    await circleWalletService.initialize();
    console.log('');

    // Create wallets for multiple chains
    console.log('📦 Creating wallets across multiple chains...\n');

    // Ethereum mainnet
    const ethWallet = await circleWalletService.getOrCreateWallet(1);
    console.log(`💎 Ethereum: ${ethWallet.address}`);

    // Base
    const baseWallet = await circleWalletService.getOrCreateWallet(8453);
    console.log(`🔵 Base: ${baseWallet.address}`);

    // Arbitrum
    const arbWallet = await circleWalletService.getOrCreateWallet(42161);
    console.log(`🔺 Arbitrum: ${arbWallet.address}`);

    // Polygon
    const polyWallet = await circleWalletService.getOrCreateWallet(137);
    console.log(`🟣 Polygon: ${polyWallet.address}`);

    // Solana
    const solWallet = await circleWalletService.getOrCreateWallet(1399811149);
    console.log(`☀️ Solana: ${solWallet.address}`);

    console.log('');

    // Get all wallets
    console.log('📊 Wallet Aggregation Summary:');
    const allWallets = circleWalletService.getAllWallets();
    console.log(`Total wallets: ${allWallets.length}`);
    
    const evmWallets = circleWalletService.getWalletsByType('evm');
    console.log(`EVM wallets: ${evmWallets.length}`);
    
    const solanaWallets = circleWalletService.getWalletsByType('solana');
    console.log(`Solana wallets: ${solanaWallets.length}`);
    console.log('');

    // Get balances for each wallet
    console.log('💰 Fetching balances...\n');
    
    for (const wallet of allWallets) {
      const balance = await circleWalletService.getWalletBalance(wallet.chainId);
      console.log(`${wallet.chainName}: ${balance} (native token)`);
    }
    console.log('');

    // Display supported chains
    console.log('🌐 Supported Chains:');
    const mainnetChains = circleWalletService.getMainnetChains();
    console.log('\nMainnet chains:');
    mainnetChains.forEach(chain => {
      console.log(`  - ${chain.name} (Chain ID: ${chain.chainId})`);
    });

    const testnetChains = circleWalletService.getTestnetChains();
    console.log('\nTestnet chains:');
    testnetChains.forEach(chain => {
      console.log(`  - ${chain.name} (Chain ID: ${chain.chainId})`);
    });

    console.log('\n✅ Wallet aggregation example completed successfully!\n');
  } catch (error) {
    console.error('❌ Error in wallet aggregation example:', error);
  }
}

// Export for use in other modules
export { walletAggregationExample };

// Run if executed directly
if (require.main === module) {
  walletAggregationExample().catch(console.error);
}
