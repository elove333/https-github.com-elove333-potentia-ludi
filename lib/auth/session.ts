import { SessionOptions } from 'iron-session';

export interface SessionData {
  address?: string;
  userId?: number;
  nonce?: string;
  isAuthenticated?: boolean;
}

// Function to validate and get session options
function getSessionOptions(): SessionOptions {
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const secret = process.env.SESSION_SECRET;

  // During build time, use a placeholder secret
  if (isBuildTime) {
    return {
      password: 'build-time-placeholder-secret-32chars-minimum!!',
      cookieName: 'potentia_ludi_session',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    };
  }

  // At runtime, validate the secret exists and meets requirements
  if (!secret) {
    if (isDevelopment) {
      console.warn('⚠️  SESSION_SECRET not set, using development default (NOT FOR PRODUCTION)');
      return {
        password: 'development-default-secret-must-be-32-chars-long',
        cookieName: 'potentia_ludi_session',
        cookieOptions: {
          secure: false,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        },
      };
    }
    throw new Error('SESSION_SECRET environment variable is required in production');
  }

  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  return {
    password: secret,
    cookieName: 'potentia_ludi_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

export const sessionOptions: SessionOptions = getSessionOptions();
