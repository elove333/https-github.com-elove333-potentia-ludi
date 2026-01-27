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
        handleRouteError(res, new Error(preview.error || 'Failed to build preview'), 'Failed to build preview', 400);
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
