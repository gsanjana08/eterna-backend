import request from 'supertest';
import express, { Application } from 'express';
import healthRoutes from '../../routes/health.routes';

// Mock cache service
jest.mock('../../services/cache.service', () => ({
  __esModule: true,
  default: {
    isEnabled: jest.fn().mockReturnValue(false),
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Health API', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoutes);
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('cache');
      expect(response.body.data).toHaveProperty('memory');
    });

    it('should include timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });

    it('should return cache status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.cache).toHaveProperty('enabled');
      expect(response.body.data.cache).toHaveProperty('status');
    });

    it('should return memory usage', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.memory).toHaveProperty('used');
      expect(response.body.data.memory).toHaveProperty('total');
      expect(typeof response.body.data.memory.used).toBe('number');
      expect(typeof response.body.data.memory.total).toBe('number');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('ready', true);
    });
  });

  describe('GET /api/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('alive', true);
    });
  });
});
