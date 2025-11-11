import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { TokenData } from '../../types';
import { RateLimiter, ExponentialBackoff } from '../../utils/rateLimiter';
import logger from '../../utils/logger';
import { config } from '../../config';

export class DexScreenerService {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private backoff: ExponentialBackoff;
  private baseUrl = 'https://api.dexscreener.com/latest/dex';

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

  async searchTokens(query: string = 'solana'): Promise<TokenData[]> {
    try {
      await this.rateLimiter.waitForSlot();

      const response = await this.backoff.execute(() =>
        this.client.get(`/search?q=${encodeURIComponent(query)}`)
      );

      if (!response.data || !response.data.pairs) {
        return [];
      }

      return this.mapDexScreenerData(response.data.pairs);
    } catch (error: any) {
      logger.error('DexScreener search error', { query, error: error.message });
      return [];
    }
  }

  async getTokensByAddress(addresses: string[]): Promise<TokenData[]> {
    try {
      const allTokens: TokenData[] = [];

      for (const address of addresses) {
        await this.rateLimiter.waitForSlot();

        try {
          const response = await this.backoff.execute(() =>
            this.client.get(`/tokens/${address}`)
          );

          if (response.data && response.data.pairs) {
            allTokens.push(...this.mapDexScreenerData(response.data.pairs));
          }
        } catch (error: any) {
          logger.warn('Failed to fetch token from DexScreener', { address, error: error.message });
        }
      }

      return allTokens;
    } catch (error: any) {
      logger.error('DexScreener batch error', { error: error.message });
      return [];
    }
  }

  async getTrendingTokens(): Promise<TokenData[]> {
    try {
      // DexScreener doesn't have a trending endpoint, so we search for popular tokens
      const searches = ['SOL', 'BONK', 'WIF', 'MYRO', 'SAMO'];
      const allTokens: TokenData[] = [];

      for (const search of searches) {
        const tokens = await this.searchTokens(search);
        allTokens.push(...tokens.slice(0, 5));
      }

      return allTokens;
    } catch (error: any) {
      logger.error('DexScreener trending error', { error: error.message });
      return [];
    }
  }

  private mapDexScreenerData(pairs: any[]): TokenData[] {
    return pairs
      .filter((pair) => pair.chainId === 'solana')
      .map((pair) => {
        const baseToken = pair.baseToken;
        const priceUsd = parseFloat(pair.priceUsd || '0');
        const priceNative = parseFloat(pair.priceNative || '0');
        
        return {
          token_address: baseToken.address,
          token_name: baseToken.name,
          token_ticker: baseToken.symbol,
          price_sol: priceNative,
          market_cap_sol: parseFloat(pair.marketCap || '0') / (priceUsd || 1),
          volume_sol: parseFloat(pair.volume?.h24 || '0') / (priceUsd || 1),
          liquidity_sol: parseFloat(pair.liquidity?.usd || '0') / (priceUsd || 1),
          transaction_count: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
          price_1hr_change: parseFloat(pair.priceChange?.h1 || '0'),
          price_24hr_change: parseFloat(pair.priceChange?.h24 || '0'),
          price_7d_change: parseFloat(pair.priceChange?.h7 || '0'),
          volume_24h: parseFloat(pair.volume?.h24 || '0'),
          protocol: pair.dexId || 'Unknown',
          sources: ['dexscreener'],
          last_updated: Date.now(),
        };
      });
  }
}
