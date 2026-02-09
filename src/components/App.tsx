import React, { useEffect } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';
import { gameDetectionService } from '../services/gameDetection';
import { gasOptimizationService } from '../services/gasOptimization';
import { rewardTrackingService } from '../services/rewardTracking';
import WalletDashboard from './WalletDashboard';
import DetectedGames from './DetectedGames';
import RewardsPanel from './RewardsPanel';
import ClipsGallery from './ClipsGallery';

/* CHILD_CHUNK: App Component - Main Structure (300 tokens) */
/**
 * Main application component for Potentia Ludi
 * Manages service initialization and component layout
 */
const App: React.FC = () => {
  const { wallet, addDetectedGame } = useGamingWalletStore();

  /* CHILD_CHUNK: Service Initialization Effect (300 tokens) */
  /**
   * Initialize all core services on component mount
   * - Game detection service for auto-detecting Web3 games
   * - Gas optimization service for transaction cost reduction
   * - Reward tracking service for cross-chain reward monitoring
   */
  useEffect(() => {
    // Initialize services
    gameDetectionService.init();
    gasOptimizationService.init();

    // Subscribe to game detection
    const unsubscribe = gameDetectionService.subscribe((game) => {
      addDetectedGame(game);
    });

    // Initialize reward tracking if wallet is connected
    if (wallet?.address) {
      rewardTrackingService.init(wallet.address);
    }

    return () => {
      unsubscribe();
      gasOptimizationService.cleanup();
      rewardTrackingService.cleanup();
    };
  }, [wallet?.address, addDetectedGame]);
  /* END CHILD_CHUNK */

  /* CHILD_CHUNK: App Component - Render Layout (300 tokens) */
  /**
   * Render main application layout
   * Contains header, main grid with four sections, and footer
   */
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎮 Potentia Ludi</h1>
        <p style={styles.subtitle}>Universal On-Chain Gaming Wallet Hub</p>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          <div style={styles.section}>
            <WalletDashboard />
          </div>

          <div style={styles.section}>
            <DetectedGames />
          </div>

          <div style={styles.section}>
            <RewardsPanel />
          </div>

          <div style={styles.section}>
            <ClipsGallery />
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>Powered by Multi-Chain Web3 Technology</p>
      </footer>
    </div>
  );
  /* END CHILD_CHUNK */
};
/* END CHILD_CHUNK */

/* CHILD_CHUNK: Styles - App Container and Header (300 tokens) */
/**
 * Style definitions for main app container and header
 */
const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '2rem',
    textAlign: 'center' as const,
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '2px solid #00d9ff',
  },
  title: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(90deg, #00d9ff, #7000ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    margin: 0,
    color: '#a0a0a0',
  },
  /* END CHILD_CHUNK */
  
  /* CHILD_CHUNK: Styles - Layout and Grid (300 tokens) */
  /**
   * Style definitions for main content layout and grid system
   */
  main: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  section: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid rgba(0, 217, 255, 0.2)',
    transition: 'transform 0.2s ease',
  },
  footer: {
    padding: '1rem',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '0.9rem',
  },
  /* END CHILD_CHUNK */
};

export default App;
