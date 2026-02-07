// Example: Real-Time Updates with Supabase
// Demonstrates subscribing to real-time notifications for rewards, wallets, and game events

import { realtimeSubscriptions } from '../../lib/supabase/realtime';
import { supabaseHelpers } from '../../lib/supabase/client';

/**
 * Example 1: Subscribe to new rewards
 */
async function subscribeToNewRewards() {
  console.log('--- Subscribe to New Rewards ---');
  
  const playerId = 'your-player-id-here';
  
  console.log('Listening for new rewards...');
  
  const unsubscribe = realtimeSubscriptions.subscribeToRewards(
    playerId,
    (reward) => {
      console.log('\n🎉 New reward received!');
      console.log('  Token:', reward.token_symbol);
      console.log('  Amount:', reward.amount);
      console.log('  Value:', reward.usd_value ? `$${reward.usd_value}` : 'N/A');
      console.log('  Source:', reward.source);
      console.log('  Chain:', reward.chain_id);
      console.log('  Claimed:', reward.claimed ? 'Yes' : 'No');
    }
  );

  // Keep subscription active for 5 minutes
  await new Promise((resolve) => setTimeout(resolve, 300000));
  
  // Clean up
  unsubscribe();
  console.log('\n✅ Unsubscribed from rewards');
}

/**
 * Example 2: Subscribe to unclaimed rewards count
 */
async function subscribeToUnclaimedCount() {
  console.log('\n--- Subscribe to Unclaimed Rewards Count ---');
  
  const playerId = 'your-player-id-here';
  
  console.log('Listening for unclaimed rewards updates...');
  
  const unsubscribe = realtimeSubscriptions.subscribeToUnclaimedRewards(
    playerId,
    async (reward) => {
      // Fetch updated count
      const unclaimed = await supabaseHelpers.getUnclaimedRewards(playerId);
      const totalValue = unclaimed.reduce(
        (sum, r) => sum + (Number(r.usd_value) || 0),
        0
      );
      
      console.log('\n🔔 Unclaimed rewards updated!');
      console.log('  Count:', unclaimed.length);
      console.log('  Total Value: $', totalValue.toFixed(2));
    }
  );

  // Keep subscription active for 5 minutes
  await new Promise((resolve) => setTimeout(resolve, 300000));
  
  // Clean up
  unsubscribe();
  console.log('\n✅ Unsubscribed from unclaimed rewards');
}

/**
 * Example 3: Subscribe to game sessions
 */
async function subscribeToGameSessions() {
  console.log('\n--- Subscribe to Game Sessions ---');
  
  const playerId = 'your-player-id-here';
  
  console.log('Listening for game session updates...');
  
  const unsubscribe = realtimeSubscriptions.subscribeToGameSessions(
    playerId,
    (session) => {
      console.log('\n🎮 Game session update!');
      console.log('  Game:', session.game_name);
      console.log('  Status:', session.end_time ? 'Ended' : 'Active');
      
      if (session.end_time) {
        console.log('  Duration:', session.duration_seconds, 'seconds');
        console.log('  Transactions:', session.transactions_count);
        console.log('  Gas Spent:', session.gas_spent || 'N/A');
        console.log('  Rewards Earned:', session.rewards_earned ? `$${session.rewards_earned}` : 'N/A');
      } else {
        console.log('  Started:', new Date(session.start_time).toLocaleString());
      }
    }
  );

  // Keep subscription active for 5 minutes
  await new Promise((resolve) => setTimeout(resolve, 300000));
  
  // Clean up
  unsubscribe();
  console.log('\n✅ Unsubscribed from game sessions');
}

/**
 * Example 4: Subscribe to wallet updates
 */
async function subscribeToWalletUpdates() {
  console.log('\n--- Subscribe to Wallet Updates ---');
  
  const playerId = 'your-player-id-here';
  
  console.log('Listening for wallet updates...');
  
  const unsubscribe = realtimeSubscriptions.subscribeToWalletUpdates(
    playerId,
    (walletId, chainId) => {
      console.log('\n💰 Wallet updated!');
      console.log('  Wallet ID:', walletId);
      console.log('  Chain ID:', chainId);
      console.log('  Tip: Refresh wallet balance and token data');
    }
  );

  // Keep subscription active for 5 minutes
  await new Promise((resolve) => setTimeout(resolve, 300000));
  
  // Clean up
  unsubscribe();
  console.log('\n✅ Unsubscribed from wallet updates');
}

/**
 * Example 5: Dashboard with multiple real-time subscriptions
 */
