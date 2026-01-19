// API Route: POST /api/siwe/logout
// Clear session and log out user

import { telemetryQueries } from '../../lib/database';

export async function POST(req: Request): Promise<Response> {
  try {
    // In production: Extract sessionId from cookie and delete from database
    
    await telemetryQueries.log(null, 'user_logout', {});
    
    const response = new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    // Clear session cookie
    // response.headers.set('Set-Cookie', 'sessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    
    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: 'Logout failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
