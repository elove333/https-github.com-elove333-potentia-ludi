-- PostgreSQL Schema for Conversational Web3 Wallet Hub
-- This schema supports the conversational AI features and transaction tracking

-- Users table - stores wallet addresses and user preferences
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  ens_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  CONSTRAINT valid_address CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);

-- Conversations table - tracks conversation sessions
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  context JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  CONSTRAINT valid_message_count CHECK (message_count >= 0)
);

CREATE INDEX idx_conversations_user ON conversations(user_id, started_at DESC);
CREATE INDEX idx_conversations_active ON conversations(user_id, ended_at) WHERE ended_at IS NULL;

-- Intents table - logs all parsed intents from natural language
CREATE TABLE IF NOT EXISTS intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_input TEXT NOT NULL,
  parsed_intent JSONB NOT NULL,
  confidence FLOAT NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'executed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX idx_intents_conversation ON intents(conversation_id, created_at);
CREATE INDEX idx_intents_user ON intents(user_id, created_at DESC);
CREATE INDEX idx_intents_status ON intents(status, created_at DESC);

-- Transactions table - tracks all blockchain transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intent_id UUID REFERENCES intents(id) ON DELETE SET NULL,
  chain_id INTEGER NOT NULL,
  tx_hash VARCHAR(66) UNIQUE,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42),
  value NUMERIC(78, 0), -- bigint as string
  gas_used NUMERIC(78, 0),
  gas_price NUMERIC(78, 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  CONSTRAINT valid_tx_hash CHECK (tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  CONSTRAINT valid_addresses CHECK (
    from_address ~ '^0x[a-fA-F0-9]{40}$' AND
    (to_address IS NULL OR to_address ~ '^0x[a-fA-F0-9]{40}$')
  )
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status, created_at DESC);
CREATE INDEX idx_transactions_chain ON transactions(chain_id, created_at DESC);

-- Sessions table - manages user authentication sessions (SIWE)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(256) UNIQUE NOT NULL,
  nonce VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id, expires_at DESC);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE expires_at > NOW();

-- Quotes table - caches swap and bridge quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quote_type VARCHAR(20) NOT NULL CHECK (quote_type IN ('swap', 'bridge')),
  chain_id INTEGER NOT NULL,
  params JSONB NOT NULL,
  quote_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_quotes_user ON quotes(user_id, created_at DESC);
CREATE INDEX idx_quotes_expires ON quotes(expires_at) WHERE NOT used;

-- Gas prices table - stores historical gas prices for analytics
CREATE TABLE IF NOT EXISTS gas_prices (
  id BIGSERIAL PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  fast NUMERIC(78, 0) NOT NULL,
  standard NUMERIC(78, 0) NOT NULL,
  slow NUMERIC(78, 0) NOT NULL,
  base_fee NUMERIC(78, 0),
  CONSTRAINT valid_prices CHECK (fast >= standard AND standard >= slow)
);

CREATE INDEX idx_gas_prices_chain_time ON gas_prices(chain_id, timestamp DESC);

-- Portfolio snapshots - periodic portfolio state for analytics
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_id INTEGER NOT NULL,
  snapshot_time TIMESTAMP DEFAULT NOW(),
  native_balance NUMERIC(78, 0),
  token_balances JSONB DEFAULT '[]',
  nft_count INTEGER DEFAULT 0,
  total_value_usd NUMERIC(20, 2),
  CONSTRAINT valid_totals CHECK (nft_count >= 0 AND total_value_usd >= 0)
);

CREATE INDEX idx_portfolio_user_time ON portfolio_snapshots(user_id, snapshot_time DESC);
CREATE INDEX idx_portfolio_user_chain ON portfolio_snapshots(user_id, chain_id, snapshot_time DESC);

-- Audit log - tracks all significant events for security
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_type ON audit_log(event_type, timestamp DESC);
CREATE INDEX idx_audit_time ON audit_log(timestamp DESC);

-- Function to automatically update last_seen on user activity
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_seen = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_seen when new intent is created
CREATE TRIGGER trigger_update_last_seen_on_intent
AFTER INSERT ON intents
FOR EACH ROW
EXECUTE FUNCTION update_user_last_seen();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old quotes
CREATE OR REPLACE FUNCTION cleanup_old_quotes()
RETURNS void AS $$
BEGIN
  DELETE FROM quotes WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Views for common queries

-- Active conversations view
CREATE OR REPLACE VIEW active_conversations AS
SELECT 
  c.*,
  u.wallet_address,
  u.ens_name,
  COUNT(i.id) as intent_count
FROM conversations c
JOIN users u ON c.user_id = u.id
LEFT JOIN intents i ON c.id = i.conversation_id
WHERE c.ended_at IS NULL
GROUP BY c.id, u.wallet_address, u.ens_name;

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.wallet_address,
  u.ens_name,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT i.id) as intent_count,
  COUNT(DISTINCT t.id) as transaction_count,
  MAX(u.last_seen) as last_active
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN intents i ON u.id = i.user_id
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id;

-- Recent transactions view with intent details
CREATE OR REPLACE VIEW recent_transactions_with_intents AS
SELECT 
  t.*,
  i.raw_input,
  i.parsed_intent,
  i.confidence,
  i.risk_level,
  u.wallet_address
FROM transactions t
LEFT JOIN intents i ON t.intent_id = i.id
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- Comments
COMMENT ON TABLE users IS 'Stores user wallet addresses and preferences';
COMMENT ON TABLE conversations IS 'Tracks conversation sessions between users and the AI';
COMMENT ON TABLE intents IS 'Logs all parsed intents from natural language inputs';
COMMENT ON TABLE transactions IS 'Records all blockchain transactions initiated by users';
COMMENT ON TABLE sessions IS 'Manages SIWE authentication sessions';
COMMENT ON TABLE quotes IS 'Caches swap and bridge quotes for quick access';
COMMENT ON TABLE gas_prices IS 'Historical gas prices for analytics and optimization';
COMMENT ON TABLE portfolio_snapshots IS 'Periodic snapshots of user portfolios';
COMMENT ON TABLE audit_log IS 'Security audit trail for all significant events';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
