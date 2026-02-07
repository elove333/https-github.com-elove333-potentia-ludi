/**
 * Solana Integration Example
 * 
 * Demonstrates native Solana support using @circle-fin/adapter-solana-kit v1.0.0
 * 
 * Features:
 * - Wallet connection (user-controlled and developer-controlled)
 * - ATA (Associated Token Account) creation with rent-exempt validation
 * - Burn + mint functionality for cross-chain transfers
 * - Token balance queries
 */

import { solanaIntegrationService } from '../services/solanaIntegrationService';

async function solanaIntegrationExample() {
  console.log('=== Solana Integration Example ===\n');

  try {
    // Initialize Solana Integration
    await solanaIntegrationService.initialize();
    console.log('');

    // Example 1: Connect user-controlled wallet (Phantom)
    console.log('👛 Example 1: Connect Phantom Wallet\n');
    
    const userWallet = await solanaIntegrationService.connectWallet(
      'user-controlled',
      'phantom'
    );

    console.log(`Wallet Type: ${userWallet.type}`);
    console.log(`Provider: ${userWallet.provider}`);
    console.log(`Address: ${userWallet.address}`);
    console.log('');

    // Example 2: Create Associated Token Account (ATA)
    console.log('🪙 Example 2: Create ATA for USDC\n');
    
    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC on Solana
    const ata = await solanaIntegrationService.getOrCreateATA(
      userWallet.address,
      usdcMint
    );

    console.log(`ATA Address: ${ata.address}`);
    console.log(`Token Mint: ${ata.mint}`);
    console.log(`Owner: ${ata.owner}`);
    console.log(`Is ATA: ${ata.isATA}`);
    console.log(`Rent Exempt: ${ata.rentExempt ? '✅' : '⚠️'}`);
    console.log('');

    // Example 3: Burn tokens (cross-chain transfer out)
    console.log('🔥 Example 3: Burn USDC for cross-chain transfer\n');
    
    const burnOp = await solanaIntegrationService.burn(
      usdcMint,
      '100.00',
      'Ethereum'
    );

    console.log(`Operation: ${burnOp.type}`);
    console.log(`Status: ${burnOp.status}`);
    console.log(`Amount: ${burnOp.amount}`);
    console.log(`From: ${burnOp.fromChain}`);
    console.log(`To: ${burnOp.toChain}`);
    console.log(`Signature: ${burnOp.signature?.slice(0, 20)}...`);
    console.log('');

    // Example 4: Mint tokens (cross-chain transfer in)
    console.log('✨ Example 4: Mint USDC from cross-chain transfer\n');
    
    const mintRecipient = '8YvQGmrHvZt5CjbKmGVxnPw8FQ9PpXhPxZjXYvQGmrHw';
    const mintOp = await solanaIntegrationService.mint(
      usdcMint,
      '50.00',
      mintRecipient,
      'Base'
    );

    console.log(`Operation: ${mintOp.type}`);
    console.log(`Status: ${mintOp.status}`);
    console.log(`Amount: ${mintOp.amount}`);
    console.log(`From: ${mintOp.fromChain}`);
    console.log(`To: ${mintOp.toChain}`);
    console.log(`Signature: ${mintOp.signature?.slice(0, 20)}...`);
    console.log('');

    // Example 5: Get token balance
    console.log('💰 Example 5: Query Token Balance\n');
    
    const balance = await solanaIntegrationService.getTokenBalance(usdcMint);
    console.log(`USDC Balance: ${balance}`);
    console.log('');

    // Example 6: Get all token accounts
    console.log('📋 Example 6: List All Token Accounts\n');
    
    const accounts = solanaIntegrationService.getTokenAccounts();
    console.log(`Total token accounts: ${accounts.length}`);
    accounts.forEach((account, index) => {
      console.log(`\nAccount ${index + 1}:`);
      console.log(`  Address: ${account.address}`);
      console.log(`  Mint: ${account.mint.slice(0, 20)}...`);
      console.log(`  Balance: ${account.balance}`);
      console.log(`  Rent Exempt: ${account.rentExempt ? '✅' : '⚠️'}`);
    });
    console.log('');

    // Example 7: Developer-controlled wallet
    console.log('🔑 Example 7: Developer-Controlled Wallet (Keypair)\n');
    
    // Disconnect current wallet
    solanaIntegrationService.disconnect();
    
    const devWallet = await solanaIntegrationService.connectWallet(
      'developer-controlled',
      'keypair'
    );

    console.log(`Wallet Type: ${devWallet.type}`);
    console.log(`Provider: ${devWallet.provider}`);
    console.log(`Address: ${devWallet.address}`);
    console.log('');

    // Example 8: Create ATA for dev wallet
    console.log('🪙 Example 8: Create ATA for Developer Wallet\n');
    
    const devAta = await solanaIntegrationService.getOrCreateATA(
      devWallet.address,
      usdcMint
    );

    console.log(`ATA Address: ${devAta.address}`);
    console.log(`Owner: ${devAta.owner}`);
    console.log(`Rent Exempt: ${devAta.rentExempt ? '✅' : '⚠️'}`);
    console.log('');

    // Summary
    console.log('📊 Summary\n');
    console.log('Demonstrated features:');
    console.log('  ✅ User-controlled wallet connection (Phantom)');
    console.log('  ✅ Developer-controlled wallet connection (Keypair)');
    console.log('  ✅ Automatic ATA creation');
    console.log('  ✅ Rent-exempt validation');
    console.log('  ✅ Burn operation for cross-chain transfer');
    console.log('  ✅ Mint operation from cross-chain transfer');
    console.log('  ✅ Token balance queries');
    console.log('  ✅ Token account enumeration');

    console.log('\n✅ Solana integration example completed successfully!\n');
  } catch (error) {
    console.error('❌ Error in Solana integration example:', error);
  } finally {
    // Cleanup
    solanaIntegrationService.disconnect();
  }
}

// Export for use in other modules
export { solanaIntegrationExample };

// Run if executed directly
if (require.main === module) {
  solanaIntegrationExample().catch(console.error);
}
