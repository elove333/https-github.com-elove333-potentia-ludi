/**
 * Base class for services that need periodic monitoring/updates
 */
export abstract class PeriodicMonitor {
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Start periodic monitoring with specified interval
   * @param intervalMs - Interval in milliseconds between updates
   */
  protected startMonitoring(intervalMs: number) {
    // Update at specified interval
    this.updateInterval = setInterval(() => {
      this.performUpdate();
    }, intervalMs);

    // Initial update
    this.performUpdate();
  }

  /**
   * Abstract method to be implemented by subclasses
   * This method will be called periodically
   */
  protected abstract performUpdate(): void | Promise<void>;

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
