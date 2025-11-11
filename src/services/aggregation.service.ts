import { TokenData, AggregatedTokenData, FilterOptions, PaginatedResponse } from '../types';
import { DexScreenerService } from './dex/dexscreener.service';
import { JupiterService } from './dex/jupiter.service';
import { GeckoTerminalService } from './dex/geckoterminal.service';
import cacheService from './cache.service';
import logger from '../utils/logger';

export class AggregationService {
  private dexScreener: DexScreenerService;
  private jupiter: JupiterService;
  private geckoTerminal: GeckoTerminalService;
  private tokenCache: Map<string, AggregatedTokenData> = new Map();

  constructor() {
    this.dexScreener = new DexScreenerService();
    this.jupiter = new JupiterService();
    this.geckoTerminal = new GeckoTerminalService();
  }

  async aggregateTokenData(): Promise<AggregatedTokenData[]> {
    const cacheKey = 'tokens:aggregated';
    
    // Try to get from cache first
    const cached = await cacheService.get<AggregatedTokenData[]>(cacheKey);
    if (cached) {
      logger.debug('Returning cached aggregated token data');
      return cached;
    }

    try {
      logger.info('Aggregating token data from multiple sources');

      // Fetch from all sources in parallel
      const [dexScreenerTokens, geckoTerminalTokens] = await Promise.all([
        this.dexScreener.getTrendingTokens(),
        this.geckoTerminal.getTopPools(30),
      ]);

      logger.info('Fetched tokens', {
        dexScreener: dexScreenerTokens.length,
        geckoTerminal: geckoTerminalTokens.length,
      });

      // Merge tokens from all sources
      const allTokens = [...dexScreenerTokens, ...geckoTerminalTokens];
      const mergedTokens = this.mergeTokens(allTokens);

      // Enrich with Jupiter data
      const enrichedTokens = await this.jupiter.enrichTokenData(mergedTokens);

      // Convert to aggregated format
      const aggregatedTokens = enrichedTokens.map((token) => this.toAggregatedToken(token));

      // Cache the results
      await cacheService.set(cacheKey, aggregatedTokens);

      // Update in-memory cache
      aggregatedTokens.forEach((token) => {
        this.tokenCache.set(token.token_address, token);
      });

      logger.info(`Successfully aggregated ${aggregatedTokens.length} tokens`);

      return aggregatedTokens;
    } catch (error: any) {
      logger.error('Token aggregation error', { error: error.message });
      return [];
    }
  }

  private mergeTokens(tokens: TokenData[]): TokenData[] {
    const tokenMap = new Map<string, TokenData>();

    for (const token of tokens) {
      const existing = tokenMap.get(token.token_address);

      if (!existing) {
        tokenMap.set(token.token_address, token);
      } else {
        // Merge data from multiple sources
        const merged: TokenData = {
          ...existing,
          sources: [...new Set([...existing.sources, ...token.sources])],
          // Average price values
          price_sol: (existing.price_sol + token.price_sol) / 2,
          // Sum volumes
          volume_sol: existing.volume_sol + token.volume_sol,
          // Take max market cap
          market_cap_sol: Math.max(existing.market_cap_sol, token.market_cap_sol),
          // Sum liquidity
          liquidity_sol: existing.liquidity_sol + token.liquidity_sol,
          // Sum transaction count
          transaction_count: existing.transaction_count + token.transaction_count,
          // Average price changes
          price_1hr_change: (existing.price_1hr_change + token.price_1hr_change) / 2,
          price_24hr_change: existing.price_24hr_change && token.price_24hr_change
            ? (existing.price_24hr_change + token.price_24hr_change) / 2
            : existing.price_24hr_change || token.price_24hr_change,
          price_7d_change: existing.price_7d_change && token.price_7d_change
            ? (existing.price_7d_change + token.price_7d_change) / 2
            : existing.price_7d_change || token.price_7d_change,
          // Take latest update
          last_updated: Math.max(existing.last_updated, token.last_updated),
          // Prefer non-empty protocol
          protocol: existing.protocol !== 'Unknown' ? existing.protocol : token.protocol,
        };

        tokenMap.set(token.token_address, merged);
      }
    }

    return Array.from(tokenMap.values());
  }

