-- Potentia Ludi Database Schema
-- PostgreSQL 14+ required

-- Users table: stores wallet addresses and metadata
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  address BYTEA UNIQUE NOT NULL,
  ens VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_address ON users(address);

-- Sessions table: SIWE authentication sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  siwe_message TEXT NOT NULL,
  nonce VARCHAR(128) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_nonce ON sessions(nonce);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Intents table: stores user intents and their execution status
CREATE TABLE IF NOT EXISTS intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  intent_type TEXT NOT NULL,
  intent_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  preview JSONB,
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intents_user_id ON intents(user_id);
CREATE INDEX idx_intents_status ON intents(status);
CREATE INDEX idx_intents_intent_type ON intents(intent_type);
CREATE INDEX idx_intents_created_at ON intents(created_at DESC);

-- Limits table: per-user spending and approval limits
CREATE TABLE IF NOT EXISTS limits (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_usd_cap NUMERIC(20, 6),
  max_approval_usd NUMERIC(20, 6),
  allowlist JSONB DEFAULT '[]'::JSONB,
  daily_spent_usd NUMERIC(20, 6) DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry table: event logging for analytics and debugging
CREATE TABLE IF NOT EXISTS telemetry (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_user_id ON telemetry(user_id);
CREATE INDEX idx_telemetry_event ON telemetry(event);
CREATE INDEX idx_telemetry_created_at ON telemetry(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_intents_updated_at
  BEFORE UPDATE ON intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_limits_updated_at
  BEFORE UPDATE ON limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily spending limits
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE limits
  SET daily_spent_usd = 0,
      last_reset_at = NOW()
  WHERE last_reset_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user wallet addresses and profile information';
COMMENT ON TABLE sessions IS 'SIWE authentication sessions with nonce tracking';
COMMENT ON TABLE intents IS 'User intents for swaps, bridges, claims, etc.';
COMMENT ON TABLE limits IS 'Per-user spending limits and allowlists';
COMMENT ON TABLE telemetry IS 'Event logging for analytics and debugging';
-- Telemetry Events Table
-- Stores all telemetry events for monitoring and analytics

CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    user_address VARCHAR(42),
    session_id VARCHAR(255),
    chain_id INTEGER,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON telemetry(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_category ON telemetry(event_category);
CREATE INDEX IF NOT EXISTS idx_telemetry_user_address ON telemetry(user_address);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_chain_id ON telemetry(chain_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_session_id ON telemetry(session_id);

-- GIN index for JSONB payload queries
CREATE INDEX IF NOT EXISTS idx_telemetry_payload ON telemetry USING GIN(payload);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_telemetry_user_created ON telemetry(user_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_type_created ON telemetry(event_type, created_at DESC);

-- Comment on table
COMMENT ON TABLE telemetry IS 'Stores all telemetry events for analytics and monitoring';
COMMENT ON COLUMN telemetry.event_type IS 'Specific event identifier (e.g., siwe_login_success, simulation_ok)';
COMMENT ON COLUMN telemetry.event_category IS 'Category of event (auth, transaction, simulation, reward, guardrail)';
COMMENT ON COLUMN telemetry.payload IS 'JSON payload containing event-specific data';
