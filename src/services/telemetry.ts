import { TelemetryEvent, TelemetryEventType, TelemetryEventCategory } from '../types';

/**
 * Telemetry Service
 * 
 * Handles emission of telemetry events for monitoring, analytics, and success metrics.
 * Events are emitted as structured JSON payloads for storage in the telemetry database.
 */
class TelemetryService {
  private sessionId: string;
  private userAddress?: string;
  private eventQueue: TelemetryEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private intervalId?: NodeJS.Timeout;
  private observers: Array<(event: TelemetryEvent) => void> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startAutoFlush();
  }

  /**
   * Initialize telemetry with user context
   */
  init(userAddress?: string) {
    this.userAddress = userAddress;
    console.log('[Telemetry] Initialized', { sessionId: this.sessionId, userAddress });
  }

  /**
   * Set the current user address for telemetry events
   */
  setUserAddress(address: string | undefined) {
    this.userAddress = address;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Emit a telemetry event
   */
  emit(
    eventType: TelemetryEventType,
    eventCategory: TelemetryEventCategory,
    payload: Record<string, unknown> = {},
    chainId?: number
  ): void {
    const event: TelemetryEvent = {
      eventType,
      eventCategory,
      userAddress: this.userAddress,
      sessionId: this.sessionId,
      chainId,
      payload: {
        ...payload,
        _timestamp: new Date().toISOString(),
        _sessionId: this.sessionId,
      },
      timestamp: new Date(),
    };

    this.eventQueue.push(event);
    this.notifyObservers(event);

    console.log('[Telemetry]', eventType, payload);
  }

  /**
   * Subscribe to telemetry events
   */
  subscribe(callback: (event: TelemetryEvent) => void): () => void {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }

  /**
   * Notify observers of new event
   */
  private notifyObservers(event: TelemetryEvent): void {
    this.observers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Telemetry] Observer callback failed:', {
          error,
          eventType: event.eventType,
          eventCategory: event.eventCategory,
        });
      }
    });
  }

  /**
   * Start auto-flush of event queue
   */
  private startAutoFlush(): void {
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Flush event queue to storage
   * In production, this would send events to a backend API
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, send to backend API
      // await fetch('/api/telemetry', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventsToFlush),
      // });

      console.log(`[Telemetry] Flushed ${eventsToFlush.length} events`);
    } catch (error) {
      console.error('[Telemetry] Failed to flush events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  /**
   * Stop auto-flush and clean up
   */
  async destroy(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    await this.flush();
  }

  // ============= Event Emitters for Common Events =============

  /**
   * Emit SIWE login success event
   */
  emitLoginSuccess(address: string, chainId: number): void {
    this.setUserAddress(address);
    this.emit('siwe_login_success', 'auth', {
      address,
      method: 'siwe',
    }, chainId);
  }

  /**
   * Emit SIWE login failure event
   */
  emitLoginFailure(reason: string, chainId?: number): void {
    this.emit('siwe_login_failure', 'auth', {
      reason,
      method: 'siwe',
    }, chainId);
  }

  /**
   * Emit simulation success event
   */
  emitSimulationOk(chainId: number, gasEstimate: string, transactionData: Record<string, unknown>): void {
    this.emit('simulation_ok', 'simulation', {
      simulation_status: 'ok',
      gas_estimate: gasEstimate,
      transaction: transactionData,
    }, chainId);
  }

  /**
   * Emit simulation revert event
   */
  emitSimulationRevert(chainId: number, reason: string, transactionData: Record<string, unknown>): void {
    this.emit('simulation_revert', 'simulation', {
      simulation_status: 'revert',
      revert_reason: reason,
      transaction: transactionData,
    }, chainId);
  }

  /**
   * Emit transaction send event
   */
  emitTransactionSend(
    chainId: number,
    txHash: string,
    type: string,
    value: string
  ): void {
    this.emit('tx_send', 'transaction', {
      tx_hash: txHash,
      tx_type: type,
      value,
    }, chainId);
  }

  /**
   * Emit transaction mined event
   */
  emitTransactionMined(
    chainId: number,
    txHash: string,
    status: 'success' | 'failed',
    gasUsed: string,
    blockNumber?: number
  ): void {
    this.emit('tx_mined', 'transaction', {
      tx_hash: txHash,
      status,
      gas_used: gasUsed,
      block_number: blockNumber,
    }, chainId);
  }

  /**
   * Emit reward found event
   */
  emitRewardFound(
    chainId: number,
    tokenSymbol: string,
    amount: string,
    usdValue: number,
    source: string
  ): void {
    this.emit('reward_found', 'reward', {
      token_symbol: tokenSymbol,
      reward_amount: amount,
      usd_value: usdValue,
      source,
    }, chainId);
  }

  /**
   * Emit reward claimed event
   */
  emitRewardClaimed(
    chainId: number,
    tokenSymbol: string,
    amount: string,
    txHash: string
  ): void {
    this.emit('reward_claimed', 'reward', {
      token_symbol: tokenSymbol,
      reward_amount: amount,
      tx_hash: txHash,
    }, chainId);
  }

  /**
   * Emit guardrail violation event
   */
  emitGuardrailViolation(
    violationType: string,
    reason: string,
    severity: 'warning' | 'critical',
    metadata: Record<string, unknown>
  ): void {
    this.emit('guardrail_violation', 'guardrail', {
      violation_type: violationType,
      reason,
      severity,
      ...metadata,
    });
  }

  /**
   * Emit quote requested event
   */
  emitQuoteRequested(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string
  ): void {
    this.emit('quote_requested', 'swap', {
      from_token: fromToken,
      to_token: toToken,
      amount,
    }, chainId);
  }

  /**
   * Emit swap executed event
   */
  emitSwapExecuted(
    chainId: number,
    fromToken: string,
    toToken: string,
    amountIn: string,
    amountOut: string,
    route: string[]
  ): void {
    this.emit('swap_executed', 'swap', {
      from_token: fromToken,
      to_token: toToken,
      amount_in: amountIn,
      amount_out: amountOut,
      route,
    }, chainId);
  }

  /**
   * Emit game detected event
   */
  emitGameDetected(gameId: string, gameName: string, url: string, chainId: number): void {
    this.emit('game_detected', 'game', {
      game_id: gameId,
      game_name: gameName,
      url,
    }, chainId);
  }
}

export const telemetryService = new TelemetryService();
