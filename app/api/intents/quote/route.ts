import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { TradeSwapIntentSchema } from '@/lib/types/intents';
import { getSwapQuoteWithFallback } from '@/lib/services/dex';
import { logger } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    if (!session.isAuthenticated || !session.address) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate intent
    const intentValidation = TradeSwapIntentSchema.safeParse(body);
    if (!intentValidation.success) {
      return NextResponse.json(
        { error: 'Invalid intent', details: intentValidation.error.issues },
        { status: 400 }
      );
    }

    const intent = intentValidation.data;

    // Get quote from 0x API
    const quote = await getSwapQuoteWithFallback(
      intent.chainId,
      intent.fromToken,
      intent.toToken,
      intent.amount,
      intent.slippage || 1,
      session.address,
      intent.useUniswapOnly || false
    );

    logger.info(
      {
        userId: session.userId,
        intent: intent.type,
        fromToken: intent.fromToken,
        toToken: intent.toToken,
        amount: intent.amount,
      },
      'Swap quote fetched'
    );

    return NextResponse.json({
      intent,
      quote: {
        sellToken: quote.sellToken,
        buyToken: quote.buyToken,
        sellAmount: quote.sellAmount,
        buyAmount: quote.buyAmount,
        price: quote.price,
        guaranteedPrice: quote.guaranteedPrice,
        estimatedGas: quote.estimatedGas,
        gas: quote.gas,
        gasPrice: quote.gasPrice,
        sources: quote.sources,
        allowanceTarget: quote.allowanceTarget,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching swap quote');
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
