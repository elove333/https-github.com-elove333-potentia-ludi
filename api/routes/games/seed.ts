// Seed Games API Route
// Seeds the database with popular games

import { Router, Request, Response } from 'express';
import { gameQueries } from '../../lib/database';

const router = Router();

// Predefined games to seed
const GAMES = [
  {
    name: 'Axie Infinity',
    tokenSymbol: 'SLP',
    contractAddress: '0xa8754b9fa15fc18bb59458815510e40a12cd2014',
    chainId: 2020, // Ronin chain
    chainName: 'ronin'
  },
  {
    name: 'The Sandbox',
    tokenSymbol: 'SAND',
    contractAddress: '0x3845badade8e6dff049820680d1f14bd3903a5d0',
    chainId: 1,
    chainName: 'ethereum'
  },
  {
    name: 'Gods Unchained',
    tokenSymbol: 'GODS',
    contractAddress: '0xccC8cb5229B0ac8069C51fd58367Fd1e622aFD97',
    chainId: 1,
    chainName: 'ethereum'
  },
  {
    name: 'Decentraland',
    tokenSymbol: 'MANA',
    contractAddress: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
    chainId: 1,
    chainName: 'ethereum'
  },
  {
    name: 'Illuvium',
    tokenSymbol: 'ILV',
    contractAddress: '0x767fe9edc9e0df98e07454847909b5e959d7ca0e',
    chainId: 1,
    chainName: 'ethereum'
  },
  {
    name: 'Gala Games',
    tokenSymbol: 'GALA',
    contractAddress: '0xd1d2eb1b1e90b638588728b4130137d262c87cae',
    chainId: 1,
    chainName: 'ethereum'
  }
];

router.post('/', async (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Disallow seeding entirely in production environments
  if (isProduction) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Game seeding is disabled in production environment'
    });
  }

  try {
    console.log('🌱 Starting game database seeding...');

    // Clear existing games first - ONLY in development/test environments
    await gameQueries.deleteAll();
    console.log('🗑️ Cleared existing games (development mode)');

    const seededGames = [];

    for (const gameData of GAMES) {
      try {
        console.log(`🎮 Processing: ${gameData.name} (${gameData.tokenSymbol}) on ${gameData.chainName}`);
        
        const game = await gameQueries.create(
          gameData.name,
          gameData.tokenSymbol,
          gameData.contractAddress.toLowerCase(),
          gameData.chainId,
          gameData.chainName
        );

        console.log(`  ✅ Saved with ID: ${game.id}`);
        
        seededGames.push({
          id: game.id,
          name: game.name,
          tokenSymbol: game.token_symbol,
          chain: game.chain_name
        });
      } catch (gameError) {
        // In production, treat unique/duplicate constraint violations as "already exists"
        const errorObj = gameError as { code?: string; message?: string } | null;
        const message = errorObj && typeof errorObj.message === 'string' ? errorObj.message.toLowerCase() : '';
        const isDuplicateError =
          (errorObj && errorObj.code === '23505') || // PostgreSQL unique_violation
          message.includes('duplicate key') ||
          message.includes('unique constraint') ||
          message.includes('unique violation');

        if (isProduction && isDuplicateError) {
          console.log(`  ℹ️ ${gameData.name} already exists, skipping.`);
        } else {
          console.error(`  ❌ Error seeding ${gameData.name}:`, gameError);
        }
      }
    }

    console.log('✅ Game database seeded successfully');
    console.log(`💾 Total games seeded: ${seededGames.length}`);

    res.json({
      success: true,
      count: seededGames.length,
      games: seededGames
    });

  } catch (error) {
    console.error('❌ Game seeding error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({
      error: 'Failed to seed games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
