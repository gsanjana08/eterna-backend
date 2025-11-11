import { AggregationService } from '../../services/aggregation.service';
import { FilterOptions } from '../../types';

// Mock the DEX services
jest.mock('../../services/dex/dexscreener.service');
jest.mock('../../services/dex/jupiter.service');
jest.mock('../../services/dex/geckoterminal.service');
jest.mock('../../services/cache.service');

describe('AggregationService', () => {
  let aggregationService: AggregationService;

  beforeEach(() => {
    aggregationService = new AggregationService();
  });

  describe('filterAndSort', () => {
    const mockTokens: any[] = [
      {
        token_address: 'addr1',
        token_name: 'Token 1',
        token_ticker: 'TK1',
        price_sol: 0.001,
        market_cap_sol: 1000,
        volume_sol: 500,
        liquidity_sol: 200,
        transaction_count: 100,
        price_1hr_change: 5.5,
        protocol: 'Raydium',
        sources: ['dexscreener'],
        last_updated: Date.now(),
        source_count: 1,
        confidence_score: 50,
      },
      {
        token_address: 'addr2',
        token_name: 'Token 2',
        token_ticker: 'TK2',
        price_sol: 0.002,
        market_cap_sol: 2000,
        volume_sol: 1000,
        liquidity_sol: 400,
        transaction_count: 200,
        price_1hr_change: -2.3,
        protocol: 'Orca',
        sources: ['geckoterminal'],
        last_updated: Date.now(),
        source_count: 1,
        confidence_score: 60,
      },
    ];

    it('should return paginated results with default options', async () => {
      const options: FilterOptions = {};
      const result = await aggregationService.filterAndSort(mockTokens, options);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('next_cursor');
      expect(result).toHaveProperty('has_more');
      expect(result).toHaveProperty('total');
      expect(result.data.length).toBeLessThanOrEqual(20);
    });

    it('should filter by minimum volume', async () => {
      const options: FilterOptions = {
        minVolume: 600,
      };
      const result = await aggregationService.filterAndSort(mockTokens, options);

      expect(result.data.every((t) => t.volume_sol >= 600)).toBe(true);
    });

    it('should filter by minimum market cap', async () => {
      const options: FilterOptions = {
        minMarketCap: 1500,
      };
      const result = await aggregationService.filterAndSort(mockTokens, options);

      expect(result.data.every((t) => t.market_cap_sol >= 1500)).toBe(true);
    });

    it('should sort by volume descending', async () => {
      const options: FilterOptions = {
        sortBy: 'volume',
        sortOrder: 'desc',
      };
      const result = await aggregationService.filterAndSort(mockTokens, options);

      if (result.data.length > 1) {
        expect(result.data[0].volume_sol).toBeGreaterThanOrEqual(result.data[1].volume_sol);
      }
    });

    it('should sort by market cap ascending', async () => {
      const options: FilterOptions = {
        sortBy: 'market_cap',
        sortOrder: 'asc',
      };
      const result = await aggregationService.filterAndSort(mockTokens, options);

      if (result.data.length > 1) {
        expect(result.data[0].market_cap_sol).toBeLessThanOrEqual(result.data[1].market_cap_sol);
      }
    });

    it('should handle pagination with limit', async () => {
      const options: FilterOptions = {
        limit: 1,
      };
      const result = await aggregationService.filterAndSort(mockTokens, options);

      expect(result.data.length).toBe(1);
      expect(result.has_more).toBe(true);
      expect(result.next_cursor).not.toBeNull();
    });

    it('should handle pagination with cursor', async () => {
      const options: FilterOptions = {
        limit: 1,
        cursor: '1',
      };
      const result = await aggregationService.filterAndSort(mockTokens, options);

      expect(result.data.length).toBeLessThanOrEqual(1);
    });

    it('should return correct total count', async () => {
      const options: FilterOptions = {};
      const result = await aggregationService.filterAndSort(mockTokens, options);

      expect(result.total).toBe(mockTokens.length);
    });
  });

  describe('getTokenFromCache', () => {
    it('should return undefined for non-existent token', () => {
      const result = aggregationService.getTokenFromCache('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllCachedTokens', () => {
    it('should return an array', () => {
      const result = aggregationService.getAllCachedTokens();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
