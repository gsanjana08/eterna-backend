import { RateLimitConfig } from '../types';
import logger from './logger';

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove expired requests
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.config.windowMs - (now - oldestRequest);
      
      logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      return this.waitForSlot();
    }

    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRequestCount(): number {
    const now = Date.now();
    return this.requests.filter((timestamp) => now - timestamp < this.config.windowMs).length;
  }
}

export class ExponentialBackoff {
  private attempt: number = 0;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error: any) {
      if (this.shouldRetry(error)) {
        const delay = this.calculateDelay();
        logger.warn(`Request failed, retrying in ${delay}ms (attempt ${this.attempt + 1})`, {
          error: error.message,
        });
        await this.sleep(delay);
        this.attempt++;
        return this.execute(fn);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    const delay = this.calculateDelay();
    return (
      this.attempt < 5 &&
      delay <= this.config.maxBackoff &&
      (error.response?.status === 429 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')
    );
  }

  private calculateDelay(): number {
    const baseDelay = 1000;
    const delay = baseDelay * Math.pow(this.config.backoffMultiplier, this.attempt);
    return Math.min(delay, this.config.maxBackoff);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private reset(): void {
    this.attempt = 0;
  }
}

