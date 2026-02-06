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
    // Prevent duplicate initialization
    if (this.updateInterval !== null) {
      return;
    }

    // Update at specified interval with error handling
    this.updateInterval = setInterval(() => {
      try {
        const result = this.performUpdate();
        // Handle async performUpdate
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error('Error in periodic update:', error);
          });
        }
      } catch (error) {
        console.error('Error in periodic update:', error);
      }
    }, intervalMs);

    // Initial update with error handling
    try {
      const result = this.performUpdate();
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error('Error in initial update:', error);
        });
      }
    } catch (error) {
      console.error('Error in initial update:', error);
    }
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