async function dashboardRealtimeSubscriptions() {
  console.log('\n--- Dashboard Real-Time Subscriptions ---');
  
  const playerId = 'your-player-id-here';
  
  console.log('Starting dashboard subscriptions...\n');

  // Track statistics
  let stats = {
    newRewards: 0,
    claimedRewards: 0,
    gameSessions: 0,
    walletUpdates: 0,
  };

  // Subscribe to rewards
  const rewardsUnsub = realtimeSubscriptions.subscribeToRewards(
    playerId,
    (reward) => {
      if (reward.claimed) {
        stats.claimedRewards++;
        console.log('✅ Reward claimed:', reward.token_symbol, reward.amount);
      } else {
        stats.newRewards++;
        console.log('🎁 New reward:', reward.token_symbol, reward.amount);
      }
      printStats();
    }
  );

  // Subscribe to game sessions
  const sessionsUnsub = realtimeSubscriptions.subscribeToGameSessions(
    playerId,
    (session) => {
      stats.gameSessions++;
      console.log('🎮 Game session:', session.game_name, session.end_time ? 'ended' : 'started');
      printStats();
    }
  );

  // Subscribe to wallet updates
  const walletsUnsub = realtimeSubscriptions.subscribeToWalletUpdates(
    playerId,
    (walletId, chainId) => {
      stats.walletUpdates++;
      console.log('💰 Wallet updated on chain', chainId);
      printStats();
    }
  );

  function printStats() {
    console.log('\n--- Dashboard Stats ---');
    console.log('New Rewards:', stats.newRewards);
    console.log('Claimed Rewards:', stats.claimedRewards);
    console.log('Game Sessions:', stats.gameSessions);
    console.log('Wallet Updates:', stats.walletUpdates);
    console.log('-------------------\n');
  }

  // Keep subscriptions active for 10 minutes
  await new Promise((resolve) => setTimeout(resolve, 600000));
  
  // Clean up all subscriptions
  rewardsUnsub();
  sessionsUnsub();
  walletsUnsub();
  
  console.log('\n✅ All subscriptions cleaned up');
  console.log('\nFinal Stats:');
  printStats();
}

/**
 * Example 6: Real-time notification system
 */
async function realtimeNotificationSystem() {
  console.log('\n--- Real-Time Notification System ---');
  
  const playerId = 'your-player-id-here';
  
  const notifications: Array<{ type: string; message: string; timestamp: Date }> = [];
  
  function addNotification(type: string, message: string) {
    notifications.push({ type, message, timestamp: new Date() });
    console.log(`\n[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`);
    
    // Keep only last 10 notifications
    if (notifications.length > 10) {
      notifications.shift();
    }
  }

  // Subscribe to all events
  const rewardsUnsub = realtimeSubscriptions.subscribeToRewards(
    playerId,
    (reward) => {
      if (!reward.claimed) {
        addNotification(
          'reward',
          `New ${reward.token_symbol} reward: ${reward.amount} ($${reward.usd_value || 0})`
        );
      } else {
        addNotification(
          'claim',
          `Reward claimed: ${reward.token_symbol} ${reward.amount}`
        );
      }
    }
  );

  const sessionsUnsub = realtimeSubscriptions.subscribeToGameSessions(
    playerId,
    (session) => {
      if (!session.end_time) {
        addNotification('game', `Started playing ${session.game_name}`);
      } else {
        const duration = Math.floor((session.duration_seconds || 0) / 60);
        addNotification(
          'game',
          `Finished ${session.game_name} (${duration} min, ${session.transactions_count} txns)`
        );
      }
    }
  );

  const walletsUnsub = realtimeSubscriptions.subscribeToWalletUpdates(
    playerId,
    (walletId, chainId) => {
      addNotification('wallet', `Balance updated on Chain ${chainId}`);
    }
  );

  console.log('Notification system active. Listening for events...');

  // Keep subscriptions active for 10 minutes
  await new Promise((resolve) => setTimeout(resolve, 600000));
  
  // Clean up
  rewardsUnsub();
  sessionsUnsub();
  walletsUnsub();
  
  console.log('\n✅ Notification system stopped');
  console.log(`\nTotal notifications: ${notifications.length}`);
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('======================================');
  console.log('Supabase Real-Time Updates Examples');
  console.log('======================================\n');

  try {
    // Run individual examples (uncomment the ones you want to test)
    
    // await subscribeToNewRewards();
    // await subscribeToUnclaimedCount();
    // await subscribeToGameSessions();
    // await subscribeToWalletUpdates();
    // await dashboardRealtimeSubscriptions();
    await realtimeNotificationSystem();

    console.log('\n💡 Tip: In a real app, these subscriptions would run continuously');
    console.log('and update your UI in real-time as data changes.');

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
  subscribeToNewRewards,
  subscribeToUnclaimedCount,
  subscribeToGameSessions,
  subscribeToWalletUpdates,
  dashboardRealtimeSubscriptions,
  realtimeNotificationSystem,
};
