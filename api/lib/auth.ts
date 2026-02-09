import { SiweMessage } from 'siwe';
import { randomBytes } from 'crypto';
import { userQueries, sessionQueries, telemetryQueries } from './database';

// Generate a cryptographic nonce for SIWE authentication
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

// Generate a secure session token
export function generateSessionToken(): string {
  return randomBytes(48).toString('hex');
}

// Verify SIWE signature and return verified data
export async function verifySiweSignature(
  message: string,
  signature: string,
  nonce: string
): Promise<{
  address: string;
  chainId: number;
  issuedAt: string;
  expirationTime?: string;
  nonce: string;
}> {
  try {
    // Create SIWE message instance
    const siweMessage = new SiweMessage(message);

    // Verify the signature
    const result = await siweMessage.verify({ signature });

    // Check if verification was successful
    if (!result || !result.success) {
      throw new Error('Invalid signature');
    }

    // Extract verified data
    const verified = result.data;

    // Validate nonce matches
    if (verified.nonce !== nonce) {
      throw new Error('Nonce mismatch');
    }

    // Check expiration time
    if (verified.expirationTime) {
      const expirationDate = new Date(verified.expirationTime);
      if (expirationDate < new Date()) {
        throw new Error('Signature expired');
      }
    }

    // Return verified data
    return {
      address: verified.address,
      chainId: verified.chainId,
      issuedAt: verified.issuedAt || new Date().toISOString(),
      expirationTime: verified.expirationTime || undefined,
      nonce: verified.nonce
    };
  } catch (error) {
    console.error('SIWE verification error:', error);
    throw error;
  }
}

// Authenticate user with SIWE and create session
export async function authenticateWithSiwe(
  message: string,
  signature: string,
  nonce: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  sessionToken: string;
  user: {
    id: string;
    wallet_address: string;
    ens_name: string | null;
  };
}> {
  // Verify the SIWE signature
  const verified = await verifySiweSignature(message, signature, nonce);

  // Normalize address to lowercase
  const address = verified.address.toLowerCase();

  // Find or create user
  const user = await userQueries.findOrCreate(address);

  // Generate session token
  const sessionToken = generateSessionToken();

  // Calculate session expiration (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create session
  await sessionQueries.create(
    user.id,
    sessionToken,
    verified.nonce,
    expiresAt,
    ipAddress,
    userAgent
  );

  // Log authentication event
  await telemetryQueries.log(
    user.id,
    'siwe_auth_success',
    {
      address: verified.address,
      chainId: verified.chainId,
      issuedAt: verified.issuedAt
    },
    ipAddress,
    userAgent
  );

  return {
    sessionToken,
    user: {
      id: user.id,
      wallet_address: user.wallet_address,
      ens_name: user.ens_name
    }
  };
}

// Validate session token and return user
export async function validateSession(sessionToken: string): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const session = await sessionQueries.findByToken(sessionToken);

  if (!session) {
    return null;
  }

  // Update last activity timestamp
  await sessionQueries.updateActivity(sessionToken);

  return {
    userId: session.user_id,
    sessionId: session.id
  };
}

// Logout user and delete session
export async function logout(sessionToken: string): Promise<void> {
  const session = await sessionQueries.findByToken(sessionToken);

  if (session) {
    await telemetryQueries.log(
      session.user_id,
      'logout',
      { sessionId: session.id }
    );
  }

  await sessionQueries.delete(sessionToken);
}

// Middleware to extract and validate session from request
export function extractSessionToken(
  authHeader: string | undefined,
  cookies: Record<string, string> | undefined
): string | null {
  // Check Authorization header first (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  if (cookies && cookies.session) {
    return cookies.session;
  }

  return null;
}

// Verify if address is authorized for high-risk operations
export async function checkAddressAuthorization(
  userId: string,
  address: string
): Promise<boolean> {
  const user = await userQueries.findByAddress(address);

  if (!user || user.id !== userId) {
    return false;
  }

  // Check if address is in allowlist for certain operations
  const allowlist = user.preferences?.allowlist as string[] | undefined;

  if (allowlist && Array.isArray(allowlist)) {
    return allowlist.includes(address.toLowerCase());
  }

  return true;
}

// Rate limit check for user operations
export async function checkRateLimit(
  userId: string,
  operation: string,
  limit: number,
  windowMinutes: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  // This is a simplified version - in production you'd use Redis
  // For now, we'll just check the database
  try {
    const result = await telemetryQueries.log(
      userId,
      `rate_limit_check_${operation}`,
      { limit, windowMinutes }
    );

    // TODO: Implement actual rate limiting logic with Redis
    return {
      allowed: true,
      remaining: limit
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      allowed: false,
      remaining: 0
    };
  }
}
