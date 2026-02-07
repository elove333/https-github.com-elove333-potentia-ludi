-- PostgreSQL Schema for Conversational Web3 Wallet Hub
-- Version: 1.0.0
-- 
-- This schema defines all database tables required for the conversational
-- wallet hub including intent history, transaction cache, user preferences,
-- and price data.
--
-- Setup Instructions:
-- 1. Create database: createdb potentia_ludi
-- 2. Run this script: psql potentia_ludi < schema.sql
-- 3. Verify: psql potentia_ludi -c "\dt"

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Intent History Table
-- Stores all natural language requests and their parsed intents
CREATE TABLE IF NOT EXISTS intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address VARCHAR(42) NOT NULL,
  raw_message TEXT NOT NULL,
  parsed_intent JSONB NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'executed', 'failed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  transaction_hash VARCHAR(66),
  error_message TEXT,
  confidence_score DECIMAL(3, 2),
  requires_confirmation BOOLEAN DEFAULT true,
  confirmation_level VARCHAR(20)
);

-- Indexes for intent queries
CREATE INDEX idx_intents_user_address ON intents(user_address);
CREATE INDEX idx_intents_status ON intents(status);
CREATE INDEX idx_intents_created_at ON intents(created_at DESC);
CREATE INDEX idx_intents_user_status ON intents(user_address, status);

-- Transaction Cache Table
-- Caches blockchain transaction data to reduce RPC calls
CREATE TABLE IF NOT EXISTS transaction_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42),
  value DECIMAL(78, 0),
  gas_used BIGINT,
  gas_price BIGINT,
  status VARCHAR(20),
  block_number BIGINT,
  block_timestamp TIMESTAMP,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chain_id, tx_hash)
);

-- Indexes for transaction queries
CREATE INDEX idx_tx_cache_from_address ON transaction_cache(from_address);
CREATE INDEX idx_tx_cache_to_address ON transaction_cache(to_address);
CREATE INDEX idx_tx_cache_chain_tx ON transaction_cache(chain_id, tx_hash);
CREATE INDEX idx_tx_cache_block ON transaction_cache(chain_id, block_number);

-- User Preferences Table
-- Stores user settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_address VARCHAR(42) PRIMARY KEY,
  default_chain_id INTEGER DEFAULT 1,
  slippage_tolerance DECIMAL(5, 2) DEFAULT 0.5,
  gas_preference VARCHAR(20) DEFAULT 'medium' CHECK (gas_preference IN ('low', 'medium', 'high')),
  auto_confirm_below DECIMAL(18, 8),
  preferred_language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price Cache Table
-- Caches token prices to reduce API calls
CREATE TABLE IF NOT EXISTS price_cache (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  price_usd DECIMAL(18, 8) NOT NULL,
  price_source VARCHAR(50),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(token_address, chain_id)
);

-- Index for price lookups
CREATE INDEX idx_price_token_chain ON price_cache(token_address, chain_id);
CREATE INDEX idx_price_updated ON price_cache(last_updated DESC);

-- Balance Cache Table
-- Caches wallet balances to reduce RPC calls
CREATE TABLE IF NOT EXISTS balance_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42),
  chain_id INTEGER NOT NULL,
  balance DECIMAL(78, 0) NOT NULL,
  formatted_balance VARCHAR(50),
  usd_value DECIMAL(18, 2),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, token_address, chain_id)
);

-- Indexes for balance queries
CREATE INDEX idx_balance_wallet ON balance_cache(wallet_address);
CREATE INDEX idx_balance_wallet_chain ON balance_cache(wallet_address, chain_id);
CREATE INDEX idx_balance_updated ON balance_cache(last_updated DESC);

-- Confirmation Requests Table
-- Tracks pending confirmation requests
CREATE TABLE IF NOT EXISTS confirmation_requests (
  id VARCHAR(100) PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  operation_type VARCHAR(20) NOT NULL,
  confirmation_level VARCHAR(20) NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  confirmed_at TIMESTAMP,
  mfa_required BOOLEAN DEFAULT false
);

-- Indexes for confirmation queries
CREATE INDEX idx_confirmation_user ON confirmation_requests(user_address);
CREATE INDEX idx_confirmation_status ON confirmation_requests(status);
CREATE INDEX idx_confirmation_expires ON confirmation_requests(expires_at);

-- Rate Limiting Table
-- Tracks API usage for rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address VARCHAR(42) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  UNIQUE(user_address, endpoint, window_start)
);

-- Index for rate limit checks
CREATE INDEX idx_rate_limit_user_endpoint ON rate_limits(user_address, endpoint, window_start);

-- Bridge Transfers Table
-- Tracks cross-chain bridge transfers
CREATE TABLE IF NOT EXISTS bridge_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id VARCHAR(100) UNIQUE NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  from_chain_id INTEGER NOT NULL,
  to_chain_id INTEGER NOT NULL,
  token_address VARCHAR(42),
  amount DECIMAL(78, 0) NOT NULL,
  bridge_provider VARCHAR(50) NOT NULL,
  source_tx_hash VARCHAR(66),
  destination_tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'bridging', 'completed', 'failed')),
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Indexes for bridge tracking
CREATE INDEX idx_bridge_user ON bridge_transfers(user_address);
CREATE INDEX idx_bridge_tracking ON bridge_transfers(tracking_id);
CREATE INDEX idx_bridge_status ON bridge_transfers(status);
CREATE INDEX idx_bridge_chains ON bridge_transfers(from_chain_id, to_chain_id);

-- Swap History Table
-- Records token swap transactions
CREATE TABLE IF NOT EXISTS swap_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  from_token VARCHAR(42),
  to_token VARCHAR(42),
  from_amount DECIMAL(78, 0),
  to_amount DECIMAL(78, 0),
  dex_provider VARCHAR(50),
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  price_impact DECIMAL(5, 2),
  gas_used BIGINT,
  gas_price BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Indexes for swap queries
CREATE INDEX idx_swap_user ON swap_history(user_address);
CREATE INDEX idx_swap_tx ON swap_history(tx_hash);
CREATE INDEX idx_swap_created ON swap_history(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at in user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired confirmations
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations()
RETURNS void AS $$
BEGIN
  UPDATE confirmation_requests
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
  -- Delete balance cache older than 1 hour
  DELETE FROM balance_cache WHERE last_updated < NOW() - INTERVAL '1 hour';
  
  -- Delete price cache older than 5 minutes
  DELETE FROM price_cache WHERE last_updated < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Views for common queries
CREATE OR REPLACE VIEW recent_intents AS
SELECT 
  id,
  user_address,
  raw_message,
  (parsed_intent->>'intent') as intent_type,
  status,
  created_at,
  executed_at
FROM intents
ORDER BY created_at DESC
LIMIT 100;

CREATE OR REPLACE VIEW active_confirmations AS
SELECT 
  id,
  user_address,
  operation_type,
  confirmation_level,
  summary,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_remaining
FROM confirmation_requests
WHERE status = 'pending' AND expires_at > NOW()
ORDER BY created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO potentia_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO potentia_user;

-- Insert default data
INSERT INTO user_preferences (user_address, default_chain_id, slippage_tolerance, gas_preference)
VALUES ('0x0000000000000000000000000000000000000000', 137, 0.5, 'medium')
ON CONFLICT (user_address) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL schema created successfully!';
  RAISE NOTICE 'Tables created: %, %, %, %, %, %, %, %, %',
    'intents', 'transaction_cache', 'user_preferences', 'price_cache',
    'balance_cache', 'confirmation_requests', 'rate_limits',
    'bridge_transfers', 'swap_history';
END $$;
