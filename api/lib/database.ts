// Database connection utilities using pg (node-postgres)
import { Pool, PoolConfig, QueryResult } from 'pg';

// Database configuration
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Query helper with automatic error handling
export async function query<T = any>(
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
    console.error('Database query error', { text, params, error });
    throw error;
  }
}

// Transaction helper
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

// User operations
export const userQueries = {
  async findByAddress(address: string): Promise<any> {
    const result = await query(
      'SELECT * FROM users WHERE address = $1',
      [Buffer.from(address.replace('0x', ''), 'hex')]
    );
    return result.rows[0];
  },

  async create(address: string, ens?: string): Promise<any> {
    const result = await query(
      'INSERT INTO users (address, ens) VALUES ($1, $2) RETURNING *',
      [Buffer.from(address.replace('0x', ''), 'hex'), ens]
    );
    return result.rows[0];
  },

  async findOrCreate(address: string, ens?: string): Promise<any> {
    let user = await this.findByAddress(address);
    if (!user) {
      user = await this.create(address, ens);
    }
    return user;
  },
};

// Session operations
export const sessionQueries = {
  async create(
    userId: number,
    siweMessage: string,
    nonce: string,
    issuedAt: Date,
    expiresAt: Date,
    userAgent?: string,
    ip?: string
  ): Promise<any> {
    const result = await query(
      `INSERT INTO sessions (user_id, siwe_message, nonce, issued_at, expires_at, user_agent, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, siweMessage, nonce, issuedAt, expiresAt, userAgent, ip]
    );
    return result.rows[0];
  },

  async findByNonce(nonce: string): Promise<any> {
    const result = await query(
      'SELECT * FROM sessions WHERE nonce = $1',
      [nonce]
    );
    return result.rows[0];
  },

  async deleteExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    return result.rowCount || 0;
  },
};

// Intent operations
export const intentQueries = {
  async create(
    userId: number,
    intentType: string,
    intentJson: any
  ): Promise<any> {
    const result = await query(
      `INSERT INTO intents (user_id, intent_type, intent_json)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, intentType, JSON.stringify(intentJson)]
    );
    return result.rows[0];
  },

  async findById(id: string): Promise<any> {
    const result = await query(
      'SELECT * FROM intents WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async updateStatus(
    id: string,
    status: string,
    preview?: any,
    txHash?: string,
    errorMessage?: string
  ): Promise<any> {
    const result = await query(
      `UPDATE intents 
       SET status = $2, preview = $3, tx_hash = $4, error_message = $5
       WHERE id = $1 RETURNING *`,
      [id, status, preview ? JSON.stringify(preview) : null, txHash, errorMessage]
    );
    return result.rows[0];
  },

  async listByUser(userId: number, limit = 50): Promise<any[]> {
    const result = await query(
      'SELECT * FROM intents WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  },
};

// Limits operations
export const limitsQueries = {
  async get(userId: number): Promise<any> {
    const result = await query(
      'SELECT * FROM limits WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  },

  async set(
    userId: number,
    dailyUsdCap?: number,
    maxApprovalUsd?: number,
    allowlist?: string[]
  ): Promise<any> {
    const result = await query(
      `INSERT INTO limits (user_id, daily_usd_cap, max_approval_usd, allowlist)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         daily_usd_cap = COALESCE($2, limits.daily_usd_cap),
         max_approval_usd = COALESCE($3, limits.max_approval_usd),
         allowlist = COALESCE($4, limits.allowlist)
       RETURNING *`,
      [userId, dailyUsdCap, maxApprovalUsd, allowlist ? JSON.stringify(allowlist) : null]
    );
    return result.rows[0];
  },

  async incrementSpent(userId: number, amountUsd: number): Promise<void> {
    await query(
      'UPDATE limits SET daily_spent_usd = daily_spent_usd + $2 WHERE user_id = $1',
      [userId, amountUsd]
    );
  },

  async resetDaily(): Promise<number> {
    const result = await query(
      `UPDATE limits
       SET daily_spent_usd = 0, last_reset_at = NOW()
       WHERE last_reset_at < NOW() - INTERVAL '24 hours'`
    );
    return result.rowCount || 0;
  },
};

// Telemetry operations
export const telemetryQueries = {
  async log(userId: number | null, event: string, payload?: any): Promise<void> {
    await query(
      'INSERT INTO telemetry (user_id, event, payload) VALUES ($1, $2, $3)',
      [userId, event, payload ? JSON.stringify(payload) : null]
    );
  },
};

// Close pool on shutdown
export async function closePool(): Promise<void> {
  await pool.end();
}
