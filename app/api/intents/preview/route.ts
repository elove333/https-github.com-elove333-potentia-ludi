import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { IntentSchema, IntentStatus } from '@/lib/types/intents';
import { getSwapQuoteWithFallback } from '@/lib/services/dex';
import { simulateTransaction, assessRisks } from '@/lib/services/simulation';
import { query, logger } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

function generateUUID(): string {
  return uuidv4();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    if (!session.isAuthenticated || !session.address || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate intent
    const intentValidation = IntentSchema.safeParse(body);
    if (!intentValidation.success) {
      return NextResponse.json(
        { error: 'Invalid intent', details: intentValidation.error.issues },
        { status: 400 }
      );
    }

    const intent = intentValidation.data;

    // Only handle trade.swap for now
    if (intent.type !== 'trade.swap') {
      return NextResponse.json(
        { error: 'Only trade.swap intents supported currently' },
        { status: 400 }
      );
    }

    // Get quote
    const quote = await getSwapQuoteWithFallback(
      intent.chainId,
      intent.fromToken,
      intent.toToken,
      intent.amount,
      intent.slippage || 1,
      session.address,
      intent.useUniswapOnly || false
    );

    // Simulate the transaction
    const simulation = await simulateTransaction(
      intent.chainId,
      session.address,
      quote.to,
      quote.data,
      quote.value
    );

    // Assess risks
    const risks = await assessRisks(simulation, [
      { token: intent.fromToken, amount: `-${intent.amount}` },
      { token: intent.toToken, amount: quote.buyAmount },
    ]);

    // Check for critical risks
    const hasCriticalRisk = risks.some(r => r.level === 'critical');

    // Build preview
    const preview = {
      decodedCalls: [
        {
          target: quote.to,
          method: 'swap',
          params: {
            sellToken: quote.sellToken,
            buyToken: quote.buyToken,
            sellAmount: quote.sellAmount,
            minBuyAmount: quote.buyAmount,
          },
        },
      ],
      tokenDeltas: [
        {
          token: intent.fromToken,
          symbol: quote.sellToken,
          amount: `-${quote.sellAmount}`,
        },
        {
          token: intent.toToken,
          symbol: quote.buyToken,
          amount: quote.buyAmount,
        },
      ],
      risks,
      gasEstimate: {
        gasLimit: quote.estimatedGas,
        maxFeePerGas: quote.gasPrice,
        maxPriorityFeePerGas: quote.gasPrice,
      },
      simulationSuccess: simulation.success,
      revertReason: simulation.revertReason,
    };

    // Store intent in database
    const intentId = generateUUID();
    await query(
      `INSERT INTO intents (id, user_id, intent_type, intent_json, status, preview)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        intentId,
        session.userId,
        intent.type,
        JSON.stringify(intent),
        hasCriticalRisk ? IntentStatus.FAILED : IntentStatus.PREVIEWED,
        JSON.stringify(preview),
      ]
    );

    logger.info(
      {
        userId: session.userId,
        intentId,
        intentType: intent.type,
        hasCriticalRisk,
      },
      'Intent preview generated'
    );

    return NextResponse.json({
      intentId,
      intent,
      preview,
      canExecute: !hasCriticalRisk && simulation.success,
    });
  } catch (error) {
    logger.error({ error }, 'Error generating preview');
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
