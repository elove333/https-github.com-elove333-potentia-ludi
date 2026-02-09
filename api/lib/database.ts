import { Pool, QueryResult, QueryResultRow } from 'pg';

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'potentia_ludi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Generic query function with proper type parameters
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Generic transaction function with proper type parameters
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// User queries
export const userQueries = {
  async findByAddress(address: string) {
    const result = await query<{
      id: string;
      wallet_address: string;
      ens_name: string | null;
      created_at: Date;
      last_seen: Date | null;
      preferences: Record<string, any>;
    }>(
      'SELECT * FROM users WHERE wallet_address = $1',
      [address]
    );
    return result.rows[0] || null;
  },

  async create(address: string, ensName?: string) {
    const result = await query<{
      id: string;
      wallet_address: string;
      ens_name: string | null;
      created_at: Date;
    }>(
      'INSERT INTO users (wallet_address, ens_name) VALUES ($1, $2) RETURNING *',
      [address, ensName || null]
    );
    return result.rows[0];
  },

  async findOrCreate(address: string, ensName?: string) {
    const existing = await this.findByAddress(address);
    if (existing) {
      return existing;
    }
    return this.create(address, ensName);
  },

  async updatePreferences(userId: string, preferences: Record<string, any>) {
    const result = await query<{ preferences: Record<string, any> }>(
      'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING preferences',
      [preferences, userId]
    );
    return result.rows[0];
  }
};

