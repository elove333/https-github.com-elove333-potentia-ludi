import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { cacheSet } from '@/lib/db/redis';
import { logger } from '@/lib/db/client';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    // Generate a new nonce
    const nonce = generateNonce();
    
    // Store nonce in session
    session.nonce = nonce;
    await session.save();
    
    // Also store in Redis with TTL (10 minutes)
    await cacheSet(`nonce:${nonce}`, { created: Date.now() }, 600);
    
    logger.info({ nonce }, 'Generated SIWE nonce');
    
    return NextResponse.json({ nonce });
  } catch (error) {
    logger.error({ error }, 'Error generating nonce');
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
