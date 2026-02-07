// Example: Fetching Wallet and Rewards Data
// Demonstrates querying player wallets, rewards, NFTs, and game sessions

import { supabaseHelpers, supabase } from '../../lib/supabase/client';

/**
 * Example 1: Get player by wallet address
 */
async function getPlayerByWallet() {
  console.log('--- Get Player by Wallet ---');
  
  const walletAddress = '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4';
  const player = await supabaseHelpers.getPlayerByWallet(walletAddress);

  if (player) {
    console.log('Player found:');
    console.log('  ID:', player.id);
    console.log('  Username:', player.username);
    console.log('  Email:', player.email);
    console.log('  Created:', player.created_at);
  } else {
    console.log('Player not found');
  }
}

/**
 * Example 2: Get all wallets for a player
 */
async function getPlayerWallets() {
  console.log('\n--- Get Player Wallets ---');
  
  const playerId = 'your-player-id-here';
  const wallets = await supabaseHelpers.getPlayerWallets(playerId);

  console.log(`Found ${wallets.length} wallet(s):`);
  wallets.forEach((wallet, index) => {
    console.log(`\nWallet ${index + 1}:`);
    console.log('  Address:', wallet.address);
    console.log('  Chain ID:', wallet.chain_id);
    console.log('  Label:', wallet.label || 'No label');
    console.log('  Primary:', wallet.is_primary ? 'Yes' : 'No');
  });
}

/**
 * Example 3: Get unclaimed rewards for a player
 */
async function getUnclaimedRewards() {
  console.log('\n--- Get Unclaimed Rewards ---');
  
  const playerId = 'your-player-id-here';
  const rewards = await supabaseHelpers.getUnclaimedRewards(playerId);

  console.log(`Found ${rewards.length} unclaimed reward(s):`);
  
  let totalValue = 0;
  rewards.forEach((reward, index) => {
    console.log(`\nReward ${index + 1}:`);
    console.log('  Token:', reward.token_symbol);
    console.log('  Amount:', reward.amount);
    console.log('  USD Value:', reward.usd_value ? `$${reward.usd_value}` : 'N/A');
    console.log('  Source:', reward.source);
    console.log('  Chain ID:', reward.chain_id);
    
    if (reward.usd_value) {
      totalValue += Number(reward.usd_value);
    }
  });

  console.log(`\nTotal unclaimed value: $${totalValue.toFixed(2)}`);
}

/**
 * Example 4: Get player NFTs
 */
async function getPlayerNFTs() {
  console.log('\n--- Get Player NFTs ---');
  
  const playerId = 'your-player-id-here';
  const nfts = await supabaseHelpers.getPlayerNFTs(playerId);

  console.log(`Found ${nfts.length} NFT(s):`);
  nfts.forEach((nft, index) => {
    console.log(`\nNFT ${index + 1}:`);
    console.log('  Name:', nft.name || 'Unnamed');
    console.log('  Contract:', nft.contract_address);
    console.log('  Token ID:', nft.token_id);
    console.log('  Chain ID:', nft.chain_id);
    console.log('  Image:', nft.image_url || 'No image');
    console.log('  Acquired:', nft.acquired_at);
  });
}

/**
 * Example 5: Get recent game sessions
 */
