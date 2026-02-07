// Game Event Transfer Webhook Handler
// Receives Alchemy webhooks and validates them, then saves events to database

import { Router, Request, Response } from 'express';
import { gameQueries, gameEventQueries, userQueries } from '../../lib/database';

const router = Router();

interface AlchemyWebhookEvent {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    network: string;
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      blockNum: string;
      hash: string;
      value?: number;
      asset?: string;
      category: string;
      rawContract?: {
        address: string;
        decimal?: string;
      };
      tokenId?: string;
      log?: {
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        transactionHash: string;
      };
    }>;
  };
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const webhookData: AlchemyWebhookEvent = req.body;

    console.log('🎮 Webhook received');
    console.log('🔗 Webhook ID:', webhookData.webhookId);
    console.log('🔗 Event type:', webhookData.type);

    // Validate webhook structure
    if (!webhookData.event || !webhookData.event.activity) {
      console.log('❌ Invalid webhook structure');
      return res.status(400).json({ error: 'Invalid webhook structure' });
    }

    console.log('🎮 Processing', webhookData.event.activity.length, 'activities');

    const processedEvents = [];

    // Process each activity
    for (const activity of webhookData.event.activity) {
      try {
        console.log('🔗 Processing activity:', activity.hash);
        console.log('  📍 From:', activity.fromAddress);
        console.log('  📍 To:', activity.toAddress);
        console.log('  📍 Category:', activity.category);

        const contractAddress = activity.rawContract?.address || activity.log?.address || '';
        
        if (!contractAddress) {
          console.log('  ⚠️ No contract address found, skipping');
          continue;
        }

        console.log('  📍 Contract:', contractAddress);

        // Map network name to chain ID
        let chainId = 0; // Default to unknown
        const network = webhookData.event.network.toLowerCase();
        // Check specific chains first before generic mainnet fallback
        if (network.includes('polygon') || network.includes('matic')) {
          chainId = 137;
        } else if (network.includes('arbitrum') || network.includes('arb')) {
          chainId = 42161;
        } else if (network.includes('optimism') || network.includes('opt')) {
          chainId = 10;
        } else if (network.includes('base')) {
          chainId = 8453;
        } else if (network.includes('ronin')) {
          chainId = 2020;
        } else if (network.includes('mainnet') || network.includes('ethereum')) {
          chainId = 1;
        }

        if (chainId === 0) {
          console.log('  ⚠️ Unknown network, skipping:', webhookData.event.network);
          continue;
        }

        // Check if this contract belongs to a tracked game
        const game = await gameQueries.findByContract(contractAddress.toLowerCase(), chainId);
        
        if (!game) {
          console.log('  ⚠️ Contract not tracked as a game, skipping');
          continue;
        }

        console.log('  🎮 Matched game:', game.name, `(${game.token_symbol})`);

        // Find or create user for the wallet address
        const walletAddress = activity.toAddress.toLowerCase();
        const user = await userQueries.findOrCreate(walletAddress);

        console.log('  👤 User ID:', user.id);

        // Create game event record
        const eventType = activity.category || 'transfer';
        const tokenId = activity.tokenId || null;
        const amount = activity.value ? activity.value.toString() : null;
        const txHash = activity.hash;

        const metadata = {
          fromAddress: activity.fromAddress,
          blockNum: activity.blockNum,
          network: webhookData.event.network,
          webhookId: webhookData.webhookId,
          rawActivity: activity
        };

        const event = await gameEventQueries.create(
          user.id,
          game.id,
          eventType,
          walletAddress,
          contractAddress.toLowerCase(),
          tokenId,
          amount,
          txHash,
          chainId,
          metadata
        );

        console.log('  💾 Event saved to database:', event.id);
        console.log('  ✅ Event processing complete');

        processedEvents.push({
          eventId: event.id,
          game: game.name,
          wallet: walletAddress,
          txHash
        });

      } catch (activityError) {
        console.error('  ❌ Error processing activity:', activityError);
        // Continue processing other activities
      }
    }

    console.log('✅ Webhook processing complete');
    console.log('💾 Saved', processedEvents.length, 'events');

    res.json({
      success: true,
      processedCount: processedEvents.length,
      events: processedEvents
    });

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
