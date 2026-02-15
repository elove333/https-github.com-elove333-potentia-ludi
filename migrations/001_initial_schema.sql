-- Potentia Ludi Database Schema
-- PostgreSQL schema for Conversational Web3 Wallet Hub

-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  address BYTEA UNIQUE NOT NULL,
  ens VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_address ON users(address);

-- Sessions table (SIWE sessions)
CREATE TABLE sessions (
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

-- Intents table
CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  intent_type TEXT NOT NULL,
  intent_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  preview JSONB,
  tx_hash VARCHAR(66),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intents_user_id ON intents(user_id);
CREATE INDEX idx_intents_status ON intents(status);
CREATE INDEX idx_intents_intent_type ON intents(intent_type);
CREATE INDEX idx_intents_created_at ON intents(created_at DESC);

-- User limits table
CREATE TABLE limits (
  user_id BIGINT REFERENCES users(id) PRIMARY KEY ON DELETE CASCADE,
  daily_usd_cap NUMERIC DEFAULT 1000.00,
  max_approval_usd NUMERIC DEFAULT 10000.00,
  allowlist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry table
CREATE TABLE telemetry (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  payload JSONB,
  correlation_id VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_user_id ON telemetry(user_id);
CREATE INDEX idx_telemetry_event ON telemetry(event);
CREATE INDEX idx_telemetry_correlation_id ON telemetry(correlation_id);
CREATE INDEX idx_telemetry_created_at ON telemetry(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_intents_updated_at
    BEFORE UPDATE ON intents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_limits_updated_at
    BEFORE UPDATE ON limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
