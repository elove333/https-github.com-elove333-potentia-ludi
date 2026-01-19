// Telemetry service for logging user events
import { query, logger } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

export interface TelemetryEventData {
  userId?: number;
  sessionId?: string;
  event: string;
  payload?: Record<string, any>;
  correlationId?: string;
}

export async function logTelemetry(data: TelemetryEventData): Promise<void> {
  try {
    const correlationId = data.correlationId || uuidv4();

    await query(
      `INSERT INTO telemetry (user_id, session_id, event, payload, correlation_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.userId || null,
        data.sessionId || null,
        data.event,
        data.payload ? JSON.stringify(data.payload) : null,
        correlationId,
      ]
    );

    logger.info(
      {
        event: data.event,
        userId: data.userId,
        correlationId,
      },
      'Telemetry event logged'
    );
  } catch (error) {
    logger.error({ error, event: data.event }, 'Failed to log telemetry');
  }
}

// Common event types
export const TelemetryEvents = {
  USER_REGISTERED: 'user.registered',
  USER_AUTHENTICATED: 'user.authenticated',
  USER_LOGOUT: 'user.logout',
  
  INTENT_PARSED: 'intent.parsed',
  INTENT_PREVIEW: 'intent.preview',
  INTENT_EXECUTED: 'intent.executed',
  INTENT_FAILED: 'intent.failed',
  
  SIMULATION_SUCCESS: 'simulation.success',
  SIMULATION_FAILED: 'simulation.failed',
  
  QUOTE_FETCHED: 'quote.fetched',
  QUOTE_STALE: 'quote.stale',
  
  RISK_DETECTED: 'risk.detected',
  LIMIT_EXCEEDED: 'limit.exceeded',
  
  REWARD_FETCHED: 'reward.fetched',
  REWARD_CLAIMED: 'reward.claimed',
} as const;

// Analytics helpers
export async function getEventStats(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const result = await query(
    `SELECT event, COUNT(*) as count
     FROM telemetry
     WHERE user_id = $1
       AND created_at >= $2
       AND created_at <= $3
     GROUP BY event`,
    [userId, startDate, endDate]
  );

  const stats: Record<string, number> = {};
  for (const row of result.rows) {
    stats[row.event] = parseInt(row.count);
  }

  return stats;
}

export async function getRecentEvents(
  userId: number,
  limit: number = 10
): Promise<any[]> {
  const result = await query(
    `SELECT id, event, payload, correlation_id, created_at
     FROM telemetry
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}
