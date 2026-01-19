// API Route: POST /api/siwe/verify
// Verify SIWE message and signature, create session

import { verifySiwe } from '../../lib/auth';
import { telemetryQueries } from '../../lib/database';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { message, signature } = body;
    
    if (!message || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing message or signature' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get user agent and IP from headers
    const userAgent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               undefined;
    
    // Verify SIWE
    const result = await verifySiwe(message, signature, userAgent, ip);
    
    await telemetryQueries.log(result.userId, 'siwe_verified', {
      address: result.address,
      sessionId: result.sessionId,
    });
    
    // Set session cookie (httpOnly, secure)
    const response = new Response(
      JSON.stringify({
        ok: true,
        address: result.address,
        userId: result.userId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    // In production: Set httpOnly, secure cookie
    // response.headers.set('Set-Cookie', `sessionId=${result.sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7*24*60*60}`);
    
    return response;
  } catch (error: any) {
    console.error('SIWE verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Verification failed' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
