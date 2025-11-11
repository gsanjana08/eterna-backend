import { RateLimiter, ExponentialBackoff } from '../../utils/rateLimiter';
import { RateLimitConfig } from '../../types';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const config: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 1000,
    backoffMultiplier: 2,
    maxBackoff: 5000,
  };

  beforeEach(() => {
    rateLimiter = new RateLimiter(config);
  });

  it('should allow requests within limit', async () => {
    const start = Date.now();
    
    for (let i = 0; i < 3; i++) {
      await rateLimiter.waitForSlot();
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should track request count correctly', async () => {
    await rateLimiter.waitForSlot();
    await rateLimiter.waitForSlot();
    
    const count = rateLimiter.getRequestCount();
    expect(count).toBe(2);
  });

  it('should delay when rate limit is reached', async () => {
    // Fill up the rate limiter
    for (let i = 0; i < config.maxRequests; i++) {
      await rateLimiter.waitForSlot();
    }

    const start = Date.now();
    await rateLimiter.waitForSlot();
    const duration = Date.now() - start;

    // Should have waited at least some time
    expect(duration).toBeGreaterThan(0);
  }, 10000);
});

describe('ExponentialBackoff', () => {
  let backoff: ExponentialBackoff;
  const config: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 1000,
    backoffMultiplier: 2,
    maxBackoff: 5000,
  };

  beforeEach(() => {
    backoff = new ExponentialBackoff(config);
  });

  it('should execute function successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await backoff.execute(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce('success');

    const result = await backoff.execute(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should throw on non-retryable error', async () => {
    const mockFn = jest.fn().mockRejectedValue({ response: { status: 404 } });

    await expect(backoff.execute(mockFn)).rejects.toEqual({ response: { status: 404 } });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