async function getRecentGameSessions() {
  console.log('\n--- Get Recent Game Sessions ---');
  
  const playerId = 'your-player-id-here';
  
  const { data: sessions, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('player_id', playerId)
    .order('start_time', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  console.log(`Found ${sessions.length} recent session(s):`);
  sessions.forEach((session, index) => {
    console.log(`\nSession ${index + 1}:`);
    console.log('  Game:', session.game_name);
    console.log('  Start:', new Date(session.start_time).toLocaleString());
    if (session.end_time) {
      console.log('  End:', new Date(session.end_time).toLocaleString());
      console.log('  Duration:', session.duration_seconds, 'seconds');
    } else {
      console.log('  Status: Active');
    }
    console.log('  Transactions:', session.transactions_count);
    console.log('  Gas Spent:', session.gas_spent || 'N/A');
    console.log('  Rewards:', session.rewards_earned ? `$${session.rewards_earned}` : 'N/A');
  });
}

/**
 * Example 6: Get rewards summary by chain
 */
async function getRewardsSummaryByChain() {
  console.log('\n--- Rewards Summary by Chain ---');
  
  const playerId = 'your-player-id-here';
  
  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('chain_id, token_symbol, usd_value, claimed')
    .eq('player_id', playerId);

  if (error) {
    console.error('Error fetching rewards:', error);
    return;
  }

  // Group by chain
  const chainSummary = rewards.reduce((acc: any, reward) => {
    if (!acc[reward.chain_id]) {
      acc[reward.chain_id] = {
        total: 0,
        claimed: 0,
        unclaimed: 0,
        count: 0,
      };
    }
    
    const value = Number(reward.usd_value) || 0;
    acc[reward.chain_id].total += value;
    acc[reward.chain_id].count += 1;
    
    if (reward.claimed) {
      acc[reward.chain_id].claimed += value;
    } else {
      acc[reward.chain_id].unclaimed += value;
    }
    
    return acc;
  }, {});

  console.log('Summary by Chain:');
  Object.entries(chainSummary).forEach(([chainId, summary]: [string, any]) => {
    console.log(`\nChain ${chainId}:`);
    console.log('  Total Rewards:', summary.count);
    console.log('  Total Value: $', summary.total.toFixed(2));
    console.log('  Claimed: $', summary.claimed.toFixed(2));
    console.log('  Unclaimed: $', summary.unclaimed.toFixed(2));
  });
}

/**
 * Example 7: Get player dashboard data
 * Combines multiple queries for a complete dashboard view
 */
async function getPlayerDashboard() {
  console.log('\n--- Player Dashboard Data ---');
  
  const walletAddress = '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4';
  
  // 1. Get player
  const player = await supabaseHelpers.getPlayerByWallet(walletAddress);
  if (!player) {
    console.log('Player not found');
    return;
  }

  console.log('Player:', player.username || player.wallet_address);
  
  // 2. Get wallets
  const wallets = await supabaseHelpers.getPlayerWallets(player.id);
  console.log('Connected Wallets:', wallets.length);
  
  // 3. Get unclaimed rewards
  const unclaimedRewards = await supabaseHelpers.getUnclaimedRewards(player.id);
  const unclaimedValue = unclaimedRewards.reduce(
    (sum, r) => sum + (Number(r.usd_value) || 0),
    0
  );
  console.log('Unclaimed Rewards:', unclaimedRewards.length);
  console.log('Unclaimed Value: $', unclaimedValue.toFixed(2));
  
  // 4. Get all rewards stats
  const { data: allRewards } = await supabase
    .from('rewards')
    .select('usd_value, claimed')
    .eq('player_id', player.id);

  if (allRewards) {
    const totalRewards = allRewards.length;
    const totalValue = allRewards.reduce((sum, r) => sum + (Number(r.usd_value) || 0), 0);
    const claimedCount = allRewards.filter((r) => r.claimed).length;
    
    console.log('Total Rewards:', totalRewards);
    console.log('Total Value: $', totalValue.toFixed(2));
    console.log('Claimed:', claimedCount, '/', totalRewards);
  }
  
  // 5. Get NFTs
  const nfts = await supabaseHelpers.getPlayerNFTs(player.id);
  console.log('NFT Collection:', nfts.length, 'items');
  
  // 6. Get recent sessions
  const { data: recentSessions } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('player_id', player.id)
    .order('start_time', { ascending: false })
    .limit(5);

  if (recentSessions) {
    console.log('Recent Sessions:', recentSessions.length);
    const totalGasSpent = recentSessions.reduce(
      (sum, s) => sum + (Number(s.gas_spent) || 0),
      0
    );
    console.log('Total Gas Spent:', totalGasSpent);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('=====================================');
  console.log('Supabase Data Fetching Examples');
  console.log('=====================================\n');

  try {
    // Run examples (uncomment the ones you want to test)
    
    // await getPlayerByWallet();
    // await getPlayerWallets();
    // await getUnclaimedRewards();
    // await getPlayerNFTs();
    // await getRecentGameSessions();
    // await getRewardsSummaryByChain();
    await getPlayerDashboard();

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().then(() => {
    console.log('\n✅ Examples completed');
    process.exit(0);
  });
}

export {
  getPlayerByWallet,
  getPlayerWallets,
  getUnclaimedRewards,
  getPlayerNFTs,
  getRecentGameSessions,
  getRewardsSummaryByChain,
  getPlayerDashboard,
};
