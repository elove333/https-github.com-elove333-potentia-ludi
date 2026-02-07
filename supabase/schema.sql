-- Supabase Database Schema for Potentia Ludi
-- Player wallets, rewards, NFT collections, and game data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    email VARCHAR(255),
    username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_players_wallet ON players(wallet_address);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_auth_user ON players(auth_user_id);

-- Wallets table (multi-wallet support)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    address VARCHAR(42) NOT NULL,
    label VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, chain_id, address)
);

CREATE INDEX idx_wallets_player ON wallets(player_id);
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallets_chain ON wallets(chain_id);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    token_address VARCHAR(42) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    amount VARCHAR(78) NOT NULL, -- Store as string to handle big numbers
    usd_value DECIMAL(18, 2),
    chain_id INTEGER NOT NULL,
    source VARCHAR(100) NOT NULL, -- e.g., 'game_reward', 'airdrop', 'staking'
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rewards_player ON rewards(player_id);
CREATE INDEX idx_rewards_wallet ON rewards(wallet_id);
CREATE INDEX idx_rewards_claimed ON rewards(claimed);
CREATE INDEX idx_rewards_chain ON rewards(chain_id);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game_name VARCHAR(200) NOT NULL,
    game_url VARCHAR(500) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    transactions_count INTEGER DEFAULT 0,
    gas_spent VARCHAR(78), -- Store as string to handle big numbers
    rewards_earned DECIMAL(18, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_name);
CREATE INDEX idx_game_sessions_start ON game_sessions(start_time);

-- NFT collections table
CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    contract_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    token_id VARCHAR(78) NOT NULL,
    name VARCHAR(200),
    description TEXT,
    image_url VARCHAR(500),
    metadata_url VARCHAR(500),
    acquired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, contract_address, token_id)
);

CREATE INDEX idx_nft_collections_player ON nft_collections(player_id);
CREATE INDEX idx_nft_collections_wallet ON nft_collections(wallet_id);
CREATE INDEX idx_nft_collections_contract ON nft_collections(contract_address);
CREATE INDEX idx_nft_collections_chain ON nft_collections(chain_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Users can view their own player data"
    ON players FOR SELECT
    USING (auth.uid() = auth_user_id OR wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own player data"
    ON players FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id OR wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own player data"
    ON players FOR UPDATE
    USING (auth.uid() = auth_user_id OR wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallets"
    ON wallets FOR SELECT
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can insert their own wallets"
    ON wallets FOR INSERT
    WITH CHECK (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can update their own wallets"
    ON wallets FOR UPDATE
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

-- RLS Policies for rewards
CREATE POLICY "Users can view their own rewards"
    ON rewards FOR SELECT
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can update their own rewards"
    ON rewards FOR UPDATE
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their own game sessions"
    ON game_sessions FOR SELECT
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can insert their own game sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can update their own game sessions"
    ON game_sessions FOR UPDATE
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

-- RLS Policies for nft_collections
CREATE POLICY "Users can view their own NFTs"
    ON nft_collections FOR SELECT
    USING (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can insert their own NFTs"
    ON nft_collections FOR INSERT
    WITH CHECK (player_id IN (SELECT id FROM players WHERE auth.uid() = auth_user_id));

-- Create storage buckets (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('nft-metadata', 'nft-metadata', true),
--   ('game-content', 'game-content', true),
--   ('wallet-data', 'wallet-data', false);

-- Storage policies for nft-metadata bucket
-- Paths should be: {player_id}/{token_id}.json
-- CREATE POLICY "Public read access for NFT metadata"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'nft-metadata');

-- CREATE POLICY "Authenticated users can upload NFT metadata"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'nft-metadata' AND auth.role() = 'authenticated');

-- Storage policies for game-content bucket
-- Paths should be: {player_id}/clips/{clip_id}.ext or {player_id}/screenshots/{clip_id}.ext
-- CREATE POLICY "Public read access for game content"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'game-content');

-- CREATE POLICY "Authenticated users can upload game content"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'game-content' AND auth.role() = 'authenticated');

-- Storage policies for wallet-data bucket
-- Paths should be: {auth_user_id}/wallet-snapshots/{wallet_id}_{timestamp}.json
-- Note: Use auth_user_id (not player_id) as the first path segment to match RLS policy
-- CREATE POLICY "Users can access their own wallet data"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'wallet-data' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can upload their own wallet data"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'wallet-data' AND (storage.foldername(name))[1] = auth.uid()::text);
