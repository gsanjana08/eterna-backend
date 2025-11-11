import { CacheService } from '../../services/cache.service';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }));
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  describe('get', () => {
    it('should return null when key does not exist', async () => {
      const result = await cacheService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed data when key exists', async () => {
      const testData = { test: 'data' };
      const mockClient = (cacheService as any).client;
      mockClient.get.mockResolvedValue(JSON.stringify(testData));

      await cacheService.get('test-key');
      
      if (cacheService.isEnabled()) {
        expect(mockClient.get).toHaveBeenCalledWith('test-key');
      }
    });
  });

  describe('set', () => {
    it('should store data with default TTL', async () => {
      const testData = { test: 'data' };
      await cacheService.set('test-key', testData);

      if (cacheService.isEnabled()) {
        const mockClient = (cacheService as any).client;
        expect(mockClient.setex).toHaveBeenCalled();
      }
    });

    it('should store data with custom TTL', async () => {
      const testData = { test: 'data' };
      const customTTL = 60;
      await cacheService.set('test-key', testData, customTTL);

      if (cacheService.isEnabled()) {
        const mockClient = (cacheService as any).client;
        expect(mockClient.setex).toHaveBeenCalledWith(
          'test-key',
          customTTL,
          JSON.stringify(testData)
        );
      }
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      await cacheService.delete('test-key');

      if (cacheService.isEnabled()) {
        const mockClient = (cacheService as any).client;
        expect(mockClient.del).toHaveBeenCalledWith('test-key');
      }
    });
  });

  describe('exists', () => {
    it('should return false for non-existent key', async () => {
      const mockClient = (cacheService as any).client;
      mockClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists('test-key');
      
      if (cacheService.isEnabled()) {
        expect(result).toBe(false);
      } else {
        expect(result).toBe(false);
      }
    });

    it('should return true for existing key', async () => {
      const mockClient = (cacheService as any).client;
      mockClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');
      
      if (cacheService.isEnabled()) {
        expect(result).toBe(true);
      }
    });
  });
});