// Session queries
export const sessionQueries = {
  async create(
    userId: string,
    sessionToken: string,
    nonce: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ) {
    const result = await query<{
      id: string;
      user_id: string;
      session_token: string;
      nonce: string;
      expires_at: Date;
      created_at: Date;
    }>(
      `INSERT INTO sessions (user_id, session_token, nonce, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, sessionToken, nonce, expiresAt, ipAddress || null, userAgent || null]
    );
    return result.rows[0];
  },

  async findByToken(sessionToken: string) {
    const result = await query<{
      id: string;
      user_id: string;
      session_token: string;
      expires_at: Date;
    }>(
      `SELECT * FROM sessions 
       WHERE session_token = $1 AND expires_at > NOW()`,
      [sessionToken]
    );
    return result.rows[0] || null;
  },

  async delete(sessionToken: string) {
    await query(
      'DELETE FROM sessions WHERE session_token = $1',
      [sessionToken]
    );
  },

  async updateActivity(sessionToken: string) {
    await query(
      'UPDATE sessions SET last_active = NOW() WHERE session_token = $1',
      [sessionToken]
    );
  }
};

// Intent queries with proper JSONB handling
export const intentQueries = {
  async create(
    conversationId: string,
    userId: string,
    rawInput: string,
    intentJson: Record<string, any>,
    confidence: number,
    riskLevel: string
  ) {
    // Pass intentJson directly - PostgreSQL handles JSONB conversion
    const result = await query<{
      id: string;
      conversation_id: string;
      user_id: string;
      raw_input: string;
      parsed_intent: Record<string, any>;
      confidence: number;
      risk_level: string;
      status: string;
      created_at: Date;
    }>(
      `INSERT INTO intents (conversation_id, user_id, raw_input, parsed_intent, confidence, risk_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [conversationId, userId, rawInput, intentJson, confidence, riskLevel]
    );
    return result.rows[0];
  },

  async findById(id: string) {
    const result = await query<{
      id: string;
      conversation_id: string;
      user_id: string;
      raw_input: string;
      parsed_intent: Record<string, any>;
      confidence: number;
      risk_level: string;
      status: string;
      created_at: Date;
      executed_at: Date | null;
    }>(
      'SELECT * FROM intents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async updateStatus(
    id: string,
    status: string,
    executedAt?: Date,
    preview?: Record<string, any>
  ) {
    let query_text: string;
    let params: any[];

    if (executedAt && preview) {
      // Pass preview directly without JSON.stringify
      query_text = `UPDATE intents 
        SET status = $1, executed_at = $2, parsed_intent = parsed_intent || $3
        WHERE id = $4 RETURNING *`;
      params = [status, executedAt, preview || null, id];
    } else {
      query_text = `UPDATE intents SET status = $1 WHERE id = $2 RETURNING *`;
      params = [status, id];
    }

    const result = await query<{
      id: string;
      status: string;
      executed_at: Date | null;
    }>(query_text, params);
    return result.rows[0];
  },

  async listByUser(userId: string, limit: number = 50) {
    const result = await query<{
      id: string;
      raw_input: string;
      parsed_intent: Record<string, any>;
      confidence: number;
      risk_level: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT * FROM intents 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
};

// Conversation queries
export const conversationQueries = {
  async create(userId: string, context?: Record<string, any>) {
    // Pass context directly without JSON.stringify
    const result = await query<{
      id: string;
      user_id: string;
      started_at: Date;
      context: Record<string, any>;
      message_count: number;
    }>(
      'INSERT INTO conversations (user_id, context) VALUES ($1, $2) RETURNING *',
      [userId, context || {}]
    );
    return result.rows[0];
  },

  async findActive(userId: string) {
    const result = await query<{
      id: string;
      user_id: string;
      started_at: Date;
      context: Record<string, any>;
      message_count: number;
    }>(
      `SELECT * FROM conversations 
       WHERE user_id = $1 AND ended_at IS NULL 
       ORDER BY started_at DESC 
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async updateContext(id: string, context: Record<string, any>) {
    // Pass context directly without JSON.stringify
    const result = await query<{ context: Record<string, any> }>(
      'UPDATE conversations SET context = $1 WHERE id = $2 RETURNING context',
      [context, id]
    );
    return result.rows[0];
  },

  async incrementMessageCount(id: string) {
    await query(
      'UPDATE conversations SET message_count = message_count + 1 WHERE id = $1',
      [id]
    );
  },

  async end(id: string) {
    await query(
      'UPDATE conversations SET ended_at = NOW() WHERE id = $1',
      [id]
    );
  }
};

// Transaction queries
export const transactionQueries = {
  async create(
    userId: string,
    intentId: string | null,
    chainId: number,
    fromAddress: string,
    toAddress: string | null,
    value: string,
    details?: Record<string, any>
  ) {
    // Pass details directly without JSON.stringify
    const result = await query<{
      id: string;
      user_id: string;
      intent_id: string | null;
      chain_id: number;
      from_address: string;
      to_address: string | null;
      value: string;
      status: string;
      details: Record<string, any>;
      created_at: Date;
    }>(
      `INSERT INTO transactions (user_id, intent_id, chain_id, from_address, to_address, value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, intentId, chainId, fromAddress, toAddress, value, details || {}]
    );
    return result.rows[0];
  },

  async updateHash(id: string, txHash: string) {
    const result = await query<{ tx_hash: string }>(
      'UPDATE transactions SET tx_hash = $1 WHERE id = $2 RETURNING tx_hash',
      [txHash, id]
    );
    return result.rows[0];
  },

  async updateStatus(
    id: string,
    status: string,
    gasUsed?: string,
    gasPrice?: string,
    errorMessage?: string
  ) {
    const result = await query<{
      id: string;
      status: string;
      confirmed_at: Date | null;
    }>(
      `UPDATE transactions 
       SET status = $1, 
           gas_used = COALESCE($2, gas_used),
           gas_price = COALESCE($3, gas_price),
           error_message = $4,
           confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END
       WHERE id = $5
       RETURNING *`,
      [status, gasUsed || null, gasPrice || null, errorMessage || null, id]
    );
    return result.rows[0];
  },

  async listByUser(userId: string, limit: number = 50) {
    const result = await query<{
      id: string;
      chain_id: number;
      tx_hash: string | null;
      from_address: string;
      to_address: string | null;
      value: string;
      status: string;
      details: Record<string, any>;
      created_at: Date;
      confirmed_at: Date | null;
    }>(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
};

// Rate limiting queries
export const limitsQueries = {
  async get(userId: string, limitType: string) {
    const result = await query<{
      count: number;
      allowlist: string[] | null;
    }>(
      `SELECT COUNT(*)::int as count, u.preferences->'allowlist' as allowlist
       FROM intents i
       JOIN users u ON u.id = i.user_id
       WHERE i.user_id = $1 
         AND i.created_at > NOW() - INTERVAL '1 hour'
         AND i.risk_level = $2
       GROUP BY u.preferences`,
      [userId, limitType]
    );
    return result.rows[0] || { count: 0, allowlist: null };
  },

  async set(userId: string, allowlist: string[]) {
    // Pass allowlist directly without JSON.stringify
    const result = await query<{ preferences: Record<string, any> }>(
      `UPDATE users 
       SET preferences = preferences || jsonb_build_object('allowlist', $1::jsonb)
       WHERE id = $2
       RETURNING preferences`,
      [allowlist || null, userId]
    );
    return result.rows[0];
  }
};

// Telemetry queries
export const telemetryQueries = {
  async log(
    userId: string | null,
    eventType: string,
    payload: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Pass payload directly without JSON.stringify
    await query(
      `INSERT INTO audit_log (user_id, event_type, event_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventType, payload || null, ipAddress || null, userAgent || null]
    );
  }
};

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}
