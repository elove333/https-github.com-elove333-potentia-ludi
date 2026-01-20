import { SessionOptions } from 'iron-session';

export interface SessionData {
  address?: string;
  userId?: number;
  nonce?: string;
  isAuthenticated?: boolean;
}

// Function to validate and get session options
function getSessionOptions(): SessionOptions {
  // Only validate at runtime (not during build)
  if (typeof window === 'undefined' && process.env.SESSION_SECRET) {
    if (process.env.SESSION_SECRET.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long');
    }
  }

  return {
    password: process.env.SESSION_SECRET || 'development-secret-min-32-chars-long-for-build',
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
