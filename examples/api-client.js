/**
 * Example API Client for Eterna Backend
 * 
 * This demonstrates how to interact with the REST API
 */

const BASE_URL = 'http://localhost:3000';

class EternaAPIClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error: ${error.message}`);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.request('/api/health');
  }

  // Get all tokens with filters
  async getTokens(options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.timePeriod) params.append('timePeriod', options.timePeriod);
    if (options.minVolume) params.append('minVolume', options.minVolume);
    if (options.minMarketCap) params.append('minMarketCap', options.minMarketCap);

    const query = params.toString();
    const endpoint = `/api/tokens${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  // Get specific token
  async getToken(address) {
    return this.request(`/api/tokens/${address}`);
  }

  // Refresh token data
  async refreshTokens() {
    return this.request('/api/tokens/refresh', { method: 'POST' });
  }
}

// Example usage
async function examples() {
  const client = new EternaAPIClient();

  console.log('=== Eterna API Client Examples ===\n');

  // 1. Health check
  console.log('1. Health Check:');
  const health = await client.getHealth();
  console.log(JSON.stringify(health, null, 2));
  console.log('\n');

  // 2. Get top tokens by volume
  console.log('2. Top Tokens by Volume:');
  const topByVolume = await client.getTokens({
    sortBy: 'volume',
    sortOrder: 'desc',
    limit: 5,
  });
  console.log(`Total tokens: ${topByVolume.data.total}`);
  topByVolume.data.data.forEach((token, i) => {
    console.log(`${i + 1}. ${token.token_name} (${token.token_ticker}) - Volume: ${token.volume_sol.toFixed(2)} SOL`);
  });
  console.log('\n');

  // 3. Get tokens with high price change
  console.log('3. Tokens with High 1h Price Change:');
  const highChange = await client.getTokens({
    timePeriod: '1h',
    sortBy: 'price_change',
    sortOrder: 'desc',
    limit: 5,
  });
  highChange.data.data.forEach((token, i) => {
    console.log(`${i + 1}. ${token.token_name} - Change: ${token.price_1hr_change.toFixed(2)}%`);
  });
  console.log('\n');

  // 4. Filter by minimum volume
  console.log('4. Tokens with Volume > 100 SOL:');
  const highVolume = await client.getTokens({
    minVolume: 100,
    sortBy: 'volume',
    sortOrder: 'desc',
    limit: 5,
  });
  console.log(`Found ${highVolume.data.total} tokens`);
  console.log('\n');

  // 5. Pagination example
  console.log('5. Pagination Example:');
  const page1 = await client.getTokens({ limit: 3 });
  console.log(`Page 1 - ${page1.data.data.length} tokens`);
  console.log(`Has more: ${page1.data.has_more}`);
  console.log(`Next cursor: ${page1.data.next_cursor}`);
  
  if (page1.data.has_more) {
    const page2 = await client.getTokens({
      limit: 3,
      cursor: page1.data.next_cursor,
    });
    console.log(`Page 2 - ${page2.data.data.length} tokens`);
  }
  console.log('\n');

  // 6. Refresh data
  console.log('6. Refreshing Token Data:');
  const refresh = await client.refreshTokens();
  console.log(`Refreshed ${refresh.data.count} tokens`);
}

// Run examples if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  global.fetch = fetch;
  
  examples().catch(console.error);
} else {
  // Browser environment
  console.log('EternaAPIClient loaded. Use: const client = new EternaAPIClient();');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EternaAPIClient;
}

