// SIWE Nonce Generation Route
import { Router } from 'express';
import { generateNonce } from '../../lib/auth';
import { rateLimit, success, error } from '../../client';

const router = Router();

// Generate nonce for SIWE authentication
router.post('/', rateLimit(10, 60000), async (req, res) => {
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
