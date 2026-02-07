// Supabase Client Configuration
// Centralized Supabase client for database, auth, storage, and real-time features

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface Player {
  id: string;
  wallet_address: string;
  email?: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  player_id: string;
  chain_id: number;
  address: string;
  label?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  player_id: string;
  wallet_id: string;
  token_address: string;
  token_symbol: string;
  amount: string;
  usd_value?: number;
  chain_id: number;
  source: string;
  claimed: boolean;
  claimed_at?: string;
  created_at: string;
}

export interface GameSession {
  id: string;
  player_id: string;
  game_name: string;
  game_url: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  transactions_count: number;
  gas_spent?: string;
  rewards_earned?: number;
  created_at: string;
}

export interface NFTCollection {
  id: string;
  player_id: string;
  wallet_id: string;
  contract_address: string;
  chain_id: number;
  token_id: string;
  name?: string;
  description?: string;
  image_url?: string;
  metadata_url?: string;
  acquired_at: string;
  created_at: string;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Player, 'id' | 'created_at'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'created_at'>>;
      };
      rewards: {
        Row: Reward;
        Insert: Omit<Reward, 'id' | 'created_at'>;
        Update: Partial<Omit<Reward, 'id' | 'created_at'>>;
      };
      game_sessions: {
        Row: GameSession;
        Insert: Omit<GameSession, 'id' | 'created_at'>;
        Update: Partial<Omit<GameSession, 'id' | 'created_at'>>;
      };
      nft_collections: {
        Row: NFTCollection;
        Insert: Omit<NFTCollection, 'id' | 'created_at'>;
        Update: Partial<Omit<NFTCollection, 'id' | 'created_at'>>;
      };
    };
  };
}

// Get Supabase URL and key from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in environment.');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper function to create admin client (server-side only)
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL required for admin client');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Convenience functions for common operations
export const supabaseHelpers = {
  // Player operations
  async getPlayerByWallet(walletAddress: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createPlayer(walletAddress: string, email?: string, username?: string) {
    const { data, error } = await supabase
      .from('players')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        email,
        username,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Player;
  },

  // Wallet operations
  async getPlayerWallets(playerId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addWallet(playerId: string, chainId: number, address: string, label?: string, isPrimary = false) {
    const { data, error } = await supabase
      .from('wallets')
      .insert({
        player_id: playerId,
        chain_id: chainId,
        address: address.toLowerCase(),
        label,
        is_primary: isPrimary,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Wallet;
  },

  // Reward operations
  async getUnclaimedRewards(playerId: string) {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('player_id', playerId)
      .eq('claimed', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async claimReward(rewardId: string) {
    const { data, error } = await supabase
      .from('rewards')
      .update({ 
        claimed: true, 
        claimed_at: new Date().toISOString() 
      })
      .eq('id', rewardId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Reward;
  },

  async addReward(
    playerId: string,
    walletId: string,
    chainId: number,
    tokenAddress: string,
    tokenSymbol: string,
    amount: string,
    source: string,
    usdValue?: number
  ) {
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        player_id: playerId,
        wallet_id: walletId,
        chain_id: chainId,
        token_address: tokenAddress.toLowerCase(),
        token_symbol: tokenSymbol,
        amount,
        usd_value: usdValue,
        source,
        claimed: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Reward;
  },

  // Game session operations
  async createGameSession(playerId: string, gameName: string, gameUrl: string) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        player_id: playerId,
        game_name: gameName,
        game_url: gameUrl,
        start_time: new Date().toISOString(),
        transactions_count: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },

  async endGameSession(sessionId: string, transactionsCount: number, gasSpent?: string, rewardsEarned?: number) {
    const endTime = new Date().toISOString();
    const { data: session } = await supabase
      .from('game_sessions')
      .select('start_time')
      .eq('id', sessionId)
      .single();

    const durationSeconds = session
      ? Math.floor((new Date(endTime).getTime() - new Date(session.start_time).getTime()) / 1000)
      : undefined;

    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        end_time: endTime,
        duration_seconds: durationSeconds,
        transactions_count: transactionsCount,
        gas_spent: gasSpent,
        rewards_earned: rewardsEarned,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },

  // NFT operations
  async addNFT(
    playerId: string,
    walletId: string,
    chainId: number,
    contractAddress: string,
    tokenId: string,
    name?: string,
    description?: string,
    imageUrl?: string,
    metadataUrl?: string
  ) {
    const { data, error } = await supabase
      .from('nft_collections')
      .insert({
        player_id: playerId,
        wallet_id: walletId,
        chain_id: chainId,
        contract_address: contractAddress.toLowerCase(),
        token_id: tokenId,
        name,
        description,
        image_url: imageUrl,
        metadata_url: metadataUrl,
        acquired_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as NFTCollection;
  },

  async getPlayerNFTs(playerId: string, chainId?: number) {
    let query = supabase
      .from('nft_collections')
      .select('*')
      .eq('player_id', playerId);

    if (chainId) {
      query = query.eq('chain_id', chainId);
    }

    const { data, error } = await query.order('acquired_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};

export default supabase;
