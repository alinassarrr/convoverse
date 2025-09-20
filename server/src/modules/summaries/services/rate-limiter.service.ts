import { Injectable, Logger } from '@nestjs/common';
import { SummariesConfig } from '../config/summaries.config';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private lastApiCall = 0;

  async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;

    if (timeSinceLastCall < SummariesConfig.MIN_API_INTERVAL) {
      const waitTime = SummariesConfig.MIN_API_INTERVAL - timeSinceLastCall;
      this.logger.log(`Rate limiting: waiting ${waitTime}ms before API call`);
      await this.sleep(waitTime);
    }

    this.lastApiCall = Date.now();
  }

  /**
   * Extracts retry delay from Google API error response
   */
  extractRetryDelay(errorMessage: string): number | null {
    try {
      const retryDelayMatch = errorMessage.match(/"retryDelay":"(\d+)s"/);
      if (retryDelayMatch) {
        return parseInt(retryDelayMatch[1]) * 1000; // Convert seconds to milliseconds
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Calculates exponential backoff delay
   */
  calculateBackoffDelay(retryCount: number): number {
    return Math.pow(2, retryCount) * 1000;
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
