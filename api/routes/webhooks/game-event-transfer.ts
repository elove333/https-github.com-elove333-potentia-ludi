// Game Event Transfer Webhook Route
import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { optionalAuth, AuthenticatedRequest, success, error, rateLimit } from '../../client';
import { telemetryQueries } from '../../lib/database';

const router = Router();

// Signature verification middleware
function verifySignature(req: Request): boolean {
  const receivedSignature = req.headers['x-signature'] as string;
  
  // If no webhook secret is configured, skip verification in development
  if (!process.env.WEBHOOK_SECRET) {
    console.warn('⚠️  WEBHOOK_SECRET not configured - signature verification disabled');
    return true;
  }
  
  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  return receivedSignature === expectedSignature;
}

// Game event transfer webhook endpoint
router.post(
  '/',
  rateLimit(100, 60000), // Allow 100 requests per minute per IP
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Log incoming webhook
      console.log('🔗 Incoming Webhook for Game Event');
      console.log('🔗 Webhook Triggered: ', JSON.stringify(req.body, null, 2));

      // Verify webhook signature
      if (!verifySignature(req)) {
        console.error('❌ Invalid Webhook Signature');
        return error(res, 'Invalid Signature', 401);
      }
      console.log('✅ Webhook Validated');

      // Validate required fields
      if (!req.body.eventType || !req.body.walletAddress) {
        console.error('❌ Invalid Webhook Payload - Missing required fields');
        console.error('📊 Received Payload: ', req.body);
        return error(res, 'Invalid Webhook Payload', 400);
      }

      console.log('📊 Webhook Payload: ', req.body);
      console.log('✅ Webhook Payload Validated');

      const { eventType, walletAddress, data } = req.body;

      // Log database save operation (sanitized for security)
      console.log('💾 Saving Event to DB: ', { eventType, walletAddress, hasData: !!data });

      // Save event to database using telemetry
      try {
        await telemetryQueries.log(
          req.userId || null,
          eventType,
          {
            walletAddress,
            data: data || {},
            source: 'webhook',
            timestamp: new Date().toISOString()
          },
          req.ip,
          req.get('user-agent')
        );
        
        console.log('✅ Event Saved: ', {
          eventType,
          walletAddress,
          timestamp: new Date().toISOString()
        });

        // Return success response
        success(res, {
          message: 'Webhook processed successfully',
          eventType,
          walletAddress,
          timestamp: new Date().toISOString()
        }, 200);

      } catch (dbError) {
        console.error('❌ DB Save Error: ', dbError instanceof Error ? dbError.message : 'Unknown error');
        console.error('❌ Full DB Error Stack: ', dbError);
        return error(res, 'Failed to save event to database', 500);
      }

    } catch (err) {
      console.error('❌ Webhook Processing Error: ', err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Full Error Stack: ', err);
      error(res, err instanceof Error ? err.message : 'Failed to process webhook', 500);
    }
  }
);

export default router;
