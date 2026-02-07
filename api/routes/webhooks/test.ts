// Test Webhook API Route
// Simulates an Alchemy webhook for testing

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface TestWebhookRequest {
  walletAddress?: string;
  contractAddress?: string;
  chainId?: number;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      walletAddress = '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4',
      contractAddress = '0x3845badade8e6dff049820680d1f14bd3903a5d0', // The Sandbox SAND token
      chainId = 1
    }: TestWebhookRequest = req.body;

    console.log('🧪 Test webhook simulation started');
    console.log('🔗 Wallet:', walletAddress);
    console.log('🔗 Contract:', contractAddress);
    console.log('🔗 Chain ID:', chainId);

    // Map chain ID to network name
    let networkName = 'ETH_MAINNET';
    switch (chainId) {
      case 1:
        networkName = 'ETH_MAINNET';
        break;
      case 137:
        networkName = 'MATIC_MAINNET';
        break;
      case 42161:
        networkName = 'ARB_MAINNET';
        break;
      case 10:
        networkName = 'OPT_MAINNET';
        break;
      case 8453:
        networkName = 'BASE_MAINNET';
        break;
      case 2020:
        networkName = 'RONIN';
        break;
    }

    // Create mock Alchemy webhook payload
    const mockWebhook = {
      webhookId: `wh_test_${Date.now()}`,
      id: `whevt_test_${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: 'ADDRESS_ACTIVITY',
      event: {
        network: networkName,
        activity: [
          {
            fromAddress: '0x0000000000000000000000000000000000000000',
            toAddress: walletAddress.toLowerCase(),
            blockNum: '0x' + Math.floor(Date.now() / 1000).toString(16),
            hash: '0x' + Array.from({ length: 64 }, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            value: 100,
            asset: 'ERC20',
            category: 'token',
            rawContract: {
              address: contractAddress.toLowerCase(),
              decimal: '18'
            },
            tokenId: null,
            log: {
              address: contractAddress.toLowerCase(),
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x0000000000000000000000000000000000000000000000000000000000000000',
                '0x000000000000000000000000' + walletAddress.slice(2).toLowerCase()
              ],
              data: '0x0000000000000000000000000000000000000000000000000000000000000064',
              blockNumber: '0x' + Math.floor(Date.now() / 1000).toString(16),
              transactionHash: '0x' + Array.from({ length: 64 }, () => 
                Math.floor(Math.random() * 16).toString(16)
              ).join('')
            }
          }
        ]
      }
    };

    console.log('📦 Mock webhook payload created');
    console.log('🔗 Transaction hash:', mockWebhook.event.activity[0].hash);

    // Send webhook to our handler
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3001';
    const webhookUrl = `${appUrl}/api/webhooks/game-event-transfer`;

    console.log('🔗 Sending to webhook handler:', webhookUrl);

    const response = await axios.post(webhookUrl, mockWebhook, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook handler responded');
    console.log('💾 Response:', response.data);

    console.log('✅ Test webhook simulation complete');

    res.json({
      success: true,
      message: 'Test webhook sent successfully',
      mockWebhook,
      handlerResponse: response.data
    });

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    // If it's an axios error, include the response details
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    
    res.status(500).json({
      error: 'Failed to simulate test webhook',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: axios.isAxiosError(error) ? error.response?.data : undefined
    });
  }
});

export default router;
