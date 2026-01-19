/**
 * PostgreSQL Database Client
 * 
 * This module provides a type-safe database client for the Conversational Web3 Wallet Hub.
 * 
 * Setup:
 * 1. Install pg: npm install pg @types/pg
 * 2. Set DATABASE_URL environment variable
 * 3. Run schema: psql $DATABASE_URL -f src/backend/database/schema.sql
 */

/**
 * Database configuration
 */
export const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/potentia_ludi',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * Intent record from database
 */
export interface IntentRecord {
  id: string;
  user_address: string;
  raw_message: string;
  parsed_intent: any;
  status: 'pending' | 'confirmed' | 'executed' | 'failed' | 'cancelled';
  created_at: Date;
  executed_at?: Date;
  transaction_hash?: string;
  error_message?: string;
  confidence_score?: number;
  requires_confirmation: boolean;
  confirmation_level?: string;
}

/**
 * User preferences from database
 */
export interface UserPreferencesRecord {
  user_address: string;
  default_chain_id: number;
  slippage_tolerance: number;
  gas_preference: 'low' | 'medium' | 'high';
  auto_confirm_below?: number;
  preferred_language: string;
  notifications_enabled: boolean;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database client class
 * 
 * TODO: Implement using pg Pool
 */
export class DatabaseClient {
  private pool: any; // TODO: Type as Pool from 'pg'
  
  constructor() {
    // TODO: Initialize pg Pool
    // import { Pool } from 'pg';
    // this.pool = new Pool(DB_CONFIG);
  }
  
  /**
   * Execute a query
   * 
   * @param query - SQL query string
   * @param params - Query parameters
   * @returns Query result
   */
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    // TODO: Implement query execution
    // const result = await this.pool.query(query, params);
    // return result.rows;
    
    console.log('DB Query:', query, params);
    return [] as T[];
  }
  
  /**
   * Save an intent to the database
   * 
   * @param intent - Intent to save
   * @returns Saved intent with ID
   */
  async saveIntent(intent: Omit<IntentRecord, 'id' | 'created_at'>): Promise<IntentRecord> {
    const query = `
      INSERT INTO intents (
        user_address, raw_message, parsed_intent, status,
        requires_confirmation, confidence_score, confirmation_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const params = [
      intent.user_address,
      intent.raw_message,
      JSON.stringify(intent.parsed_intent),
      intent.status,
      intent.requires_confirmation,
      intent.confidence_score,
      intent.confirmation_level,
    ];
    
    const results = await this.query<IntentRecord>(query, params);
    return results[0];
  }
  
  /**
   * Get user preferences
   * 
   * @param userAddress - User's wallet address
   * @returns User preferences or null if not found
   */
  async getUserPreferences(userAddress: string): Promise<UserPreferencesRecord | null> {
    const query = 'SELECT * FROM user_preferences WHERE user_address = $1';
    const results = await this.query<UserPreferencesRecord>(query, [userAddress]);
    return results[0] || null;
  }
  
  /**
   * Update user preferences
   * 
   * @param userAddress - User's wallet address
   * @param preferences - Preferences to update
   */
  async updateUserPreferences(
    userAddress: string,
    preferences: Partial<Omit<UserPreferencesRecord, 'user_address' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields = Object.keys(preferences);
    const values = Object.values(preferences);
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
    const query = `
      INSERT INTO user_preferences (user_address, ${fields.join(', ')})
      VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(', ')})
      ON CONFLICT (user_address) 
      DO UPDATE SET ${setClause}
    `;
    
    await this.query(query, [userAddress, ...values]);
  }
  
  /**
   * Get recent intents for a user
   * 
   * @param userAddress - User's wallet address
   * @param limit - Maximum number of intents to return
   * @returns Array of recent intents
   */
  async getRecentIntents(userAddress: string, limit: number = 10): Promise<IntentRecord[]> {
    const query = `
      SELECT * FROM intents
      WHERE user_address = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    return this.query<IntentRecord>(query, [userAddress, limit]);
  }
  
  /**
   * Update intent status
   * 
   * @param intentId - Intent ID
   * @param status - New status
   * @param txHash - Optional transaction hash
   * @param error - Optional error message
   */
  async updateIntentStatus(
    intentId: string,
    status: IntentRecord['status'],
    txHash?: string,
    error?: string
  ): Promise<void> {
    const query = `
      UPDATE intents
      SET status = $2, transaction_hash = $3, error_message = $4,
          executed_at = CASE WHEN $2 = 'executed' THEN NOW() ELSE executed_at END
      WHERE id = $1
    `;
    
    await this.query(query, [intentId, status, txHash, error]);
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    // TODO: Implement connection closing
    // await this.pool.end();
  }
  
  /**
   * Test database connection
   * 
   * @returns Whether connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let dbInstance: DatabaseClient | null = null;

/**
 * Get database client instance
 * 
 * @returns Database client
 */
export function getDatabase(): DatabaseClient {
  if (!dbInstance) {
    dbInstance = new DatabaseClient();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
