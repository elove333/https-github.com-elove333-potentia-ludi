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
// SIWE Nonce Generation Route
import { Router } from 'express';
import { generateNonce } from '../../lib/auth';
import { rateLimit, success, error } from '../../client';

const router = Router();

// Generate nonce for SIWE authentication
router.post('/', rateLimit(10, 60000), async (_, res) => {
  try {
    const nonce = generateNonce();

    // In production, you'd want to store this nonce in Redis with expiration
    // For now, we'll just return it
    success(res, { nonce });
  } catch (err) {
    console.error('Nonce generation error:', err);
    error(res, 'Failed to generate nonce', 500);
  }
});

export default router;
