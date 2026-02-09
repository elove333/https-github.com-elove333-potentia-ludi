import { ClipMetadata, GameStats } from '../types';

interface RecordingState {
  isRecording: boolean;
  startTime: Date | null;
  gameId: string | null;
}

class ClipGeneratorService {
  private recordingState: RecordingState = {
    isRecording: false,
    startTime: null,
    gameId: null,
  };
  
  private clips: ClipMetadata[] = [];
  private statsBuffer: Map<string, Partial<GameStats>> = new Map();

  /**
   * Start recording a gaming session
   */
  startRecording(gameId: string) {
    if (this.recordingState.isRecording) {
      console.warn('Already recording');
      return;
    }

    this.recordingState = {
      isRecording: true,
      startTime: new Date(),
      gameId,
    };

    // Initialize stats buffer
    this.statsBuffer.set(gameId, {
      gameId,
      playTime: 0,
      transactions: 0,
      gasSpent: '0',
      rewardsEarned: '0',
      winRate: 0,
      achievements: [],
    });

    console.log(`Started recording for game: ${gameId}`);
  }

  /**
   * Stop recording and generate clip
   */
  async stopRecording(): Promise<ClipMetadata | null> {
    if (!this.recordingState.isRecording || !this.recordingState.gameId) {
      console.warn('Not currently recording');
      return null;
    }

    const currentGameId = this.recordingState.gameId;
    const recordingDuration = this.recordingState.startTime
      ? (Date.now() - this.recordingState.startTime.getTime()) / 1000
      : 0;

    // Get accumulated stats
    const gameStats = this.statsBuffer.get(currentGameId) || {
      gameId: currentGameId,
      playTime: recordingDuration,
      transactions: 0,
      gasSpent: '0',
      rewardsEarned: '0',
      winRate: 0,
      achievements: [],
    };

    // Generate clip metadata
    const generatedClip: ClipMetadata = {
      id: `clip-${Date.now()}`,
      gameId: currentGameId,
      timestamp: this.recordingState.startTime || new Date(),
      duration: recordingDuration,
      stats: gameStats as GameStats,
      thumbnailUrl: await this.generateThumbnail(currentGameId),
      videoUrl: await this.generateVideo(currentGameId, recordingDuration),
    };

    this.clips.push(generatedClip);

    // Reset recording state
    this.recordingState = {
      isRecording: false,
      startTime: null,
      gameId: null,
    };

    return generatedClip;
  }

  /**
   * Update game stats during recording
   */
  updateStats(gameId: string, statsUpdate: Partial<GameStats>) {
    if (!this.recordingState.isRecording || this.recordingState.gameId !== gameId) {
      return;
    }

    const currentStats = this.statsBuffer.get(gameId) || {};
    this.statsBuffer.set(gameId, { ...currentStats, ...statsUpdate });
  }

  /**
   * Record a transaction
   */
  recordTransaction(gameId: string, gasUsed: string) {
    const currentStats = this.statsBuffer.get(gameId);
    if (currentStats) {
      currentStats.transactions = (currentStats.transactions || 0) + 1;
      currentStats.gasSpent = (BigInt(currentStats.gasSpent || '0') + BigInt(gasUsed)).toString();
      this.statsBuffer.set(gameId, currentStats);
    }
  }

  /**
   * Record a reward earned
   */
  recordReward(gameId: string, amount: string) {
    const currentStats = this.statsBuffer.get(gameId);
    if (currentStats) {
      currentStats.rewardsEarned = (BigInt(currentStats.rewardsEarned || '0') + BigInt(amount)).toString();
      this.statsBuffer.set(gameId, currentStats);
    }
  }

  /**
   * Record an achievement
   */
  recordAchievement(gameId: string, achievement: string) {
    const currentStats = this.statsBuffer.get(gameId);
    if (currentStats) {
      currentStats.achievements = [...(currentStats.achievements || []), achievement];
      this.statsBuffer.set(gameId, currentStats);
    }
  }

  /**
   * Generate thumbnail for clip
   */
  private async generateThumbnail(gameId: string): Promise<string> {
    // In production, this would capture a screenshot
    // For demo, return a placeholder
    return `https://via.placeholder.com/320x180.png?text=${encodeURIComponent(gameId)}`;
  }

  /**
   * Generate video with stats overlay
   */
  private async generateVideo(gameId: string, _duration: number): Promise<string> {
    // In production, this would:
    // 1. Process recorded gameplay footage
    // 2. Add stats overlay
    // 3. Render and upload video
    
    // For demo, return a placeholder
    return `https://example.com/clips/${gameId}-${Date.now()}.mp4`;
  }

  /**
   * Generate stats overlay image
   */
  generateStatsOverlay(gameStats: GameStats): string {
    // In production, this would generate an image with stats
    const formattedOverlayData = {
      playTime: `${Math.floor(gameStats.playTime / 60)}m ${Math.floor(gameStats.playTime % 60)}s`,
      transactions: gameStats.transactions,
      gasSpent: `${(parseFloat(gameStats.gasSpent) / 1e18).toFixed(4)} ETH`,
      rewardsEarned: `${(parseFloat(gameStats.rewardsEarned) / 1e18).toFixed(2)} tokens`,
      winRate: `${(gameStats.winRate * 100).toFixed(1)}%`,
      achievements: gameStats.achievements.length,
    };

    // Return data URL or image URL
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="20" y="40" fill="#ffffff" font-size="20" font-family="Arial">Game Stats</text>
        <text x="20" y="70" fill="#00d9ff" font-size="14">Play Time: ${formattedOverlayData.playTime}</text>
        <text x="20" y="90" fill="#00d9ff" font-size="14">Transactions: ${formattedOverlayData.transactions}</text>
        <text x="20" y="110" fill="#00d9ff" font-size="14">Gas Spent: ${formattedOverlayData.gasSpent}</text>
        <text x="20" y="130" fill="#00d9ff" font-size="14">Rewards: ${formattedOverlayData.rewardsEarned}</text>
        <text x="20" y="150" fill="#00d9ff" font-size="14">Win Rate: ${formattedOverlayData.winRate}</text>
        <text x="20" y="170" fill="#00d9ff" font-size="14">Achievements: ${formattedOverlayData.achievements}</text>
      </svg>
    `)}`;
  }

  /**
   * Get all clips
   */
  getClips(): ClipMetadata[] {
    return this.clips;
  }

  /**
   * Get clips for a specific game
   */
  getClipsForGame(gameId: string): ClipMetadata[] {
    return this.clips.filter((clipMetadata) => clipMetadata.gameId === gameId);
  }

  /**
   * Get recording state
   */
  getRecordingState(): RecordingState {
    return this.recordingState;
  }
}

export const clipGeneratorService = new ClipGeneratorService();
