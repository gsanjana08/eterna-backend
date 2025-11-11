import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { TokenData } from '../../types';
import { RateLimiter, ExponentialBackoff } from '../../utils/rateLimiter';
import logger from '../../utils/logger';
import { config } from '../../config';

export class JupiterService {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private backoff: ExponentialBackoff;
  private baseUrl = 'https://price.jup.ag/v4';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Accept': 'application/json',
      },
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
      },
    });

    this.rateLimiter = new RateLimiter({
      maxRequests: 300,
      windowMs: 60000,
      backoffMultiplier: 2,
      maxBackoff: 30000,
    });

    this.backoff = new ExponentialBackoff({
      maxRequests: 300,
      windowMs: 60000,
      backoffMultiplier: 2,
      maxBackoff: 30000,
    });
  }

  async getTokenPrices(tokenIds: string[]): Promise<Map<string, number>> {
    try {
      if (tokenIds.length === 0) return new Map();

      await this.rateLimiter.waitForSlot();

      const response = await this.backoff.execute(() =>
        this.client.get(`/price?ids=${tokenIds.join(',')}`)
      );

      const priceMap = new Map<string, number>();

      if (response.data && response.data.data) {
        Object.entries(response.data.data).forEach(([id, data]: [string, any]) => {
          if (data && data.price) {
            priceMap.set(id, parseFloat(data.price));
          }
        });
      }

      return priceMap;
    } catch (error: any) {
      logger.error('Jupiter price fetch error', { error: error.message });
      return new Map();
    }
  }

  async enrichTokenData(tokens: TokenData[]): Promise<TokenData[]> {
    try {
      const tokenIds = tokens.map((t) => t.token_address);
      const priceMap = await this.getTokenPrices(tokenIds);

      return tokens.map((token) => {
        const jupiterPrice = priceMap.get(token.token_address);
        if (jupiterPrice) {
          return {
            ...token,
            sources: [...token.sources, 'jupiter'],
          };
        }
        return token;
      });
    } catch (error: any) {
      logger.error('Jupiter enrich error', { error: error.message });
      return tokens;
    }
  }
}
