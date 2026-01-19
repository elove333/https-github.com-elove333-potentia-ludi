import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { logger } from '@/lib/db/client';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    const address = session.address;
    
    // Destroy session
    session.destroy();
    
    logger.info({ address }, 'User logged out');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Error during logout');
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
