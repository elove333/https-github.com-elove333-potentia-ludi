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

  /**
   * Initialize the game detection service
   */
  init() {
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
      
      // Check periodically for dynamic apps
      setInterval(checkUrl, 5000);
    }
  }

  /**
   * Check if a URL matches any known Web3 games
   */
  private checkUrlForGame(currentUrl: string) {
    for (const gameConfig of KNOWN_WEB3_GAMES) {
      for (const gameDomain of gameConfig.domains) {
        if (currentUrl.includes(gameDomain)) {
          const detectedGame: Web3Game = {
            id: gameConfig.name.toLowerCase().replace(/\s+/g, '-'),
            name: gameConfig.name,
            url: currentUrl,
            chainId: gameConfig.chainId,
            contractAddresses: gameConfig.contractPatterns,
            detected: true,
            lastActive: new Date(),
          };
          
          this.addDetectedGame(detectedGame);
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
  private addDetectedGame(detectedGame: Web3Game) {
    if (!this.detectedGames.has(detectedGame.id)) {
      this.detectedGames.set(detectedGame.id, detectedGame);
      this.notifyObservers(detectedGame);
    } else {
      // Update last active time
      const existingGame = this.detectedGames.get(detectedGame.id)!;
      existingGame.lastActive = new Date();
      this.detectedGames.set(detectedGame.id, existingGame);
    }
  }

  /**
   * Subscribe to game detection events
   */
  subscribe(observerCallback: (game: Web3Game) => void) {
    this.observers.push(observerCallback);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== observerCallback);
    };
  }

  /**
   * Notify observers of detected game
   */
  private notifyObservers(detectedGame: Web3Game) {
    this.observers.forEach((observerCallback) => observerCallback(detectedGame));
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
  addCustomGame(customGame: Web3Game) {
    this.addDetectedGame(customGame);
  }
}

export const gameDetectionService = new GameDetectionService();
