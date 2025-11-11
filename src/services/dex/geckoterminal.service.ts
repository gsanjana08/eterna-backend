import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { TokenData } from '../../types';
import { RateLimiter, ExponentialBackoff } from '../../utils/rateLimiter';
import logger from '../../utils/logger';
import { config } from '../../config';

export class GeckoTerminalService {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private backoff: ExponentialBackoff;
  private baseUrl = 'https://api.geckoterminal.com/api/v2';

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

  async getTrendingTokens(): Promise<TokenData[]> {
    try {
      await this.rateLimiter.waitForSlot();

      const response = await this.backoff.execute(() =>
        this.client.get('/networks/solana/trending_pools')
      );

      if (!response.data || !response.data.data) {
        return [];
      }

      return this.mapGeckoTerminalData(response.data.data);
    } catch (error: any) {
      logger.error('GeckoTerminal trending error', { error: error.message });
      return [];
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenData | null> {
    try {
      await this.rateLimiter.waitForSlot();

      const response = await this.backoff.execute(() =>
        this.client.get(`/networks/solana/tokens/${tokenAddress}`)
      );

      if (!response.data || !response.data.data) {
        return null;
      }

      const mapped = this.mapGeckoTerminalData([response.data.data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (error: any) {
      logger.warn('GeckoTerminal token info error', { tokenAddress, error: error.message });
      return null;
    }
  }

  async getTopPools(limit: number = 20): Promise<TokenData[]> {
    try {
      await this.rateLimiter.waitForSlot();

      const response = await this.backoff.execute(() =>
        this.client.get(`/networks/solana/pools?page=1`)
      );

      if (!response.data || !response.data.data) {
        return [];
      }

      const tokens = this.mapGeckoTerminalData(response.data.data);
      return tokens.slice(0, limit);
    } catch (error: any) {
      logger.error('GeckoTerminal top pools error', { error: error.message });
      return [];
    }
  }

  private mapGeckoTerminalData(pools: any[]): TokenData[] {
    return pools.map((pool) => {
      const attributes = pool.attributes;

      const priceUsd = parseFloat(attributes?.base_token_price_usd || attributes?.quote_token_price_usd || '0');
      const priceNative = parseFloat(attributes?.base_token_price_native_currency || '0');

      return {
        token_address: attributes?.base_token_address || pool.id,
        token_name: attributes?.name || 'Unknown',
        token_ticker: attributes?.base_token_symbol || 'UNKNOWN',
        price_sol: priceNative,
        market_cap_sol: parseFloat(attributes?.market_cap_usd || '0') / (priceUsd || 1),
        volume_sol: parseFloat(attributes?.volume_usd?.h24 || '0') / (priceUsd || 1),
        liquidity_sol: parseFloat(attributes?.reserve_in_usd || '0') / (priceUsd || 1),
        transaction_count: (attributes?.transactions?.h24?.buys || 0) + (attributes?.transactions?.h24?.sells || 0),
        price_1hr_change: parseFloat(attributes?.price_change_percentage?.h1 || '0'),
        price_24hr_change: parseFloat(attributes?.price_change_percentage?.h24 || '0'),
        price_7d_change: parseFloat(attributes?.price_change_percentage?.h7 || '0'),
        volume_24h: parseFloat(attributes?.volume_usd?.h24 || '0'),
        protocol: attributes?.dex_id || 'Unknown',
        sources: ['geckoterminal'],
        last_updated: Date.now(),
      };
    });
  }
}
