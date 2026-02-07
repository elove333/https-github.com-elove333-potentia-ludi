// Setup Webhook API Route
// Sets up Alchemy webhooks for game event monitoring

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface WebhookSetupRequest {
  contractAddresses: string[];
  chainId: number;
  webhookUrl?: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { contractAddresses, chainId, webhookUrl }: WebhookSetupRequest = req.body;

    console.log('🔗 Setup webhook requested');
    console.log('🎮 Contract addresses:', contractAddresses);
    console.log('🔗 Chain ID:', chainId);

    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length === 0) {
      console.log('❌ Missing or invalid contract addresses');
      return res.status(400).json({ error: 'Contract addresses array is required' });
    }

    // Get Alchemy API key based on chain
    let alchemyApiKey: string | undefined;
    let alchemyNetwork: string;

    switch (chainId) {
      case 1:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_MAINNET;
        alchemyNetwork = 'eth-mainnet';
        break;
      case 137:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_POLYGON;
        alchemyNetwork = 'polygon-mainnet';
        break;
      case 42161:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_ARBITRUM;
        alchemyNetwork = 'arb-mainnet';
        break;
      case 10:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_OPTIMISM;
        alchemyNetwork = 'opt-mainnet';
        break;
      case 8453:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_BASE;
        alchemyNetwork = 'base-mainnet';
        break;
      default:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_POLYGON;
        alchemyNetwork = 'polygon-mainnet';
    }

    if (!alchemyApiKey) {
      console.log('❌ ALCHEMY_API_KEY not configured for chain', chainId);
      return res.status(500).json({ error: 'Alchemy API key not configured for this chain' });
    }

    // Determine webhook URL
    const finalWebhookUrl = webhookUrl || 
      `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3001'}/api/webhooks/game-event-transfer`;

    console.log('🔗 Using webhook URL:', finalWebhookUrl);
    console.log('🔗 Using Alchemy network:', alchemyNetwork);

    // Note: This is a mock implementation since Alchemy webhook creation typically requires
    // using their dashboard API with authentication. In production, you'd use the Alchemy SDK
    // or their dashboard API with proper authentication.
    // Future: Use alchemyUrl = `https://dashboard.alchemy.com/api/create-webhook` for real implementation
    
    console.log('✅ Webhook setup simulated');
    console.log('💡 In production, use Alchemy Dashboard or SDK to create webhooks');

    res.json({
      success: true,
      webhookUrl: finalWebhookUrl,
      network: alchemyNetwork,
      contractAddresses,
      message: 'Webhook configuration prepared. Use Alchemy Dashboard to complete setup.',
      instructions: [
        '1. Go to https://dashboard.alchemy.com/',
        '2. Navigate to Webhooks section',
        '3. Create new Address Activity webhook',
        `4. Add contracts: ${contractAddresses.join(', ')}`,
        `5. Set webhook URL to: ${finalWebhookUrl}`,
        '6. Save and activate the webhook'
      ]
    });

  } catch (error) {
    console.error('❌ Setup webhook error:', error);
    res.status(500).json({
      error: 'Failed to setup webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
