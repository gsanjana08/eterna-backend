import { Router, Request, Response } from 'express';
import { AggregationService } from '../services/aggregation.service';
import { FilterOptions, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = Router();
const aggregationService = new AggregationService();

/**
 * GET /api/tokens
 * Get paginated list of tokens with filtering and sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const options: FilterOptions = {
      timePeriod: req.query.timePeriod as '1h' | '24h' | '7d' | undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      cursor: req.query.cursor as string | undefined,
      minVolume: req.query.minVolume ? parseFloat(req.query.minVolume as string) : undefined,
      minMarketCap: req.query.minMarketCap ? parseFloat(req.query.minMarketCap as string) : undefined,
    };

    // Get aggregated data
    const tokens = await aggregationService.aggregateTokenData();

    // Apply filters and pagination
    const result = await aggregationService.filterAndSort(tokens, options);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching tokens', { error: error.message });
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to fetch tokens',
      timestamp: Date.now(),
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/tokens/:address
 * Get specific token by address
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Try to get from cache first
    let token = aggregationService.getTokenFromCache(address);

    if (!token) {
      // If not in cache, fetch fresh data
      await aggregationService.aggregateTokenData();
      token = aggregationService.getTokenFromCache(address);
    }

    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Token not found',
        timestamp: Date.now(),
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof token> = {
      success: true,
      data: token,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching token', { error: error.message });
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to fetch token',
      timestamp: Date.now(),
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/tokens/refresh
 * Force refresh token data
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    const tokens = await aggregationService.aggregateTokenData();

    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count: tokens.length },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error refreshing tokens', { error: error.message });
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to refresh tokens',
      timestamp: Date.now(),
    };

    res.status(500).json(response);
  }
});

export default router;
