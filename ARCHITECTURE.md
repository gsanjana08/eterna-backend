# Architecture Documentation

## System Overview

The Eterna Backend is a real-time data aggregation service designed to collect, merge, and distribute meme coin data from multiple DEX sources on the Solana blockchain.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Browser  │  │  Mobile  │  │  Desktop │  │   API    │       │
│  │   App    │  │   App    │  │   App    │  │ Consumer │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │             │              │
└───────┼─────────────┼──────────────┼─────────────┼──────────────┘
        │             │              │             │
        │ WebSocket   │              │ HTTP/REST   │
        │             │              │             │
┌───────┴─────────────┴──────────────┴─────────────┴──────────────┐
│                      API Gateway Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Express.js Server                          ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     ││
│  │  │   Helmet     │  │     CORS     │  │ Compression  │     ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘     ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│                      Service Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │            Aggregation Service                              ││
│  │  • Token merging logic                                      ││
│  │  • Confidence scoring                                       ││
│  │  • Filtering & sorting                                      ││
│  │  • Pagination                                               ││
│  └────────────┬───────────────────────┬───────────────────────┬┘│
│               │                       │                       │ │
│  ┌────────────┴──────────┐  ┌────────┴────────┐  ┌──────────┴─┐│
│  │  WebSocket Service    │  │  Cache Service  │  │   Cron     ││
│  │  • Real-time updates  │  │  • Redis client │  │  Scheduler ││
│  │  • Room management    │  │  • TTL handling │  │            ││
│  └───────────────────────┘  └─────────────────┘  └────────────┘│
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│                   DEX Integration Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ DexScreener  │  │   Jupiter    │  │ GeckoTerminal│          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  │              │  │              │  │              │          │
│  │ • Rate limit │  │ • Rate limit │  │ • Rate limit │          │
│  │ • Retry logic│  │ • Retry logic│  │ • Retry logic│          │
│  │ • Data map   │  │ • Data map   │  │ • Data map   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴──────────────────┐
│                    External APIs                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ DexScreener  │  │   Jupiter    │  │ GeckoTerminal│          │
│  │     API      │  │   Price API  │  │     API      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                      Data Layer                                   │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │    Redis     │  │   In-Memory  │                              │
│  │    Cache     │  │    Cache     │                              │
│  └──────────────┘  └──────────────┘                              │
└───────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. API Gateway Layer

**Express.js Server** (`src/server.ts`)
- HTTP server with middleware stack
- Route management
- Error handling
- Graceful shutdown

**Middleware**:
- `helmet`: Security headers
- `cors`: Cross-origin resource sharing
- `compression`: Response compression
- Custom logging middleware

### 2. Service Layer

#### Aggregation Service (`src/services/aggregation.service.ts`)

**Responsibilities**:
- Fetch data from multiple DEX services
- Merge duplicate tokens intelligently
- Calculate confidence scores
- Apply filters and sorting
- Handle pagination

**Key Methods**:
```typescript
aggregateTokenData(): Promise<AggregatedTokenData[]>
filterAndSort(tokens, options): Promise<PaginatedResponse>
mergeTokens(tokens): TokenData[]
```

**Token Merging Strategy**:
1. Group by token address
2. Average price values (weighted by source confidence)
3. Sum volumes and transaction counts
4. Take maximum market cap
5. Calculate confidence score based on:
   - Number of sources (40 points max)
   - Liquidity (20 points max)
   - Volume (20 points max)
   - Transaction count (20 points max)

#### WebSocket Service (`src/services/websocket.service.ts`)

**Responsibilities**:
- Manage Socket.io connections
- Handle room subscriptions
- Broadcast real-time updates
- Track token state changes

**Update Detection**:
- Price changes > 1% (configurable)
- Volume spikes > 50% increase
- New tokens detected

**Event Flow**:
```
Client connects → Joins 'tokens' room → Receives initial data
                      ↓
         Periodic checks (5s interval)
                      ↓
         Detect changes → Broadcast to room
```

#### Cache Service (`src/services/cache.service.ts`)

