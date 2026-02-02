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
