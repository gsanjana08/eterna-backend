import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AggregationService } from './aggregation.service';
import { WebSocketUpdate, AggregatedTokenData } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

export class WebSocketService {
  private io: SocketServer;
  private aggregationService: AggregationService;
  private updateInterval: NodeJS.Timeout | null = null;
  private previousTokenState: Map<string, AggregatedTokenData> = new Map();

  constructor(server: HttpServer, aggregationService: AggregationService) {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.aggregationService = aggregationService;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('subscribe:tokens', () => {
        socket.join('tokens');
        logger.debug('Client subscribed to tokens', { socketId: socket.id });
        
        // Send initial data
        this.sendInitialData(socket);
      });

      socket.on('unsubscribe:tokens', () => {
        socket.leave('tokens');
        logger.debug('Client unsubscribed from tokens', { socketId: socket.id });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });

      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error: error.message });
      });
    });
  }

  private async sendInitialData(socket: Socket): Promise<void> {
    try {
      const tokens = this.aggregationService.getAllCachedTokens();
      
      if (tokens.length > 0) {
        socket.emit('initial:tokens', {
          tokens,
          timestamp: Date.now(),
        });
        logger.debug('Sent initial data to client', { 
          socketId: socket.id, 
          tokenCount: tokens.length 
        });
      }
    } catch (error: any) {
      logger.error('Error sending initial data', { error: error.message });
    }
  }

  startUpdates(): void {
    if (this.updateInterval) {
      return;
    }

    logger.info('Starting WebSocket updates', { 
      interval: config.websocket.updateInterval 
    });

    // Initial update
    this.checkForUpdates();

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.checkForUpdates();
    }, config.websocket.updateInterval);
  }

  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Stopped WebSocket updates');
    }
  }

  private async checkForUpdates(): Promise<void> {
    try {
      const currentTokens = await this.aggregationService.aggregateTokenData();

      for (const token of currentTokens) {
        const previousToken = this.previousTokenState.get(token.token_address);

        if (!previousToken) {
          // New token detected
          this.broadcastUpdate({
            type: 'new_token',
            token,
            timestamp: Date.now(),
          });
        } else {
          // Check for significant price changes
          const priceChangePercent = this.calculatePriceChange(
            previousToken.price_sol,
            token.price_sol
          );

          if (Math.abs(priceChangePercent) >= config.websocket.priceChangeThreshold) {
            this.broadcastUpdate({
              type: 'price_update',
              token,
              change_percentage: priceChangePercent,
              timestamp: Date.now(),
            });
          }

          // Check for volume spikes (50% increase)
          if (token.volume_sol > previousToken.volume_sol * 1.5) {
            this.broadcastUpdate({
              type: 'volume_spike',
              token,
              change_percentage: this.calculatePriceChange(
                previousToken.volume_sol,
                token.volume_sol
              ),
              timestamp: Date.now(),
            });
          }
        }
      }

      // Update previous state
      this.previousTokenState.clear();
      currentTokens.forEach((token) => {
        this.previousTokenState.set(token.token_address, token);
      });

      logger.debug('Checked for updates', { tokenCount: currentTokens.length });
    } catch (error: any) {
      logger.error('Error checking for updates', { error: error.message });
    }
  }

  private calculatePriceChange(oldPrice: number, newPrice: number): number {
    if (oldPrice === 0) return 0;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  private broadcastUpdate(update: WebSocketUpdate): void {
    this.io.to('tokens').emit('token:update', update);
    logger.debug('Broadcasted update', { 
      type: update.type, 
      token: update.token.token_ticker 
    });
  }

  broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }
}