  private toAggregatedToken(token: TokenData): AggregatedTokenData {
    const sourceCount = token.sources.length;
    const confidenceScore = this.calculateConfidenceScore(token, sourceCount);

    return {
      ...token,
      source_count: sourceCount,
      confidence_score: confidenceScore,
    };
  }

  private calculateConfidenceScore(token: TokenData, sourceCount: number): number {
    let score = 0;

    // Source count (max 40 points)
    score += Math.min(sourceCount * 20, 40);

    // Liquidity (max 20 points)
    if (token.liquidity_sol > 100) score += 20;
    else if (token.liquidity_sol > 50) score += 15;
    else if (token.liquidity_sol > 10) score += 10;

    // Volume (max 20 points)
    if (token.volume_sol > 1000) score += 20;
    else if (token.volume_sol > 500) score += 15;
    else if (token.volume_sol > 100) score += 10;

    // Transaction count (max 20 points)
    if (token.transaction_count > 500) score += 20;
    else if (token.transaction_count > 100) score += 15;
    else if (token.transaction_count > 50) score += 10;

    return Math.min(score, 100);
  }

  async filterAndSort(
    tokens: AggregatedTokenData[],
    options: FilterOptions
  ): Promise<PaginatedResponse<AggregatedTokenData>> {
    let filtered = [...tokens];

    // Apply filters
    if (options.minVolume) {
      filtered = filtered.filter((t) => t.volume_sol >= options.minVolume!);
    }

    if (options.minMarketCap) {
      filtered = filtered.filter((t) => t.market_cap_sol >= options.minMarketCap!);
    }

    // Filter by time period (price change)
    if (options.timePeriod) {
      filtered = filtered.filter((t) => {
        switch (options.timePeriod) {
          case '1h':
            return Math.abs(t.price_1hr_change) > 0;
          case '24h':
            return t.price_24hr_change !== undefined && Math.abs(t.price_24hr_change) > 0;
          case '7d':
            return t.price_7d_change !== undefined && Math.abs(t.price_7d_change) > 0;
          default:
            return true;
        }
      });
    }

    // Sort
    const sortBy = options.sortBy || 'volume';
    const sortOrder = options.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'volume':
          aValue = a.volume_sol;
          bValue = b.volume_sol;
          break;
        case 'price_change':
          aValue = options.timePeriod === '24h' ? (a.price_24hr_change || 0) :
                   options.timePeriod === '7d' ? (a.price_7d_change || 0) : a.price_1hr_change;
          bValue = options.timePeriod === '24h' ? (b.price_24hr_change || 0) :
                   options.timePeriod === '7d' ? (b.price_7d_change || 0) : b.price_1hr_change;
          break;
        case 'market_cap':
          aValue = a.market_cap_sol;
          bValue = b.market_cap_sol;
          break;
        case 'liquidity':
          aValue = a.liquidity_sol;
          bValue = b.liquidity_sol;
          break;
        case 'transaction_count':
          aValue = a.transaction_count;
          bValue = b.transaction_count;
          break;
        default:
          aValue = a.volume_sol;
          bValue = b.volume_sol;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Pagination
    const limit = options.limit || 20;
    const cursor = options.cursor ? parseInt(options.cursor, 10) : 0;
    const start = cursor;
    const end = start + limit;

    const paginatedData = filtered.slice(start, end);
    const hasMore = end < filtered.length;
    const nextCursor = hasMore ? end.toString() : null;

    return {
      data: paginatedData,
      next_cursor: nextCursor,
      has_more: hasMore,
      total: filtered.length,
    };
  }

  getTokenFromCache(address: string): AggregatedTokenData | undefined {
    return this.tokenCache.get(address);
  }

  getAllCachedTokens(): AggregatedTokenData[] {
    return Array.from(this.tokenCache.values());
  }
}
