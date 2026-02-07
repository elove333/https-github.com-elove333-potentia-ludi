// Test Webhook Route
import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { success, error, rateLimit } from '../../client';

const router = Router();

// Test webhook endpoint for simulating webhook requests
router.post('/', rateLimit(10, 60000), async (req: Request, res: Response) => {
  try {
    console.log('📊 Simulated Webhook Fired!');

    // Prepare test payload
    const testPayload = {
      eventType: req.body.eventType || 'testEvent',
      walletAddress: req.body.walletAddress || '0xTestAddress',
      data: req.body.data || { test: true, timestamp: new Date().toISOString() }
    };

    console.log('🔗 Test Payload: ', JSON.stringify(testPayload, null, 2));

    // Generate signature if WEBHOOK_SECRET is configured
    let signature: string | undefined;
    if (process.env.WEBHOOK_SECRET) {
      signature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(testPayload))
        .digest('hex');
      console.log('✅ Generated Signature: ', signature);
    }

    // Construct the full URL for the webhook endpoint
    const protocol = req.protocol;
    const host = req.get('host');
    const webhookUrl = `${protocol}://${host}/api/webhooks/game-event-transfer`;

    console.log('🔗 Sending to: ', webhookUrl);

    // Make request to the webhook endpoint using native fetch
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (signature) {
      headers['x-signature'] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });

    const responseData = await response.json();
    console.log('✅ Webhook Response: ', responseData);

    success(res, {
      message: 'Test Webhook Simulated',
      testPayload,
      webhookResponse: responseData,
      webhookStatus: response.status
    }, 200);

  } catch (err) {
    console.error('❌ Test Webhook Error: ', err instanceof Error ? err.message : 'Unknown error');
    console.error('❌ Full Error Stack: ', err);
    error(res, err instanceof Error ? err.message : 'Failed to simulate webhook', 500);
  }
});

export default router;
