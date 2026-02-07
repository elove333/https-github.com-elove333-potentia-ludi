/**
 * Cross-Chain Transfer Example
 * 
 * Demonstrates safeguard reward transfers across chains using @circle-fin/bridge-kit v1.1.2
 * and @circle-fin/provider-cctp-v2 v1.0.4
 * 
 * Features:
 * - Prevents fund loss on unsupported routes
 * - Clear error messages with supported chain listings
 * - Enhanced Solana recipient handling
 */

import { crossChainBridgeService, BridgeError, BridgeErrorCode } from '../services/crossChainBridgeService';

async function crossChainFlowExample() {
  console.log('=== Cross-Chain Transfer Example ===\n');

  try {
    // Example 1: Valid EVM to EVM transfer
    console.log('📤 Example 1: Transfer USDC from Ethereum to Base\n');
    
    const transfer1 = await crossChainBridgeService.initiateTransfer(
      1,        // Ethereum
      8453,     // Base
      'USDC',
      '100.00',
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    );

    console.log(`Transfer ID: ${transfer1.id}`);
    console.log(`Status: ${transfer1.status}`);
    console.log(`Amount: ${transfer1.amount} ${transfer1.token}`);
    console.log('');

    // Wait for transfer to complete
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    const completed1 = crossChainBridgeService.getTransfer(transfer1.id);
    if (completed1) {
      console.log(`✅ Transfer status: ${completed1.status}`);
      console.log(`   TX Hash: ${completed1.txHash}`);
      console.log(`   Attestation: ${completed1.attestation?.slice(0, 20)}...`);
      console.log('');
    }

    // Example 2: Valid transfer to Solana with proper address format
    console.log('📤 Example 2: Transfer USDC from Arbitrum to Solana\n');
    
    const transfer2 = await crossChainBridgeService.initiateTransfer(
      42161,    // Arbitrum
      1399811149, // Solana
      'USDC',
      '50.00',
      '7YvPGmrHvZt5CjbKmGVxnPw7FQ8PpXhPxZjXYvPGmrHv' // Valid Solana address
    );

    console.log(`Transfer ID: ${transfer2.id}`);
    console.log(`Status: ${transfer2.status}`);
    console.log(`Recipient (Solana): ${transfer2.recipient}`);
    console.log('');

    // Example 3: Error handling - unsupported chain
    console.log('❌ Example 3: Attempting unsupported chain\n');
    
    try {
      await crossChainBridgeService.initiateTransfer(
        9999,     // Invalid chain
        8453,
        'USDC',
        '100.00',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      );
    } catch (error) {
      if (error instanceof BridgeError) {
        console.log(`Error Code: ${error.code}`);
        console.log(`Error Message: ${error.message}`);
        if (error.supportedChains) {
          console.log(`Supported chains: ${error.supportedChains.slice(0, 5).join(', ')}...`);
        }
      }
      console.log('');
    }

    // Example 4: Error handling - invalid Solana address
    console.log('❌ Example 4: Invalid Solana recipient address\n');
    
    try {
      await crossChainBridgeService.initiateTransfer(
        1,
        1399811149, // Solana
        'USDC',
        '100.00',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' // EVM address, not Solana
      );
    } catch (error) {
      if (error instanceof BridgeError) {
        console.log(`Error Code: ${error.code}`);
        console.log(`Error Message: ${error.message}`);
      }
      console.log('');
    }

    // Example 5: Route validation
    console.log('✅ Example 5: Validate multiple routes\n');
    
    const routes = [
      { from: 1, to: 8453, name: 'Ethereum → Base' },
      { from: 137, to: 42161, name: 'Polygon → Arbitrum' },
      { from: 10, to: 1399811149, name: 'Optimism → Solana' },
    ];

    for (const route of routes) {
      try {
        const validated = crossChainBridgeService.validateRoute(route.from, route.to);
        console.log(`✓ ${route.name}`);
        console.log(`  Supported: ${validated.supported}`);
        console.log(`  Est. Time: ${validated.estimatedTime}s`);
        console.log(`  Est. Fee: ${validated.estimatedFee} USDC`);
      } catch (error) {
        console.log(`✗ ${route.name}: Not supported`);
      }
    }
    console.log('');

    // Display supported chains
    console.log('🌐 All Supported Chains:\n');
    const supportedChains = crossChainBridgeService.getSupportedChains();
    supportedChains.forEach(chain => {
      console.log(`  ${chain.name} (Chain ID: ${chain.chainId})`);
    });

    console.log('\n✅ Cross-chain flow example completed successfully!\n');
  } catch (error) {
    console.error('❌ Error in cross-chain example:', error);
  }
}

// Export for use in other modules
export { crossChainFlowExample };

// Run if executed directly
if (require.main === module) {
  crossChainFlowExample().catch(console.error);
}
