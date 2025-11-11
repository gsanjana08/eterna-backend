# Eterna Backend - Real-time Meme Coin Data Aggregation Service

A production-ready backend service that aggregates real-time meme coin data from multiple DEX (Decentralized Exchange) sources with efficient caching, WebSocket support, and intelligent data merging.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Demo](#demo)

---

## Overview

This service provides a unified API for accessing real-time meme coin data from multiple sources including DexScreener, Jupiter, and GeckoTerminal. It implements intelligent caching, rate limiting, and WebSocket support for real-time updates.

**Key Capabilities:**
- Aggregates data from 3 DEX APIs simultaneously
- Merges duplicate tokens intelligently by address
- Implements 30-second caching with configurable TTL
- Provides real-time WebSocket updates for price changes and volume spikes
- Supports filtering, sorting, and cursor-based pagination
- Handles rate limiting with exponential backoff

---

## Features

### Data Aggregation
- **Multi-Source Integration**: Fetches token data from DexScreener, Jupiter Price API, and GeckoTerminal
- **Intelligent Merging**: Combines duplicate tokens from multiple sources using token address as unique identifier
- **Confidence Scoring**: Calculates reliability scores based on data sources, liquidity, volume, and transaction count
- **Rate Limiting**: Implements sliding window rate limiter with exponential backoff to handle 300 requests/minute limits

### Real-time Updates
- **WebSocket Support**: Socket.io-based real-time communication
- **Smart Broadcasting**: Only pushes updates for significant changes (>1% price change or >50% volume increase)
- **Scalable Architecture**: Room-based subscriptions support multiple concurrent clients

### API Features
- **RESTful Endpoints**: Clean, documented API with consistent response format
- **Advanced Filtering**: Filter by time periods (1h, 24h, 7d), volume, and market cap
- **Multiple Sort Options**: Sort by volume, price change, market cap, liquidity, or transaction count
- **Cursor Pagination**: Efficient pagination for large datasets

### Performance & Reliability
- **Two-Tier Caching**: In-memory + Redis caching achieving ~95% cache hit rate
- **Error Handling**: Comprehensive error handling with graceful degradation
- **Health Monitoring**: Built-in health check endpoints for monitoring
- **Production Ready**: TypeScript, comprehensive testing, security best practices

---

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **WebSocket**: Socket.io 4.6
- **Cache**: Redis 7 (ioredis client)
- **HTTP Client**: Axios with retry logic
- **Task Scheduling**: node-cron
- **Logging**: Winston
- **Testing**: Jest + Supertest (34 tests)

---

## Architecture

### System Design

```
┌─────────────────────────────────────────┐
│          Client Layer                   │
│   (Browser, Mobile, API Consumers)      │
└──────────────┬──────────────────────────┘
               │ HTTP/WebSocket
┌──────────────┴──────────────────────────┐
│       Express.js API Gateway            │
│  (Security, CORS, Compression)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         Service Layer                   │
│  ┌─────────────────────────────────┐   │
│  │  Aggregation Service            │   │
│  │  • Merges data from 3 DEX APIs  │   │
│  │  • Calculates confidence scores │   │
│  │  • Handles filtering & sorting  │   │
│  └─────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐           │
│  │WebSocket │  │  Cache   │           │
│  │ Service  │  │(Redis)   │           │
│  └──────────┘  └──────────┘           │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      DEX Integration Layer              │
│  ┌─────────────────────────────────┐   │
│  │ DexScreener │ Jupiter │ Gecko   │   │
│  │ Rate Limiter│ Price   │Terminal │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Design Decisions

**1. Token Merging Strategy**
- Tokens are grouped by `token_address` (unique identifier)
- Price values are averaged across sources for accuracy
- Volumes and transaction counts are summed
- Market cap uses the maximum value from all sources
- Confidence score calculated: `Source Count (40%) + Liquidity (20%) + Volume (20%) + Transactions (20%)`

**2. Caching Strategy**
- **L1 Cache**: In-memory for instant access
- **L2 Cache**: Redis for distributed caching
- **TTL**: 30 seconds (configurable) balances data freshness with API usage
- **Result**: Reduces API calls by ~95%

**3. Real-time Update Pattern**
- Initial data load via HTTP GET
- Client subscribes via WebSocket
- Server checks for changes every 5 seconds
- Broadcasts only significant changes (>1% price, >50% volume)
- Eliminates inefficient HTTP polling

**4. Rate Limiting & Reliability**
- Sliding window algorithm limits requests per API
- Exponential backoff: `1s × 2^attempt` (max 30s, 5 retries)
- Graceful degradation when one API fails
- Multi-source redundancy ensures data availability

---

## Installation

### Prerequisites

- Node.js 18 or higher
- Redis (optional, can be disabled)
- npm or yarn

### Local Development

```bash
# Clone repository
git clone https://github.com/gsanjana08/eterna-backend.git
cd eterna-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env as needed

# Run development server
npm run dev
```

### With Docker

```bash
# Start with Docker Compose (includes Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Documentation

### REST Endpoints

#### Get Tokens
```http
GET /api/tokens
```

**Query Parameters:**
- `limit` (number): Results per page (default: 20)
- `cursor` (string): Pagination cursor
- `sortBy` (string): volume | price_change | market_cap | liquidity | transaction_count
- `sortOrder` (string): asc | desc
- `timePeriod` (string): 1h | 24h | 7d
- `minVolume` (number): Minimum volume filter (SOL)
- `minMarketCap` (number): Minimum market cap filter (SOL)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "token_address": "576P1t...",
        "token_name": "PIPE CTO",
        "token_ticker": "PIPE",
        "price_sol": 4.414e-7,
        "market_cap_sol": 441.41,
        "volume_sol": 1322.43,
        "liquidity_sol": 149.36,
        "transaction_count": 2205,
        "price_1hr_change": 120.61,
        "protocol": "Raydium CLMM",
        "sources": ["dexscreener", "geckoterminal"],
        "source_count": 2,
        "confidence_score": 85
      }
    ],
    "next_cursor": "20",
    "has_more": true,
    "total": 150
  },
  "timestamp": 1699999999999
}
```

#### Get Token by Address
```http
GET /api/tokens/:address
```

#### Health Check
```http
GET /api/health
GET /api/health/ready
GET /api/health/live
```

#### Refresh Data
```http
POST /api/tokens/refresh
```

### WebSocket

```javascript
const socket = io('https://eterna-backend-vqx9.onrender.com');