**Responsibilities**:
- Redis connection management
- Get/Set/Delete operations
- TTL management
- Pattern-based deletion
- Fallback when cache disabled

**Cache Keys**:
- `tokens:aggregated`: All aggregated token data
- TTL: 30 seconds (configurable)

### 3. DEX Integration Layer

#### DexScreener Service (`src/services/dex/dexscreener.service.ts`)

**API Used**: `https://api.dexscreener.com/latest/dex`

**Endpoints**:
- `/search?q={query}`: Search tokens
- `/tokens/{address}`: Get token by address

**Rate Limit**: 300 requests/minute

**Data Mapping**:
- Extracts Solana chain pairs only
- Maps volume, liquidity, price changes
- Calculates transaction counts

#### Jupiter Service (`src/services/dex/jupiter.service.ts`)

**API Used**: `https://price.jup.ag/v4`

**Endpoints**:
- `/price?ids={addresses}`: Batch price lookup

**Purpose**: Price enrichment and validation

#### GeckoTerminal Service (`src/services/dex/geckoterminal.service.ts`)

**API Used**: `https://api.geckoterminal.com/api/v2`

**Endpoints**:
- `/networks/solana/trending_pools`: Trending tokens
- `/networks/solana/tokens/{address}`: Token info
- `/networks/solana/pools`: Top pools

**Data Mapping**:
- Pools → Token data transformation
- Price, volume, liquidity extraction

### 4. Utility Layer

#### Rate Limiter (`src/utils/rateLimiter.ts`)

**RateLimiter Class**:
- Sliding window algorithm
- Configurable max requests per window
- Async waiting mechanism

**ExponentialBackoff Class**:
- Retry logic with exponential delay
- Max retries: 5
- Triggers on: 429, ECONNRESET, ETIMEDOUT
- Backoff: 1s * 2^attempt (max 30s)

#### Logger (`src/utils/logger.ts`)

**Winston Logger**:
- Structured logging (JSON)
- Timestamp inclusion
- Colored console output
- Configurable log levels

## Data Flow

### Initial Load Flow

```
1. Client requests /api/tokens
       ↓
2. Check Redis cache
       ↓
3. Cache miss → Aggregate from DEXs
       ↓
4. Parallel fetch:
   - DexScreener.getTrendingTokens()
   - GeckoTerminal.getTopPools()
       ↓
5. Merge tokens by address
       ↓
6. Enrich with Jupiter prices
       ↓
7. Calculate confidence scores
       ↓
8. Cache results (30s TTL)
       ↓
9. Apply filters/sorting
       ↓
10. Return paginated response
```

### Real-time Update Flow

```
1. Cron job (every 30s)
       ↓
2. Fetch fresh data from DEXs
       ↓
3. Compare with previous state
       ↓
4. Detect changes:
   - Price change > 1%
   - Volume spike > 50%
   - New tokens
       ↓
5. Broadcast to WebSocket subscribers
       ↓
6. Clients receive updates
       ↓
7. Update UI without HTTP request
```

## Scalability Considerations

### Horizontal Scaling

**Current Architecture**:
- Stateless HTTP layer ✓
- Shared Redis cache ✓
- WebSocket session stickiness required

**To Support**:
1. Load balancer with sticky sessions
2. Redis for WebSocket state (Socket.io Redis adapter)
3. Multiple server instances

**Configuration**:
```javascript
const io = new SocketServer(server, {
  adapter: redisAdapter({
    host: 'redis-host',
    port: 6379,
  }),
});
```

### Vertical Scaling

**Resource Usage**:
- CPU: Moderate (data transformation)
- Memory: ~100-200MB (in-memory cache)
- Network: High (multiple API calls)

**Optimization Opportunities**:
1. Increase cache TTL (reduce API calls)
2. Batch API requests
3. Implement request coalescing

### Caching Strategy

**Current**:
- L1: In-memory (AggregationService)
- L2: Redis (shared across instances)

**Future**:
- L3: CDN for static responses
- Cache warming on startup
- Stale-while-revalidate pattern

