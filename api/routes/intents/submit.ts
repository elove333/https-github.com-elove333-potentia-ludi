// API Route: POST /api/intents/submit
// Submit a new intent for processing

import { IntentParser, validateIntent } from '../../services/intentParser';
import { PipelineExecutor } from '../../services/pipelineExecutor';
import { intentQueries, telemetryQueries } from '../../lib/database';
import { ExecutionContext } from '../../../src/types/intents';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { input, address, chainId } = body;
    
    if (!input || !address) {
      return new Response(
        JSON.stringify({ error: 'Missing input or address' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parse natural language to intent
    const intent = IntentParser.parse(input, address, chainId || 1);
    
    // Validate intent
    const validation = validateIntent(intent);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid intent', details: validation.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Mock user ID (in production, extract from session)
    const userId = 1;
    
    // Save intent to database
    const intentRecord = await intentQueries.create(userId, intent.type, intent);
    
    await telemetryQueries.log(userId, 'intent_submitted', {
      intentId: intentRecord.id,
      intentType: intent.type,
    });
    
    // Create execution context
    const context: ExecutionContext = {
      intentId: intentRecord.id,
      userId,
      intent,
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Execute pipeline (Preflight + Preview)
    const executor = new PipelineExecutor();
    const result = await executor.execute(context);
    
    return new Response(
      JSON.stringify({
        ok: true,
        intentId: result.intentId,
        intent: result.intent,
        status: result.status,
        preview: result.preview,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Intent submission error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process intent' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