// Subscribe to updates
socket.emit('subscribe:tokens');

// Receive initial data
socket.on('initial:tokens', (data) => {
  console.log(`Loaded ${data.tokens.length} tokens`);
});

// Receive real-time updates
socket.on('token:update', (update) => {
  // update.type: 'price_update' | 'volume_spike' | 'new_token'
  console.log(`${update.type}: ${update.token.token_name}`);
});

// Unsubscribe
socket.emit('unsubscribe:tokens');
```

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

**Test Results:**
```
Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total
Coverage:    Core functionality covered
```

**Test Categories:**
- API Integration Tests: Health endpoints, token operations, filtering, pagination
- Service Unit Tests: Cache operations, aggregation logic, rate limiting
- Edge Cases: Rate limits, missing data, error scenarios

---

## Deployment

### Production Deployment (Render.com)

The service is deployed and accessible at: **https://eterna-backend-vqx9.onrender.com**

#### Deployment Steps

1. **Connect GitHub Repository**
   - Service automatically deploys on push to master branch

2. **Environment Configuration**
   - `NODE_ENV=production`
   - `PORT=10000`
   - `CACHE_ENABLED=false` (free tier)

3. **Build Process**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

For alternative deployment platforms (Railway, Heroku, VPS), see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Demo

### Live Demo Video

**Watch the demonstration:** [https://youtu.be/O2yKwskDGTI](https://youtu.be/O2yKwskDGTI)

The video demonstrates:
- API endpoints with live data from multiple DEX sources
- Real-time WebSocket updates across multiple browser tabs
- Performance testing with 10 rapid API calls
- System architecture and design decisions
- Error handling and rate limiting in action

### Quick Test Commands

```bash
# Set your API URL
export API_URL="https://eterna-backend-vqx9.onrender.com"

# Health check
curl "$API_URL/api/health" | jq

# Get tokens
curl "$API_URL/api/tokens?limit=5" | jq

# Sort by volume
curl "$API_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq

# Filter by volume
curl "$API_URL/api/tokens?minVolume=100" | jq
```

### Postman Collection

Import `postman_collection.json` for 12 pre-configured API requests including:
- Health checks
- Token retrieval with various filters
- Sorting and pagination examples

### WebSocket Demo

Open `examples/websocket-client.html` in a browser to see:
- Real-time token data updates
- Live price change notifications
- Volume spike alerts
- Multi-client synchronization

---

## Project Structure

```
eterna-backend/
├── src/
│   ├── server.ts              # Main application entry
│   ├── config/                # Configuration management
│   ├── services/              # Business logic layer
│   │   ├── aggregation.service.ts
│   │   ├── websocket.service.ts
│   │   ├── cache.service.ts
│   │   └── dex/              # DEX API integrations
│   ├── routes/               # API route handlers
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── __tests__/            # Test suites (34 tests)
├── examples/                 # Demo applications
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
├── postman_collection.json  # API testing collection
└── README.md               # This file
```

---

## Performance Metrics

- **API Response Time**: 
  - Health check: ~5ms
  - Token list (cached): ~10-50ms
  - Token list (uncached): ~2-3s
- **Cache Hit Rate**: ~95%
- **WebSocket Latency**: <10ms
- **Concurrent Connections**: 100+ supported

---

## Security

- **Helmet.js**: Security headers implementation
- **CORS**: Configured cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Query parameter sanitization
- **Error Handling**: Sanitized error messages in production

---

## Links

- **GitHub Repository**: https://github.com/gsanjana08/eterna-backend
- **Live API**: https://eterna-backend-vqx9.onrender.com
- **Demo Video**: https://youtu.be/O2yKwskDGTI
- **Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md)

---


