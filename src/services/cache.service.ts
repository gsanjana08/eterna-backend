import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

export class CacheService {
  private client: Redis;
  private enabled: boolean;

  constructor() {
    this.enabled = config.cache.enabled;
    
    if (this.enabled) {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });
    } else {
      logger.info('Cache is disabled');
      // Create a dummy client for when cache is disabled
      this.client = {} as Redis;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error: any) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = config.cache.ttl): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error: any) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.client.del(key);
    } catch (error: any) {
      logger.error('Cache delete error', { key, error: error.message });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error: any) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error('Cache exists error', { key, error: error.message });
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    if (!this.enabled) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error: any) {
      logger.error('Cache TTL error', { key, error: error.message });
      return -1;
    }
  }

  async close(): Promise<void> {
    if (this.enabled) {
      await this.client.quit();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export default new CacheService();
