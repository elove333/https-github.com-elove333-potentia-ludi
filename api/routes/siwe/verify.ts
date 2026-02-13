// SIWE Verification Route
import { Router } from 'express';
import { authenticateWithSiwe } from '../../lib/auth';
import { validateRequest, rateLimit, success, error } from '../../client';

const router = Router();

// Verify SIWE signature and create session
router.post(
  '/',
  rateLimit(5, 60000),
  validateRequest({
    body: {
      message: { required: true, type: 'string' },
      signature: { required: true, type: 'string' },
      nonce: { required: true, type: 'string' }
    }
  }),
  async (req, res) => {
    try {
      const { message, signature, nonce } = req.body;

      // Get IP and user agent for session tracking
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      // Authenticate with SIWE
      const result = await authenticateWithSiwe(
        message,
        signature,
        nonce,
        ipAddress,
        userAgent
      );

      // Set session cookie
      res.cookie('session', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      success(res, {
        user: result.user,
        sessionToken: result.sessionToken
      });
    } catch (err) {
      console.error('SIWE verification error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      
      if (errorMessage.includes('Invalid signature') || 
          errorMessage.includes('Nonce mismatch') || 
          errorMessage.includes('expired')) {
        error(res, errorMessage, 401);
      } else {
        error(res, 'Verification failed', 500);
      }
    }
  }
);

export default router;
