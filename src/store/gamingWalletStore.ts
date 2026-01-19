import { create } from 'zustand';
import { Web3Game, ChainReward, GameStats, ClipMetadata, WalletState } from '../types';

interface GamingWalletStore {
  // Wallet state
  wallet: WalletState | null;
  setWallet: (wallet: WalletState | null) => void;

  // Detected games
  detectedGames: Web3Game[];
  addDetectedGame: (game: Web3Game) => void;
  updateGameActivity: (gameId: string) => void;

  // Rewards tracking
  rewards: ChainReward[];
  setRewards: (rewards: ChainReward[]) => void;
  addReward: (reward: ChainReward) => void;

  // Stats
  gameStats: Record<string, GameStats>;
  updateGameStats: (gameId: string, stats: GameStats) => void;

  // Clips
  clips: ClipMetadata[];
  addClip: (clip: ClipMetadata) => void;

  // Gas optimization
  gasOptimizationEnabled: boolean;
  toggleGasOptimization: () => void;

  // Auto swap
  autoSwapEnabled: boolean;
  toggleAutoSwap: () => void;
}

export const useGamingWalletStore = create<GamingWalletStore>((set) => ({
  wallet: null,
  setWallet: (wallet) => set({ wallet }),

  detectedGames: [],
  addDetectedGame: (game) =>
    set((state) => ({
      detectedGames: [...state.detectedGames.filter((g) => g.id !== game.id), game],
    })),
  updateGameActivity: (gameId) =>
    set((state) => ({
      detectedGames: state.detectedGames.map((game) =>
        game.id === gameId ? { ...game, lastActive: new Date() } : game
      ),
    })),

  rewards: [],
  setRewards: (rewards) => set({ rewards }),
  addReward: (reward) =>
    set((state) => ({
      rewards: [...state.rewards, reward],
    })),

  gameStats: {},
  updateGameStats: (gameId, stats) =>
    set((state) => ({
      gameStats: { ...state.gameStats, [gameId]: stats },
    })),

  clips: [],
  addClip: (clip) =>
    set((state) => ({
      clips: [clip, ...state.clips],
    })),

  gasOptimizationEnabled: true,
  toggleGasOptimization: () =>
    set((state) => ({
      gasOptimizationEnabled: !state.gasOptimizationEnabled,
    })),

  autoSwapEnabled: true,
  toggleAutoSwap: () =>
    set((state) => ({
      autoSwapEnabled: !state.autoSwapEnabled,
    })),
}));
