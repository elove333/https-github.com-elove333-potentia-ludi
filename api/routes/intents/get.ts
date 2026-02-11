// API Route: GET /api/intents/:id
// Get intent details by ID

import { intentQueries } from '../../lib/database';

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const intentId = params.id;
    
    if (!intentId) {
      return new Response(
        JSON.stringify({ error: 'Missing intent ID' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const intent = await intentQueries.findById(intentId);
    
    if (!intent) {
      return new Response(
        JSON.stringify({ error: 'Intent not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify(intent),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching intent:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch intent' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
// Get Intent Route
import { Router } from 'express';
import { requireAuth, AuthenticatedRequest, success, error } from '../../client';
import { intentQueries } from '../../lib/database';
import { getIntentStatus } from '../../services/pipelineExecutor';
import { extractParam } from '../../utils/params';
import { handleRouteError } from '../../utils/errors';

const router = Router();

// Get intent by ID
router.get('/:intentId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const intentId = extractParam(req.params.intentId);
    const userId = req.userId!;

    // Get intent
    const intent = await intentQueries.findById(intentId);

    if (!intent) {
      error(res, 'Intent not found', 404);
      return;
    }

    // Verify intent belongs to user
    if (intent.user_id !== userId) {
      error(res, 'Unauthorized', 403);
      return;
    }

    success(res, {
      id: intent.id,
      rawInput: intent.raw_input,
      parsedIntent: intent.parsed_intent,
      confidence: intent.confidence,
      riskLevel: intent.risk_level,
      status: intent.status,
      createdAt: intent.created_at,
      executedAt: intent.executed_at
    });
  } catch (err) {
    handleRouteError(res, err, 'Get intent error', 500);
  }
});

// Get intent status
router.get('/:intentId/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const intentId = extractParam(req.params.intentId);
    const userId = req.userId!;

    // Get intent to verify ownership
    const intent = await intentQueries.findById(intentId);

    if (!intent) {
      error(res, 'Intent not found', 404);
      return;
    }

    // Verify intent belongs to user
    if (intent.user_id !== userId) {
      error(res, 'Unauthorized', 403);
      return;
    }

    // Get detailed status
    const status = await getIntentStatus(intentId);

    success(res, status);
  } catch (err) {
    handleRouteError(res, err, 'Get intent status error', 500);
  }
});

// List user intents
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const limitParam = extractParam(req.query.limit);
    const limit = parseInt(limitParam as string || '50');

    // Get user intents
    const intents = await intentQueries.listByUser(userId, limit);

    success(res, {
      intents: intents.map((intent: any) => ({
        id: intent.id,
        rawInput: intent.raw_input,
        parsedIntent: intent.parsed_intent,
        confidence: intent.confidence,
        riskLevel: intent.risk_level,
        status: intent.status,
        createdAt: intent.created_at
      }))
    });
  } catch (err) {
    handleRouteError(res, err, 'List intents error', 500);
  }
});

export default router;