## Performance Optimizations

### 1. Parallel API Calls

```typescript
const [dexScreener, geckoTerminal] = await Promise.all([
  this.dexScreener.getTrendingTokens(),
  this.geckoTerminal.getTopPools(30),
]);
```

### 2. Rate Limiting

- Prevents API bans
- Exponential backoff for retries
- Configurable limits per service

### 3. Caching

- 30s TTL reduces API calls by ~95%
- Serves stale data during high load
- Automatic cache invalidation

### 4. Data Merging

- Eliminates duplicate network calls
- Enriches data quality from multiple sources
- Confidence scoring for reliability

### 5. WebSocket Efficiency

- Initial load via HTTP
- Updates via WebSocket (no polling)
- Room-based subscriptions
- Selective broadcasting (only significant changes)

## Error Handling

### Levels

1. **Service Level**: Try-catch with logging
2. **API Level**: Retry with backoff
3. **Application Level**: Global error handler
4. **Process Level**: Uncaught exception handler

### Strategies

- **API Failures**: Return empty array, log warning
- **Cache Failures**: Fallback to direct API
- **Network Errors**: Retry with exponential backoff
- **Data Validation**: Skip invalid entries, log error

### Graceful Degradation

1. Redis down → Disable cache, continue
2. One DEX down → Use other sources
3. Rate limit hit → Wait and retry
4. Invalid data → Skip entry, log warning

## Security

### Implemented

- Helmet.js security headers
- CORS configuration
- Request timeout
- Input validation (query params)
- No authentication required (public API)

### Recommendations for Production

1. API key authentication
2. Rate limiting per client
3. Request signing
4. IP whitelisting (if needed)
5. DDoS protection (Cloudflare)

## Monitoring & Observability

### Health Checks

- `/api/health`: Full health check
- `/api/health/live`: Liveness probe
- `/api/health/ready`: Readiness probe

### Metrics to Monitor

1. **Performance**:
   - API response time
   - Cache hit rate
   - WebSocket connections

2. **Reliability**:
   - Error rate
   - API failure rate
   - Cache availability

3. **Business**:
   - Tokens aggregated
   - Updates broadcasted
   - Active connections

### Logging

- Structured JSON logs
- Request/response logging
- Error stack traces
- Correlation IDs (future)

## Future Enhancements

1. **Historical Data**: Persist to PostgreSQL/TimescaleDB
2. **GraphQL**: Add GraphQL layer for flexible queries
3. **Analytics**: Token analysis and predictions
4. **More DEXs**: Serum, Phoenix, Meteora
5. **Advanced Caching**: Multi-tier with CDN
6. **Rate Limiting**: Per-user rate limits
7. **Authentication**: JWT-based auth
8. **Webhooks**: Notify external systems
9. **Admin Panel**: Configuration and monitoring UI

## Technology Decisions

### Why TypeScript?

- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why Express?

- Lightweight and fast
- Large ecosystem
- Easy to test
- Battle-tested in production

### Why Socket.io?

- Automatic fallbacks (WebSocket → polling)
- Room-based broadcasting
- Reconnection handling
- Wide browser support

### Why Redis?

- Fast in-memory storage
- TTL support built-in
- Pub/sub for WebSocket scaling
- Simple key-value model fits use case

### Why axios?

- Interceptor support
- Automatic JSON parsing
- Better error handling
- Request/response transformation

## Testing Strategy

### Unit Tests

- Service methods
- Utility functions
- Data transformation

### Integration Tests

- API endpoints
- WebSocket events
- Cache operations

### E2E Tests (Future)

- Full user flows
- Multiple concurrent clients
- Failure scenarios

## Deployment Considerations

### Environment Variables

All configuration via environment variables (12-factor app)

### Container Support

- Dockerfile for containerization
- Docker Compose for local development
- Health checks for orchestration

### Cloud Platforms

- Render.com: Free tier ready
- Railway: With Redis support
- Heroku: Traditional deployment
- AWS/GCP: Full control

---

For implementation details, see individual service files in `src/services/`.

