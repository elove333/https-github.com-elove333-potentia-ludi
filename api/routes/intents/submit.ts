// Submit Intent Route
import { Router } from 'express';
import { requireAuth, AuthenticatedRequest, validateRequest, rateLimit, success } from '../../client';
import { executeIntent } from '../../services/pipelineExecutor';
import { intentQueries, conversationQueries } from '../../lib/database';
import { parseAndValidateIntent } from '../../utils/intent';
import { getUserAndConversation } from '../../utils/user';
import { handleRouteError } from '../../utils/errors';

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

      // Parse and validate intent
      const parsed = await parseAndValidateIntent(input, res);
      if (!parsed) return;

      // Get user and conversation
      const userConv = await getUserAndConversation(userId, res);
      if (!userConv) return;

      const { conversation, user } = userConv;

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
      handleRouteError(res, err, 'Intent submission error', 500);
    }
  }
);

export default router;
