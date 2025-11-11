import { Router, Request, Response } from 'express';
import cacheService from '../services/cache.service';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheEnabled = cacheService.isEnabled();
    let cacheStatus = 'disabled';

    if (cacheEnabled) {
      const testKey = 'health:check';
      await cacheService.set(testKey, { test: true }, 5);
      const testValue = await cacheService.get(testKey);
      cacheStatus = testValue ? 'connected' : 'error';
      await cacheService.delete(testKey);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        cache: {
          enabled: cacheEnabled,
          status: cacheStatus,
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/health/ready
 * Readiness check
 */
router.get('/ready', (_req: Request, res: Response) => {
  const response: ApiResponse<any> = {
    success: true,
    data: { ready: true },
    timestamp: Date.now(),
  };

  res.json(response);
});

/**
 * GET /api/health/live
 * Liveness check
 */
router.get('/live', (_req: Request, res: Response) => {
  const response: ApiResponse<any> = {
    success: true,
    data: { alive: true },
    timestamp: Date.now(),
  };

  res.json(response);
});

export default router;
