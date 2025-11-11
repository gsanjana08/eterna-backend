import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import logger from './utils/logger';
import { AggregationService } from './services/aggregation.service';
import { WebSocketService } from './services/websocket.service';
import tokensRoutes from './routes/tokens.routes';
import healthRoutes from './routes/health.routes';
import cacheService from './services/cache.service';
import cron from 'node-cron';

class EternaServer {
  private app: Application;
  private server: HttpServer;
  private aggregationService: AggregationService;
  private webSocketService: WebSocketService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.aggregationService = new AggregationService();
    this.webSocketService = new WebSocketService(this.server, this.aggregationService);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupCronJobs();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`,
        });
      });

      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/tokens', tokensRoutes);

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        name: 'Eterna Backend',
        version: '1.0.0',
        description: 'Real-time meme coin data aggregation service',
        endpoints: {
          health: '/api/health',
          tokens: '/api/tokens',
          websocket: 'ws://[host]/socket.io',
        },
        documentation: 'https://github.com/yourusername/eterna-backend',
      });
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: Date.now(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
      });

      res.status(500).json({
        success: false,
        error: config.server.nodeEnv === 'production' 
          ? 'Internal server error' 
          : err.message,
        timestamp: Date.now(),
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled rejection', { reason });
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle termination signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  private setupCronJobs(): void {
    // Refresh token data every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      try {
        logger.debug('Running scheduled token aggregation');
        await this.aggregationService.aggregateTokenData();
      } catch (error: any) {
        logger.error('Cron job error', { error: error.message });
      }
    });

    logger.info('Cron jobs scheduled');
  }

  async start(): Promise<void> {
    try {
      // Initial data fetch
      logger.info('Fetching initial token data...');
      await this.aggregationService.aggregateTokenData();
      logger.info('Initial data fetch complete');

      // Start WebSocket updates
      this.webSocketService.startUpdates();

      // Start HTTP server
      this.server.listen(config.server.port, () => {
        logger.info(`Server started`, {
          port: config.server.port,
          env: config.server.nodeEnv,
          cache: cacheService.isEnabled() ? 'enabled' : 'disabled',
        });
        
        logger.info('Available endpoints:', {
          health: `http://localhost:${config.server.port}/api/health`,
          tokens: `http://localhost:${config.server.port}/api/tokens`,
          websocket: `ws://localhost:${config.server.port}`,
        });
      });
    } catch (error: any) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, starting graceful shutdown`);

    // Stop accepting new connections
    this.server.close(() => {
      logger.info('HTTP server closed');
    });

    // Stop WebSocket updates
    this.webSocketService.stopUpdates();

    // Close cache connection
    await cacheService.close();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  }
}

// Start server
const server = new EternaServer();
server.start();

export default EternaServer;

