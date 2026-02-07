// Submit Intent Route
"import { Router } from 'express';
import { requireAuth, AuthenticatedRequest, validateRequest, rateLimit, success, error } from '../../client';
import { parseIntent, validateIntent } from '../../services/intentParser';
import { executeIntent } from '../../services/pipelineExecutor';
import { conversationQueries, intentQueries, userQueries } from '../../lib/database';

const router = Router();

// Submit natural language intent
router.post(
  '/',
  requireAuth,
  rateLimit(20, 60000),
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

      // Parse intent
      const parsed = await parseIntent(input);

      if (!parsed) {
        error(res, 'Could not understand input', 400);
        return;
      }

      // Validate parsed intent
      const validation = validateIntent(parsed);
      if (!validation.valid) {
        error(res, `Invalid intent: ${validation.errors.join(', ')}`, 400);
        return;
      }

      // Get or create active conversation
      let conversation = await conversationQueries.findActive(userId);
      if (!conversation) {
        conversation = await conversationQueries.create(userId);
      }

      // Create intent record
      const intent = await intentQueries.create(
        conversation.id,
        userId,
        input,
        parsed,
        parsed.confidence,
        parsed.riskLevel
      );

      // Increment conversation message count
      await conversationQueries.incrementMessageCount(conversation.id);

      // Get user wallet address
      const user = await userQueries.findByAddress(userId);
      if (!user) {
        error(res, 'User not found', 404);
        return;
      }

      // Execute intent if confidence is high enough and doesn't require confirmation
      if (parsed.confidence >= 0.7 && !parsed.requiresConfirmation) {
        const executionResult = await executeIntent(parsed, {
          userId,
          conversationId: conversation.id,
          intentId: intent.id,
          walletAddress: user.wallet_address,
          chainId
        });

        success(res, {
          intent: {
            id: intent.id,
            action: parsed.action,
            entities: parsed.entities,
            confidence: parsed.confidence,
            riskLevel: parsed.riskLevel,
            status: 'executed'
          },
          execution: executionResult
        });
      } else {
        // Return intent for user confirmation
        success(res, {
          intent: {
            id: intent.id,
            action: parsed.action,
            entities: parsed.entities,
            confidence: parsed.confidence,
            riskLevel: parsed.riskLevel,
            status: 'pending',
            requiresConfirmation: true
          }
        });
      }
    } catch (err) {
      console.error('Intent submission error:', err);
      error(res, err instanceof Error ? err.message : 'Failed to process intent', 500);
    }
  }
);

export default router;
