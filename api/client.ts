// Example client for interacting with the Planner → Executor API
import { Intent, TransactionPreview, BuiltTransaction } from '../src/types/intents';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * API client for Planner → Executor pipeline
 */
export class PlannerExecutorClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit natural language intent for processing
   */
  async submitIntent(
    input: string,
    address: string,
    chainId?: number
  ): Promise<{
    ok: boolean;
    intentId: string;
    intent: Intent;
    status: string;
    preview?: TransactionPreview;
  }> {
    const response = await fetch(`${this.baseUrl}/api/intents/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, address, chainId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit intent');
    }

    return response.json();
  }

  /**
   * Get intent details by ID
   */
  async getIntent(intentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/intents/${intentId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch intent');
    }

    return response.json();
  }

  /**
   * Build transaction after user confirms preview
   */
  async buildTransaction(intentId: string): Promise<{
    ok: boolean;
    intentId: string;
    transaction: BuiltTransaction;
  }> {
    const response = await fetch(`${this.baseUrl}/api/intents/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ intentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to build transaction');
    }

    return response.json();
  }

  /**
   * SIWE: Get nonce
   */
  async getNonce(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/siwe/nonce`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to get nonce');
    }

    const data = await response.json();
    return data.nonce;
  }

  /**
   * SIWE: Verify message and signature
   */
  async verifySignature(
    message: string,
    signature: string
  ): Promise<{
    ok: boolean;
    address: string;
    userId: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/siwe/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ message, signature }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }

    return response.json();
  }

  /**
   * SIWE: Logout
   */
  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/siwe/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }
}

// Example usage in a React component
export const useIntentSubmission = () => {
  const client = new PlannerExecutorClient();

  const submitIntent = async (input: string, address: string) => {
    try {
      // Submit intent
      const result = await client.submitIntent(input, address);
      
      console.log('Intent submitted:', result);
      console.log('Preview:', result.preview);

      // User reviews preview and confirms
      // ...

      // Build transaction
      const transaction = await client.buildTransaction(result.intentId);
      
      console.log('Transaction ready:', transaction.transaction);

      // Send to wallet for signing
      // const txHash = await sendTransaction(transaction.transaction);

      return { result, transaction };
    } catch (error) {
      console.error('Intent submission failed:', error);
      throw error;
    }
  };

  return { submitIntent };
};

// Example: React component using the API
/*
import { useState } from 'react';
import { PlannerExecutorClient } from './api/client';

export function IntentSubmitter({ address }: { address: string }) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const client = new PlannerExecutorClient();

  const handleSubmit = async () => {
    if (!input || !address) return;

    setLoading(true);
    try {
      const result = await client.submitIntent(input, address);
      setPreview(result.preview);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your intent (e.g., 'swap 100 USDC to ETH')"
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </button>

      {preview && (
        <div>
          <h3>Preview</h3>
          <p>{preview.summary}</p>
          <div>
            <h4>Token Changes:</h4>
            {preview.tokenDeltas.map((delta, i) => (
              <div key={i}>
                {delta.direction === 'out' ? '-' : '+'} {delta.amount} {delta.symbol}
              </div>
            ))}
          </div>
          <div>
            <h4>Gas Cost:</h4>
            <p>{preview.gasCost.totalCostEth} ETH (${preview.gasCost.totalCostUsd})</p>
          </div>
          {preview.warnings && preview.warnings.length > 0 && (
            <div>
              <h4>Warnings:</h4>
              {preview.warnings.map((warning, i) => (
                <p key={i} style={{ color: 'orange' }}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/
// API Client Configuration
// Express middleware and utilities for API routes

import { Request, Response, NextFunction } from 'express';
import { validateSession, extractSessionToken } from './lib/auth';
import { telemetryQueries } from './lib/database';

// Extended Request type with user context
export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

// Authentication middleware
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session token from request
    const authHeader = req.headers.authorization;
    const cookies = req.cookies;
    const sessionToken = extractSessionToken(authHeader, cookies);

    if (!sessionToken) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Validate session
    const session = await validateSession(sessionToken);

    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Attach user context to request
    req.userId = session.userId;
    req.sessionId = session.sessionId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional authentication middleware (doesn't fail if not authenticated)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const cookies = req.cookies;
    const sessionToken = extractSessionToken(authHeader, cookies);

    if (sessionToken) {
      const session = await validateSession(sessionToken);
      if (session) {
        req.userId = session.userId;
        req.sessionId = session.sessionId;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
}

// Error handler middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('API error:', error);

  // Log error to telemetry
  const userId = (req as AuthenticatedRequest).userId || null;
  telemetryQueries.log(
    userId,
    'api_error',
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    },
    req.ip,
    req.get('user-agent')
  ).catch(err => console.error('Failed to log error:', err));

  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
}

// Request validator middleware factory
export function validateRequest(schema: {
  body?: Record<string, any>;
  query?: Record<string, any>;
  params?: Record<string, any>;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      for (const [key, validator] of Object.entries(schema.body)) {
        const value = req.body?.[key];
        
        if (validator.required && (value === undefined || value === null)) {
          errors.push(`Missing required field: ${key}`);
        }

        if (value !== undefined && validator.type) {
          const actualType = typeof value;
          if (actualType !== validator.type) {
            errors.push(`Invalid type for ${key}: expected ${validator.type}, got ${actualType}`);
          }
        }
      }
    }

    // Validate query
    if (schema.query) {
      for (const [key, validator] of Object.entries(schema.query)) {
        const value = req.query[key];
        
        if (validator.required && !value) {
          errors.push(`Missing required query parameter: ${key}`);
        }
      }
    }

    // Validate params
    if (schema.params) {
      for (const [key, validator] of Object.entries(schema.params)) {
        const value = req.params[key];
        
        if (validator.required && !value) {
          errors.push(`Missing required path parameter: ${key}`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        errors
      });
      return;
    }

    next();
  };
}

// Rate limiting middleware (simplified)
export function rateLimit(
  maxRequests: number,
  windowMs: number = 60000
) {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    let userRequests = requests.get(key) || [];
    
    // Filter out old requests
    userRequests = userRequests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (userRequests.length >= maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
      return;
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
}

// CORS middleware
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

// Request logging middleware
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: boolean;
  version: string;
}

// Response helpers
export function success(res: Response, data: any, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    data
  });
}

export function error(res: Response, message: string, statusCode: number = 400): void {
  res.status(statusCode).json({
    success: false,
    error: message
  });
}
