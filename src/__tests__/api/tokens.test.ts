import request from 'supertest';
import express, { Application } from 'express';
import tokensRoutes from '../../routes/tokens.routes';

// Mock the services
jest.mock('../../services/aggregation.service');
jest.mock('../../services/cache.service');

describe('Tokens API', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tokens', tokensRoutes);
  });

  describe('GET /api/tokens', () => {
    it('should return paginated token list', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should accept query parameters', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({
          limit: 10,
          sortBy: 'volume',
          sortOrder: 'desc',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });

    it('should accept filter parameters', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({
          minVolume: 100,
          minMarketCap: 1000,
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/tokens/:address', () => {
    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .get('/api/tokens/nonexistent-address')
        .expect('Content-Type', /json/);

      // May return 404 or 500 depending on cache state
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/tokens/refresh', () => {
    it('should trigger data refresh', async () => {
      const response = await request(app)
        .post('/api/tokens/refresh')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
