import { SuccessMetrics, FunnelMetrics, TelemetryEvent } from '../types';
import { telemetryService } from './telemetry';

/**
 * Success Metrics Service
 * 
 * Calculates real-time success metrics based on telemetry events.
 * Provides insights into user conversion funnels, transaction reliability,
 * and overall system performance.
 */
class SuccessMetricsService {
  private events: TelemetryEvent[] = [];
  private maxEventsInMemory = 1000;

  constructor() {
    // Subscribe to telemetry events for real-time metrics
    telemetryService.subscribe((event) => {
      this.addEvent(event);
    });
  }

  /**
   * Add an event to the in-memory buffer for metrics calculation
   */
  private addEvent(event: TelemetryEvent): void {
    this.events.push(event);
    
    // Keep only recent events in memory
    if (this.events.length > this.maxEventsInMemory) {
      this.events.shift();
    }
  }

  /**
   * Calculate overall success metrics
   */
  calculateSuccessMetrics(): SuccessMetrics {
    return {
      firstSuccessRate: this.calculateFirstSuccessRate(),
      quoteToSendConversion: this.calculateQuoteToSendConversion(),
      executionReliability: this.calculateExecutionReliability(),
      averageTimeToFirstTransaction: this.calculateAverageTimeToFirstTx(),
      revertRate: this.calculateRevertRate(),
      claimRate: this.calculateClaimRate(),
    };
  }

  /**
   * Calculate first success rate (new users who complete first transaction)
   */
  private calculateFirstSuccessRate(): number {
    const newUsers = this.getUniqueUsers('siwe_login_success');
    const usersWithTx = this.getUniqueUsers('tx_mined', (event) => 
      event.payload.status === 'success'
    );

    if (newUsers === 0) return 0;
    return (usersWithTx / newUsers) * 100;
  }

  /**
   * Calculate quote-to-send conversion rate
   */
  private calculateQuoteToSendConversion(): number {
    const quoteRequests = this.getEventCount('quote_requested');
    const transactionsSent = this.getEventCount('tx_send');

    if (quoteRequests === 0) return 0;
    return (transactionsSent / quoteRequests) * 100;
  }

  /**
   * Calculate execution reliability (successful txs / all txs)
   */
  private calculateExecutionReliability(): number {
    const totalTx = this.getEventCount('tx_mined');
    const successfulTx = this.getEventCount('tx_mined', (event) =>
      event.payload.status === 'success'
    );

    if (totalTx === 0) return 100; // No failures if no transactions
    return (successfulTx / totalTx) * 100;
  }

  /**
   * Calculate average time to first transaction (in minutes)
   */
  private calculateAverageTimeToFirstTx(): number {
    const userTimes: number[] = [];
    const users = new Set<string>();

    // Find first login for each user
    const firstLogins = new Map<string, Date>();
    const firstTx = new Map<string, Date>();

    this.events.forEach((event) => {
      const address = event.userAddress;
      if (!address) return;

      if (event.eventType === 'siwe_login_success') {
        if (!firstLogins.has(address) && event.timestamp) {
          firstLogins.set(address, event.timestamp);
        }
      }

      if (event.eventType === 'tx_mined' && event.payload.status === 'success') {
        if (!firstTx.has(address) && event.timestamp) {
          firstTx.set(address, event.timestamp);
        }
      }
    });

    // Calculate time difference for each user
    firstLogins.forEach((loginTime, address) => {
      const txTime = firstTx.get(address);
      if (txTime) {
        const diffMinutes = (txTime.getTime() - loginTime.getTime()) / 1000 / 60;
        userTimes.push(diffMinutes);
      }
    });

    if (userTimes.length === 0) return 0;
    return userTimes.reduce((sum, time) => sum + time, 0) / userTimes.length;
  }

  /**
   * Calculate revert rate (simulation reverts / all simulations)
   */
  private calculateRevertRate(): number {
    const totalSimulations = this.getEventCount('simulation_ok') + 
                             this.getEventCount('simulation_revert');
    const reverts = this.getEventCount('simulation_revert');

    if (totalSimulations === 0) return 0;
    return (reverts / totalSimulations) * 100;
  }

  /**
   * Calculate reward claim rate
   */
  private calculateClaimRate(): number {
    const rewardsFound = this.getEventCount('reward_found');
    const rewardsClaimed = this.getEventCount('reward_claimed');

    if (rewardsFound === 0) return 0;
    return (rewardsClaimed / rewardsFound) * 100;
  }

  /**
   * Get funnel metrics for detailed analysis
   */
  getFunnelMetrics(): FunnelMetrics {
    return {
      newUsers: this.getUniqueUsers('siwe_login_success'),
      usersWithFirstTransaction: this.getUniqueUsers('tx_mined', (event) =>
        event.payload.status === 'success'
      ),
      quoteRequests: this.getEventCount('quote_requested'),
      successfulSimulations: this.getEventCount('simulation_ok'),
      transactionsSent: this.getEventCount('tx_send'),
      transactionsMined: this.getEventCount('tx_mined', (event) =>
        event.payload.status === 'success'
      ),
    };
  }

  /**
   * Get metrics for a specific chain
   */
  getChainMetrics(chainId: number): SuccessMetrics {
    const chainEvents = this.events.filter(event => event.chainId === chainId);
    
    // Temporarily replace events for calculation
    const originalEvents = this.events;
    this.events = chainEvents;
    const metrics = this.calculateSuccessMetrics();
    this.events = originalEvents;

    return metrics;
  }

  /**
   * Get metrics for a specific time period
   */
  getMetricsForPeriod(startTime: Date, endTime: Date): SuccessMetrics {
    const periodEvents = this.events.filter(event => {
      if (!event.timestamp) return false;
      return event.timestamp >= startTime && event.timestamp <= endTime;
    });

    // Temporarily replace events for calculation
    const originalEvents = this.events;
    this.events = periodEvents;
    const metrics = this.calculateSuccessMetrics();
    this.events = originalEvents;

    return metrics;
  }

  /**
   * Helper: Get count of events by type with optional filter
   */
  private getEventCount(
    eventType: string,
    filter?: (event: TelemetryEvent) => boolean
  ): number {
    return this.events.filter(event => {
      if (event.eventType !== eventType) return false;
      if (filter && !filter(event)) return false;
      return true;
    }).length;
  }

  /**
   * Helper: Get unique users count for a specific event type
   */
  private getUniqueUsers(
    eventType: string,
    filter?: (event: TelemetryEvent) => boolean
  ): number {
    const users = new Set<string>();
    
    this.events.forEach(event => {
      if (event.eventType !== eventType) return;
      if (filter && !filter(event)) return;
      if (event.userAddress) {
        users.add(event.userAddress);
      }
    });

    return users.size;
  }

  /**
   * Get real-time success summary
   */
  getSuccessSummary(): {
    metrics: SuccessMetrics;
    funnel: FunnelMetrics;
    totalEvents: number;
    activeUsers: number;
  } {
    return {
      metrics: this.calculateSuccessMetrics(),
      funnel: this.getFunnelMetrics(),
      totalEvents: this.events.length,
      activeUsers: this.getUniqueUsers('siwe_login_success'),
    };
  }

  /**
   * Clear in-memory events (for testing or reset)
   */
  clearEvents(): void {
    this.events = [];
  }
}

export const successMetricsService = new SuccessMetricsService();
