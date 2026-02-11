// API Route: POST /api/intents/build
// Build transaction for an intent after user confirms preview

import { PipelineExecutor } from '../../services/pipelineExecutor';
import { intentQueries, telemetryQueries } from '../../lib/database';
import { ExecutionContext } from '../../../src/types/intents';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { intentId } = body;
    
    if (!intentId) {
      return new Response(
        JSON.stringify({ error: 'Missing intentId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Fetch intent from database
    const intentRecord = await intentQueries.findById(intentId);
    
    if (!intentRecord) {
      return new Response(
        JSON.stringify({ error: 'Intent not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check status
    if (intentRecord.status !== 'previewed') {
      return new Response(
        JSON.stringify({ error: `Intent not ready for building. Current status: ${intentRecord.status}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Create execution context
    const context: ExecutionContext = {
      intentId: intentRecord.id,
      userId: intentRecord.user_id,
      intent: intentRecord.intent_json,
      status: intentRecord.status,
      preview: intentRecord.preview,
      createdAt: new Date(intentRecord.created_at),
      updatedAt: new Date(intentRecord.updated_at),
    };
    
    // Build transaction
    const executor = new PipelineExecutor();
    const result = await executor.buildTransaction(context);
    
    await telemetryQueries.log(intentRecord.user_id, 'transaction_built', {
      intentId,
      transaction: result.transaction,
    });
    
    return new Response(
      JSON.stringify({
        ok: true,
        intentId: result.intentId,
        transaction: result.transaction,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Transaction build error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to build transaction' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
// Build Intent Preview Route
import { Router } from 'express';
import { requireAuth, AuthenticatedRequest, validateRequest, success } from '../../client';
import { buildExecutionPreview } from '../../services/pipelineExecutor';
import { parseAndValidateIntent } from '../../utils/intent';
import { getUserAndConversation } from '../../utils/user';
import { handleRouteError } from '../../utils/errors';

const router = Router();

// Build execution preview for intent
router.post(
  '/',
  requireAuth,
  validateRequest({
    body: {
      input: { required: true, type: 'string' },
      chainId: { required: false, type: 'number' }
    }
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { input, chainId } = req.body;
      const userId = req.userId!;

      // Parse and validate intent
      const parsed = await parseAndValidateIntent(input, res);
      if (!parsed) return;

      // Get user and conversation
      const userConv = await getUserAndConversation(userId, res);
      if (!userConv) return;

      const { conversation, user } = userConv;

      // Build preview without executing
      const preview = await buildExecutionPreview(parsed, {
        userId,
        conversationId: conversation.id,
        intentId: '', // No intent ID yet since we're just previewing
        walletAddress: user.wallet_address,
        chainId
      });

      if (!preview.success) {
        const errorMessage = preview.error || 'Failed to build preview';
        handleRouteError(res, new Error(errorMessage), errorMessage, 400);
        return;
      }

      success(res, {
        intent: {
          action: parsed.action,
          entities: parsed.entities,
          confidence: parsed.confidence,
          riskLevel: parsed.riskLevel
        },
        preview: preview.data
      });
    } catch (err) {
      handleRouteError(res, err, 'Preview build error', 500);
    }
  }
);

export default router;
