# Quick Start Guide

Get the Eterna Backend running in 5 minutes!

## Option 1: Without Redis (Simplest)

```bash
# Install dependencies
npm install

# Create .env file (cache disabled)
cat > .env << EOF
PORT=3000
NODE_ENV=development
CACHE_ENABLED=false
API_RATE_LIMIT=300
WS_UPDATE_INTERVAL=5000
LOG_LEVEL=info
EOF

# Run in development mode
npm run dev
```

The server will start on http://localhost:3000

## Option 2: With Redis (Full Features)

```bash
# Start Redis with Docker
docker run -d -p 6379:6379 redis:7-alpine

# Install dependencies
npm install

# Create .env file (cache enabled)
cat > .env << EOF
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=true
CACHE_TTL=30
API_RATE_LIMIT=300
WS_UPDATE_INTERVAL=5000
LOG_LEVEL=info
EOF

# Run in development mode
npm run dev
```

## Option 3: Docker Compose (Easiest)

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Test the API

### Using curl

```bash
# Health check
curl http://localhost:3000/api/health

# Get tokens
curl http://localhost:3000/api/tokens

# Get tokens sorted by volume
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Refresh data
curl -X POST http://localhost:3000/api/tokens/refresh
```

### Using the Web Client

1. Open `examples/websocket-client.html` in your browser
2. Click "Connect"
3. Click "Subscribe to Updates"
4. Watch real-time updates!

### Using Postman

1. Import `postman_collection.json`
2. Set `baseUrl` variable to `http://localhost:3000`
3. Run any request or the entire collection

## Running Tests

```bash
npm test
```

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Port already in use
Change `PORT` in `.env` to a different port (e.g., 3001)

### Redis connection error
Either:
- Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
- Or disable cache: Set `CACHE_ENABLED=false` in `.env`

### API rate limits
The free DEX APIs have rate limits. If you see 429 errors, wait a minute and try again.

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment options
- Review [CHECKLIST.md](CHECKLIST.md) for feature completion

## Sample API Calls

```bash
# Get top 5 tokens by volume
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq

# Get tokens with 24h price changes
curl "http://localhost:3000/api/tokens?timePeriod=24h&sortBy=price_change&sortOrder=desc" | jq

# Get tokens with min volume
curl "http://localhost:3000/api/tokens?minVolume=100&sortBy=volume&sortOrder=desc" | jq

# Pagination
curl "http://localhost:3000/api/tokens?limit=5&cursor=0" | jq
curl "http://localhost:3000/api/tokens?limit=5&cursor=5" | jq
```

## WebSocket Example (JavaScript)

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('subscribe:tokens');
});

socket.on('initial:tokens', (data) => {
  console.log('Initial tokens:', data.tokens.length);
});

socket.on('token:update', (update) => {
  console.log('Update:', update.type, update.token.token_name);
});
```

## Architecture Overview

```
Client (Browser/Mobile)
        ↓
   Express API
        ↓
  Service Layer
   ↓    ↓    ↓
 DEX  Cache  WS
 APIs Redis  io
```

## Key Features

✅ Multi-source data aggregation (DexScreener, Jupiter, GeckoTerminal)
✅ Real-time WebSocket updates
✅ Smart caching with Redis
✅ Rate limiting & exponential backoff
✅ Filtering, sorting, pagination
✅ Health checks
✅ 34 tests passing
✅ Production ready

---

**Have fun exploring the API!** 🚀

