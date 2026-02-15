import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { query, logger } from '@/lib/db/client';
import { cacheExists, cacheDel } from '@/lib/db/redis';

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();
    
    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature required' },
        { status: 400 }
      );
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    // Parse SIWE message
    const siweMessage = new SiweMessage(message);
    
    // Verify the nonce matches
    if (siweMessage.nonce !== session.nonce) {
      logger.warn({ expected: session.nonce, received: siweMessage.nonce }, 'Nonce mismatch');
      return NextResponse.json(
        { error: 'Invalid nonce' },
        { status: 400 }
      );
    }

    // Check if nonce exists in Redis
    const nonceExists = await cacheExists(`nonce:${siweMessage.nonce}`);
    if (!nonceExists) {
      logger.warn({ nonce: siweMessage.nonce }, 'Nonce not found or expired');
      return NextResponse.json(
        { error: 'Nonce expired or invalid' },
        { status: 400 }
      );
    }

    // Verify the signature
    const fields = await siweMessage.verify({ signature });
    
    if (!fields.success) {
      logger.warn({ address: siweMessage.address }, 'Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Delete the nonce from Redis (one-time use)
    await cacheDel(`nonce:${siweMessage.nonce}`);

    // Get or create user
    const addressBuffer = Buffer.from(siweMessage.address.slice(2), 'hex');
    const user = await query(
      'SELECT id, address, ens FROM users WHERE address = $1',
      [addressBuffer]
    );

    let userId: number;
    if (user.rows.length === 0) {
      // Create new user
      const newUser = await query(
        'INSERT INTO users (address) VALUES ($1) RETURNING id',
        [addressBuffer]
      );
      userId = newUser.rows[0].id;
      logger.info({ address: siweMessage.address, userId }, 'New user created');
    } else {
      userId = user.rows[0].id;
    }

    // Create session record in database
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined;

    await query(
      `INSERT INTO sessions 
       (user_id, siwe_message, nonce, issued_at, expires_at, user_agent, ip) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        message,
        siweMessage.nonce,
        new Date(siweMessage.issuedAt!),
        new Date(siweMessage.expirationTime!),
        userAgent,
        ip,
      ]
    );

    // Set session data
    session.address = siweMessage.address;
    session.userId = userId;
    session.isAuthenticated = true;
    session.nonce = undefined; // Clear nonce after use
    await session.save();

    logger.info({ address: siweMessage.address, userId }, 'User authenticated');

    return NextResponse.json({
      success: true,
      address: siweMessage.address,
      userId,
    });
  } catch (error) {
    logger.error({ error }, 'Error verifying SIWE message');
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
