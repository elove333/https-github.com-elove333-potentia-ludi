// Config API Route
// Verifies configuration and returns webhook URL

import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('🔧 Config verification requested');

    // Verify ALCHEMY_API_KEY
    const alchemyApiKey = process.env.ALCHEMY_API_KEY_POLYGON || process.env.ALCHEMY_API_KEY_MAINNET;
    
    if (!alchemyApiKey) {
      console.log('❌ ALCHEMY_API_KEY not configured');
      return res.status(500).json({
        error: 'ALCHEMY_API_KEY not configured',
        configured: false
      });
    }

    console.log('✅ ALCHEMY_API_KEY verified');

    // Get webhook URL from APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3001';
    const webhookURL = `${appUrl}/api/webhooks/game-event-transfer`;

    console.log('✅ Webhook URL:', webhookURL);

    res.json({
      configured: true,
      webhookURL,
      alchemyConfigured: true
    });

  } catch (error) {
    console.error('❌ Config verification error:', error);
    res.status(500).json({
      error: 'Config verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
