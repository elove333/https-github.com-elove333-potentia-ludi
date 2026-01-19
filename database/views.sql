-- Funnel Query Views for Success Metrics
-- Pre-aggregated views for monitoring success funnels and conversion rates

-- View 1: New User First Success Funnel
-- Tracks first-time user login to first successful transaction
CREATE OR REPLACE VIEW v_new_user_first_success AS
SELECT
    DATE_TRUNC('day', first_login.created_at) AS date,
    COUNT(DISTINCT first_login.user_address) AS new_users,
    COUNT(DISTINCT first_tx.user_address) AS users_with_first_tx,
    ROUND(
        100.0 * COUNT(DISTINCT first_tx.user_address) / 
        NULLIF(COUNT(DISTINCT first_login.user_address), 0),
        2
    ) AS first_success_rate_pct,
    AVG(
        EXTRACT(EPOCH FROM (first_tx.created_at - first_login.created_at)) / 60
    ) AS avg_time_to_first_tx_minutes
FROM (
    SELECT 
        user_address,
        MIN(created_at) AS created_at
    FROM telemetry
    WHERE event_type = 'siwe_login_success'
        AND user_address IS NOT NULL
    GROUP BY user_address
) first_login
LEFT JOIN (
    SELECT 
        user_address,
        MIN(created_at) AS created_at
    FROM telemetry
    WHERE event_type = 'tx_mined'
        AND payload->>'status' = 'success'
    GROUP BY user_address
) first_tx ON first_login.user_address = first_tx.user_address
GROUP BY DATE_TRUNC('day', first_login.created_at)
ORDER BY date DESC;

-- View 2: Quote Success Conversion Rate
-- Tracks quote requests to successful transaction sends
CREATE OR REPLACE VIEW v_quote_success_conversion AS
SELECT
    DATE_TRUNC('hour', q.created_at) AS hour,
    COUNT(DISTINCT q.session_id) AS quote_requests,
    COUNT(DISTINCT CASE 
        WHEN q.payload->>'simulation_status' = 'ok' 
        THEN q.session_id 
    END) AS successful_simulations,
    COUNT(DISTINCT tx.session_id) AS transactions_sent,
    COUNT(DISTINCT CASE 
        WHEN tx.payload->>'status' = 'success'
        THEN tx.session_id
    END) AS transactions_mined,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN q.payload->>'simulation_status' = 'ok' THEN q.session_id END) / 
        NULLIF(COUNT(DISTINCT q.session_id), 0),
        2
    ) AS simulation_success_rate_pct,
    ROUND(
        100.0 * COUNT(DISTINCT tx.session_id) / 
        NULLIF(COUNT(DISTINCT q.session_id), 0),
        2
    ) AS quote_to_send_conversion_pct,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN tx.payload->>'status' = 'success' THEN tx.session_id END) / 
        NULLIF(COUNT(DISTINCT tx.session_id), 0),
        2
    ) AS tx_success_rate_pct
FROM telemetry q
LEFT JOIN telemetry tx ON q.session_id = tx.session_id 
    AND tx.event_type IN ('tx_send', 'tx_mined')
    AND tx.created_at > q.created_at
WHERE q.event_type IN ('quote_requested', 'simulation_ok', 'simulation_revert')
    AND q.created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', q.created_at)
ORDER BY hour DESC;

-- View 3: Transaction Reliability Metrics
-- Monitors transaction success rates and revert patterns
CREATE OR REPLACE VIEW v_transaction_reliability AS
SELECT
    DATE_TRUNC('hour', created_at) AS hour,
    chain_id,
    COUNT(*) AS total_transactions,
    COUNT(*) FILTER (WHERE event_type = 'simulation_ok') AS simulations_ok,
    COUNT(*) FILTER (WHERE event_type = 'simulation_revert') AS simulations_reverted,
    COUNT(*) FILTER (WHERE event_type = 'tx_send') AS transactions_sent,
    COUNT(*) FILTER (
        WHERE event_type = 'tx_mined' AND payload->>'status' = 'success'
    ) AS transactions_successful,
    COUNT(*) FILTER (
        WHERE event_type = 'tx_mined' AND payload->>'status' = 'failed'
    ) AS transactions_failed,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE event_type = 'simulation_revert') /
        NULLIF(COUNT(*) FILTER (WHERE event_type IN ('simulation_ok', 'simulation_revert')), 0),
        2
    ) AS revert_rate_pct,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE event_type = 'tx_mined' AND payload->>'status' = 'failed') /
        NULLIF(COUNT(*) FILTER (WHERE event_type = 'tx_mined'), 0),
        2
    ) AS failure_rate_pct,
    AVG(
        CASE 
            WHEN event_type = 'tx_mined' 
            THEN (payload->>'gas_used')::NUMERIC 
        END
    ) AS avg_gas_used
