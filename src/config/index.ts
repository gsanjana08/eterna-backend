import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '30', 10),
    enabled: process.env.CACHE_ENABLED !== 'false',
  },
  api: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT || '300', 10),
    timeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
  },
  websocket: {
    updateInterval: parseInt(process.env.WS_UPDATE_INTERVAL || '5000', 10),
    priceChangeThreshold: parseFloat(process.env.WS_PRICE_CHANGE_THRESHOLD || '1.0'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
