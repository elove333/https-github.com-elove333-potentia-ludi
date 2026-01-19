// API Route: POST /api/siwe/nonce
// Generate a new nonce for SIWE authentication

import { createNonce } from '../../lib/auth';
import { telemetryQueries } from '../../lib/database';

export async function POST(req: Request): Promise<Response> {
  try {
    const nonce = await createNonce();
    
    await telemetryQueries.log(null, 'nonce_generated', { nonce });
    
    return new Response(
      JSON.stringify({ nonce }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating nonce:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate nonce' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
