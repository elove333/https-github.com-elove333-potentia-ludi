// SIWE Logout Route
import { Router } from 'express';
import { logout, extractSessionToken } from '../../lib/auth';
import { success, error } from '../../client';

const router = Router();

// Logout user and destroy session
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookies = req.cookies;
    const sessionToken = extractSessionToken(authHeader, cookies);

    if (!sessionToken) {
      error(res, 'No active session', 400);
      return;
    }

    await logout(sessionToken);

    // Clear session cookie
    res.clearCookie('session');

    success(res, { message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    error(res, 'Logout failed', 500);
  }
});

export default router;