FROM telemetry
WHERE event_category = 'transaction'
    AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), chain_id
ORDER BY hour DESC, chain_id;

-- View 4: Reward Tracking Funnel
-- Monitors reward discovery to claim conversion
CREATE OR REPLACE VIEW v_reward_funnel AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    chain_id,
    COUNT(*) FILTER (WHERE event_type = 'reward_found') AS rewards_found,
    COUNT(*) FILTER (WHERE event_type = 'reward_claimed') AS rewards_claimed,
    SUM((payload->>'reward_amount')::NUMERIC) FILTER (
        WHERE event_type = 'reward_found'
    ) AS total_rewards_value,
    SUM((payload->>'reward_amount')::NUMERIC) FILTER (
        WHERE event_type = 'reward_claimed'
    ) AS claimed_rewards_value,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE event_type = 'reward_claimed') /
        NULLIF(COUNT(*) FILTER (WHERE event_type = 'reward_found'), 0),
        2
    ) AS claim_rate_pct
FROM telemetry
WHERE event_category = 'reward'
    AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), chain_id
ORDER BY date DESC, chain_id;

-- View 5: Guardrails Violations Monitor
-- Tracks safety guardrail triggers for monitoring
CREATE OR REPLACE VIEW v_guardrails_violations AS
SELECT
    DATE_TRUNC('hour', created_at) AS hour,
    payload->>'violation_type' AS violation_type,
    COUNT(*) AS violation_count,
    COUNT(DISTINCT user_address) AS affected_users,
    COUNT(DISTINCT session_id) AS affected_sessions,
    ARRAY_AGG(DISTINCT payload->>'reason') AS violation_reasons
FROM telemetry
WHERE event_type = 'guardrail_violation'
    AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), payload->>'violation_type'
ORDER BY hour DESC, violation_count DESC;

-- View 6: User Engagement Metrics
-- Tracks overall user activity and engagement
CREATE OR REPLACE VIEW v_user_engagement AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    COUNT(DISTINCT user_address) AS daily_active_users,
    COUNT(DISTINCT session_id) AS total_sessions,
    COUNT(*) AS total_events,
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT user_address), 0), 2) AS events_per_user,
    ROUND(COUNT(DISTINCT session_id)::NUMERIC / NULLIF(COUNT(DISTINCT user_address), 0), 2) AS sessions_per_user,
    COUNT(*) FILTER (WHERE event_category = 'transaction') AS transaction_events,
    COUNT(*) FILTER (WHERE event_category = 'reward') AS reward_events,
    COUNT(*) FILTER (WHERE event_category = 'auth') AS auth_events
FROM telemetry
WHERE created_at > NOW() - INTERVAL '90 days'
    AND user_address IS NOT NULL
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Comments on views
COMMENT ON VIEW v_new_user_first_success IS 'Funnel tracking new users from first login to first successful transaction';
COMMENT ON VIEW v_quote_success_conversion IS 'Conversion funnel from quote request through simulation to transaction success';
COMMENT ON VIEW v_transaction_reliability IS 'Transaction success rates and failure patterns by chain';
COMMENT ON VIEW v_reward_funnel IS 'Reward discovery to claim conversion metrics';
COMMENT ON VIEW v_guardrails_violations IS 'Safety guardrail violation monitoring';
COMMENT ON VIEW v_user_engagement IS 'Overall user engagement and activity metrics';
