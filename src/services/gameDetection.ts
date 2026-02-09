import { Web3Game } from '../types';

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
  private domainSet: Set<string> = new Set();
  private urlCheckDebounceTimer: NodeJS.Timeout | null = null;
  private pendingNotifications: Map<string, Web3Game> = new Map();

  /**
   * Initialize the game detection service
   */
  init() {
    // Build domain set for O(1) lookups
    KNOWN_WEB3_GAMES.forEach((game) => {
      game.domains.forEach((domain) => this.domainSet.add(domain));
    });
    
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

      // Check on load and navigation
      checkUrl();
      window.addEventListener('popstate', checkUrl);
      
      // Check periodically but less aggressively (30s instead of 5s)
      setInterval(checkUrl, 30000);
    }
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
      // Queue notification for this game
      this.pendingNotifications.set(game.id, game);
      this.debounceNotifyObservers();
    } else {
      // Update last active time
      const existing = this.detectedGames.get(game.id)!;
      existing.lastActive = new Date();
      this.detectedGames.set(game.id, existing);
    }
  }

  /**
   * Debounced notification to observers - notifies all pending games after delay
   */
  private debounceNotifyObservers() {
    if (this.urlCheckDebounceTimer) {
      clearTimeout(this.urlCheckDebounceTimer);
    }
    this.urlCheckDebounceTimer = setTimeout(() => {
      // Notify all pending games
      this.pendingNotifications.forEach((game) => {
        this.notifyObservers(game);
      });
      // Clear the queue
      this.pendingNotifications.clear();
    }, 500);
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

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.urlCheckDebounceTimer) {
      clearTimeout(this.urlCheckDebounceTimer);
      this.urlCheckDebounceTimer = null;
    }
    this.pendingNotifications.clear();
  }
}

export const gameDetectionService = new GameDetectionService();
