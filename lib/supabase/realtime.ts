// Supabase Realtime Subscriptions
// Real-time updates for wallet balances, rewards, and game events

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, Reward, GameSession } from './client';

export type RewardUpdateCallback = (reward: Reward) => void;
export type GameSessionUpdateCallback = (session: GameSession) => void;
export type WalletUpdateCallback = (walletId: string, chainId: number) => void;

// Subscription manager to track active subscriptions
class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to new rewards for a player
   */
  subscribeToRewards(playerId: string, callback: RewardUpdateCallback): () => void {
    const channelName = `rewards:${playerId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rewards',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          callback(payload.new as Reward);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rewards',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          callback(payload.new as Reward);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to unclaimed rewards updates
   */
  subscribeToUnclaimedRewards(playerId: string, callback: RewardUpdateCallback): () => void {
    const channelName = `unclaimed-rewards:${playerId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rewards',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          const reward = payload.new as Reward;
          if (!reward.claimed) {
            callback(reward);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rewards',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          callback(payload.new as Reward);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to game sessions for a player
   */
  subscribeToGameSessions(playerId: string, callback: GameSessionUpdateCallback): () => void {
    const channelName = `game-sessions:${playerId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_sessions',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          callback(payload.new as GameSession);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          callback(payload.new as GameSession);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to wallet updates (for balance changes, etc.)
   */
  subscribeToWalletUpdates(playerId: string, callback: WalletUpdateCallback): () => void {
    const channelName = `wallets:${playerId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          const wallet = payload.new as any;
          callback(wallet.id, wallet.chain_id);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to a custom table with custom filter
   */
  subscribeToCustom<T = any>(
    channelName: string,
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: T) => void,
    filter?: string
  ): () => void {
    // Remove existing subscription if any
    this.unsubscribe(channelName);

    const config: any = {
      event: event === '*' ? '*' : `postgres_changes`,
      schema: 'public',
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, (payload) => {
        callback(payload.new as T);
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.channels.keys()).map((name) => this.unsubscribe(name));
    await Promise.all(promises);
  }

  /**
   * Get list of active subscription channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Create and export singleton instance
export const realtimeSubscriptions = new RealtimeSubscriptionManager();

// Example usage functions for documentation
export const examples = {
  /**
   * Example: Subscribe to new rewards and display notifications
   */
  subscribeToNewRewards: (playerId: string, onNewReward: (reward: Reward) => void) => {
    return realtimeSubscriptions.subscribeToRewards(playerId, (reward) => {
      console.log('New reward received:', reward);
      onNewReward(reward);
    });
  },

  /**
   * Example: Subscribe to unclaimed rewards count changes
   */
  subscribeToUnclaimedCount: (playerId: string, onUpdate: (count: number) => void) => {
    // Initial fetch
    supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('claimed', false)
      .then(({ count }) => {
        if (count !== null) onUpdate(count);
      });

    // Subscribe to changes
    return realtimeSubscriptions.subscribeToUnclaimedRewards(playerId, () => {
      // Refetch count when rewards change
      supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', playerId)
        .eq('claimed', false)
        .then(({ count }) => {
          if (count !== null) onUpdate(count);
        });
    });
  },

  /**
   * Example: Subscribe to active game sessions
   */
  subscribeToActiveGames: (playerId: string, onSessionUpdate: (session: GameSession) => void) => {
    return realtimeSubscriptions.subscribeToGameSessions(playerId, (session) => {
      console.log('Game session update:', session);
      if (!session.end_time) {
        // Active session
        onSessionUpdate(session);
      }
    });
  },
};

export default realtimeSubscriptions;
