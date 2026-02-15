import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { parseNaturalLanguage, validateIntent } from '@/lib/services/intentParser';
import { logTelemetry, TelemetryEvents } from '@/lib/services/telemetry';
import { logger } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    if (!session.isAuthenticated || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text required' },
        { status: 400 }
      );
    }

    // Parse natural language
    const parsed = parseNaturalLanguage(text);

    if (!parsed) {
      await logTelemetry({
        userId: session.userId,
        event: TelemetryEvents.INTENT_FAILED,
        payload: { reason: 'parse_failed', text },
      });

      return NextResponse.json(
        { 
          error: 'Could not understand intent',
          suggestions: [
            'Show me my balance',
            'Swap 100 USDC for ETH',
            'Bridge 0.5 ETH to Polygon',
            'Show my claimable rewards',
          ],
        },
        { status: 400 }
      );
    }

    // Validate intent
    const validation = validateIntent(parsed.intent);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid intent', details: validation.errors },
        { status: 400 }
      );
    }

    // Log successful parse
    await logTelemetry({
      userId: session.userId,
      event: TelemetryEvents.INTENT_PARSED,
      payload: {
        originalText: text,
        intentType: parsed.intent.type,
        confidence: parsed.confidence,
      },
    });

    logger.info(
      {
        userId: session.userId,
        intentType: parsed.intent.type,
        confidence: parsed.confidence,
      },
      'Intent parsed from natural language'
    );

    return NextResponse.json({
      intent: parsed.intent,
      confidence: parsed.confidence,
      originalText: parsed.originalText,
    });
  } catch (error) {
    logger.error({ error }, 'Error parsing intent');
    return NextResponse.json(
      { error: 'Failed to parse intent' },
      { status: 500 }
    );
  }
}
