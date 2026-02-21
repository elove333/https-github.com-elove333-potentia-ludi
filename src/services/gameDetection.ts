import { Web3Game } from '../types';
import { telemetryService } from './telemetry';

// Known Web3 games registry
const KNOWN_WEB3_GAMES = [
  {
    name: 'Axie Infinity',
    domains: ['axieinfinity.com', 'marketplace.axieinfinity.com'],
    chainId: 2020, // Ronin
    contractPatterns: ['0x32950db2a7164ae833121501c797d79e7b79d74c'],
  },
  {
    name: 'Gods Unchained',
    domains: ['godsunchained.com'],
    chainId: 13371, // Immutable X
    contractPatterns: ['0x0e3a2a1f2146d86a604adc220b4967a898d7fe07'],
  },
  {
    name: 'The Sandbox',
    domains: ['sandbox.game'],
    chainId: 1,
    contractPatterns: ['0x5026f006b85729a8b14553fae6af249ad16c9aab'],
  },
  {
    name: 'Decentraland',
    domains: ['decentraland.org', 'play.decentraland.org'],
    chainId: 137, // Polygon
    contractPatterns: ['0x0f5d2fb29fb7d3cfee444a200298f468908cc942'],
  },
];

class GameDetectionService {
  private detectedGames: Map<string, Web3Game> = new Map();
  private observers: Array<(game: Web3Game) => void> = [];
  private initialized: boolean = false;
  private urlCheckInterval: ReturnType<typeof setInterval> | null = null;
  private popstateHandler: (() => void) | null = null;

  /**
   * Initialize the game detection service.
   * Guards against multiple initializations to prevent duplicate listeners/timers.
   */
  init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.startUrlMonitoring();
    this.startContractMonitoring();
  }

  /**
   * Monitor URL changes to detect Web3 games
   */
  private startUrlMonitoring() {
    // In a browser extension context, this would monitor tab URLs
    // For demo purposes, we'll check current URL
    if (typeof window !== 'undefined') {
      const checkUrl = () => {
        const currentUrl = window.location.href;
        this.checkUrlForGame(currentUrl);
      };

      this.popstateHandler = checkUrl;

      // Check on load and navigation
      checkUrl();
      window.addEventListener('popstate', this.popstateHandler);

      // Check periodically for dynamic apps
      this.urlCheckInterval = setInterval(checkUrl, 5000);
    }
  }

  /**
   * Clean up listeners and timers, and reset initialization state.
   * Call this before re-initializing or when shutting down.
   */
  cleanup() {
    if (typeof window !== 'undefined' && this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }
    if (this.urlCheckInterval !== null) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }
    this.initialized = false;
  }

  /**
   * Check if a URL matches any known Web3 games
   */
  private checkUrlForGame(url: string) {
    for (const gameConfig of KNOWN_WEB3_GAMES) {
      for (const domain of gameConfig.domains) {
        if (url.includes(domain)) {
          const game: Web3Game = {
            id: gameConfig.name.toLowerCase().replace(/\s+/g, '-'),
            name: gameConfig.name,
            url: url,
            chainId: gameConfig.chainId,
            contractAddresses: gameConfig.contractPatterns,
            detected: true,
            lastActive: new Date(),
          };
          
          this.addDetectedGame(game);
          return;
        }
      }
    }
  }

  /**
   * Monitor blockchain transactions for known game contracts
   */
  private startContractMonitoring() {
    // This would integrate with Web3 providers to monitor transactions
    // For demo, we'll implement a mock version
    console.log('Contract monitoring initialized');
  }

  /**
   * Add a detected game
   */
  private addDetectedGame(game: Web3Game) {
    if (!this.detectedGames.has(game.id)) {
      this.detectedGames.set(game.id, game);
      this.notifyObservers(game);
      
      // Emit telemetry event for game detection
      telemetryService.emitGameDetected(game.id, game.name, game.url, game.chainId);
    } else {
      // Update last active time
      const existing = this.detectedGames.get(game.id)!;
      existing.lastActive = new Date();
      this.detectedGames.set(game.id, existing);
    }
  }

  /**
   * Subscribe to game detection events
   */
  subscribe(callback: (game: Web3Game) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }

  /**
   * Notify observers of detected game
   */
  private notifyObservers(game: Web3Game) {
    this.observers.forEach((callback) => callback(game));
  }

  /**
   * Get all detected games
   */
  getDetectedGames(): Web3Game[] {
    return Array.from(this.detectedGames.values());
  }

  /**
   * Manually add a game (for testing or custom games)
   */
  addCustomGame(game: Web3Game) {
    this.addDetectedGame(game);
  }
}

export const gameDetectionService = new GameDetectionService();

// Export class for custom configurations or testing
export { GameDetectionService };
