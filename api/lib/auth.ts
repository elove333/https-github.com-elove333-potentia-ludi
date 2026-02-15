// SIWE (Sign-In with Ethereum) authentication utilities
import { generateNonce, SiweMessage } from 'siwe';
import { userQueries, sessionQueries } from '../lib/database';

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Nonce expiry: 5 minutes
const NONCE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generate a new nonce for SIWE authentication
 */
export async function createNonce(): Promise<string> {
  const nonce = generateNonce();
  nonceStore.set(nonce, { nonce, timestamp: Date.now() });
  
  // Clean up expired nonces
  cleanExpiredNonces();
  
  return nonce;
}

/**
 * Verify SIWE message and signature
 */
export async function verifySiwe(
  message: string,
  signature: string,
  userAgent?: string,
  ip?: string
): Promise<{ address: string; userId: number; sessionId: string }> {
  // Parse SIWE message
  const siweMessage = new SiweMessage(message);
  
  // Verify signature
  const fields = await siweMessage.verify({ signature });
  
  if (!fields.success) {
    throw new Error('Invalid signature');
  }
  
  // Check nonce
  const storedNonce = nonceStore.get(fields.data.nonce);
  if (!storedNonce) {
    throw new Error('Invalid or expired nonce');
  }
  
  // Remove used nonce
  nonceStore.delete(fields.data.nonce);
  
  // Check expiration
  if (fields.data.expirationTime && new Date(fields.data.expirationTime) < new Date()) {
    throw new Error('Message expired');
  }
  
  // Get or create user
  const address = fields.data.address;
  const user = await userQueries.findOrCreate(address);
  
  // Create session
  const issuedAt = fields.data.issuedAt ? new Date(fields.data.issuedAt) : new Date();
  const expiresAt = fields.data.expirationTime 
    ? new Date(fields.data.expirationTime)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
  
  const session = await sessionQueries.create(
    user.id,
    message,
    fields.data.nonce,
    issuedAt,
    expiresAt,
    userAgent,
    ip
  );
  
  return {
    address,
    userId: user.id,
    sessionId: session.id,
  };
}

/**
 * Clean up expired nonces
 */
function cleanExpiredNonces(): void {
  const now = Date.now();
  for (const [nonce, data] of nonceStore.entries()) {
    if (now - data.timestamp > NONCE_EXPIRY_MS) {
      nonceStore.delete(nonce);
    }
  }
}

/**
 * Validate session ID
 */
export async function validateSession(sessionId: string): Promise<number | null> {
  const session = await sessionQueries.findByNonce(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check expiration
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }
  
  return session.user_id;