# Deployment Guide

This guide covers multiple deployment options for the Eterna Backend service.

## Table of Contents

1. [Render.com (Recommended for Free Tier)](#rendercom)
2. [Railway.app](#railwayapp)
3. [Heroku](#heroku)
4. [Docker](#docker)
5. [VPS/Cloud Server](#vpscloud-server)

---

## Render.com

**Best for**: Free tier deployment without Redis

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Use these settings:
     - Name: `eterna-backend`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   CACHE_ENABLED=false
   API_RATE_LIMIT=300
   WS_UPDATE_INTERVAL=5000
   LOG_LEVEL=info
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Access your API at the provided URL

### With Redis (Paid Plan)

If you upgrade to a paid plan:

1. Create Redis instance in Render
2. Set environment variables:
   ```
   CACHE_ENABLED=true
   REDIS_HOST=<your-redis-host>
   REDIS_PORT=<your-redis-port>
   REDIS_PASSWORD=<your-redis-password>
   ```

---

## Railway.app

**Best for**: Easy deployment with Redis support

### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add Redis**
   ```bash
   railway add redis
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set CACHE_ENABLED=true
   railway variables set PORT=3000
   ```

6. **Deploy**
   ```bash
   railway up
   ```

7. **Get URL**
   ```bash
   railway domain
   ```

---

## Heroku

### Steps

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create eterna-backend
   ```

4. **Add Redis**
   ```bash
   heroku addons:create heroku-redis:mini
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CACHE_ENABLED=true
   heroku config:set API_RATE_LIMIT=300
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Open App**
   ```bash
   heroku open
   ```

---

## Docker

### Local Docker

```bash
# Build image
docker build -t eterna-backend .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e CACHE_ENABLED=false \
  --name eterna-backend \
  eterna-backend
```

### Docker Compose

```bash
# Start all services (app + Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Hub

```bash
# Build and tag
docker build -t yourusername/eterna-backend:latest .

# Push to Docker Hub
docker login
docker push yourusername/eterna-backend:latest

# Pull and run on any server
docker pull yourusername/eterna-backend:latest
docker run -d -p 3000:3000 yourusername/eterna-backend:latest
```

---

## VPS/Cloud Server

**Platforms**: DigitalOcean, AWS EC2, Linode, etc.

### Prerequisites

- Ubuntu 20.04+ or similar
- Root or sudo access

### Installation Steps

1. **Connect to Server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Redis (Optional)**
   ```bash
   sudo apt-get install redis-server -y
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

4. **Clone Repository**
   ```bash
   cd /opt
   sudo git clone <your-repo-url> eterna-backend
   cd eterna-backend
   ```

5. **Install Dependencies**
   ```bash
   sudo npm ci --production
   ```

6. **Build Application**
   ```bash
   sudo npm run build
   ```

7. **Create .env File**
   ```bash
   sudo nano .env
   # Add your configuration
   ```

8. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

9. **Start Application**
   ```bash
   pm2 start dist/server.js --name eterna-backend
   pm2 save
   pm2 startup
   ```

10. **Setup Nginx (Optional)**
    ```bash
    sudo apt-get install nginx -y
    sudo nano /etc/nginx/sites-available/eterna-backend
    ```
    
    Add configuration:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    Enable and restart:
    ```bash
    sudo ln -s /etc/nginx/sites-available/eterna-backend /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Setup SSL with Let's Encrypt (Optional)**
    ```bash
    sudo apt-get install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d your-domain.com
    ```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment mode | production |
| PORT | Server port | 3000 |

### Optional (with defaults)

| Variable | Description | Default |
|----------|-------------|---------|
| CACHE_ENABLED | Enable Redis cache | true |
| CACHE_TTL | Cache TTL (seconds) | 30 |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| API_RATE_LIMIT | Max API requests/min | 300 |
| WS_UPDATE_INTERVAL | WebSocket update interval (ms) | 5000 |
| LOG_LEVEL | Logging level | info |

---

## Post-Deployment Checklist

- [ ] API health check works (`/api/health`)
- [ ] Tokens endpoint returns data (`/api/tokens`)
- [ ] WebSocket connection works
- [ ] Environment variables set correctly
- [ ] Cache working (if enabled)
- [ ] Logs accessible
- [ ] HTTPS configured (production)
- [ ] Domain name configured
- [ ] Monitoring setup (optional)

---

## Monitoring

### Logs

**Render/Railway/Heroku**: Use platform dashboard

**Docker**: 
```bash
docker-compose logs -f
```

**PM2**: 
```bash
pm2 logs eterna-backend
```

### Health Checks

Monitor these endpoints:
- `/api/health` - Full health check
- `/api/health/live` - Liveness probe
- `/api/health/ready` - Readiness probe

---

## Troubleshooting

### Application won't start

1. Check logs for errors
2. Verify environment variables
3. Ensure Node.js version is 18+
4. Check port availability

### Redis connection issues

1. Verify Redis is running
2. Check REDIS_HOST and REDIS_PORT
3. Test Redis connection: `redis-cli ping`
4. Set `CACHE_ENABLED=false` as fallback

### WebSocket not connecting

1. Ensure server supports WebSocket
2. Check firewall rules
3. Verify proxy configuration (if using Nginx)

### High memory usage

1. Check for memory leaks in logs
2. Reduce `CACHE_TTL`
3. Increase server resources

---

## Scaling

### Horizontal Scaling

1. Deploy multiple instances
2. Use load balancer (Nginx, AWS ALB)
3. Share Redis instance across instances
4. Consider using Redis Cluster

### Vertical Scaling

1. Increase server resources (CPU/RAM)
2. Optimize cache settings
3. Adjust rate limits

---

## Backup & Recovery

### Database Backup (Redis)

```bash
# Backup
redis-cli SAVE
cp /var/lib/redis/dump.rdb /backup/redis-backup-$(date +%Y%m%d).rdb

# Restore
sudo systemctl stop redis
cp /backup/redis-backup-*.rdb /var/lib/redis/dump.rdb
sudo systemctl start redis
```

### Application Backup

- Code: Use Git
- Environment: Document environment variables
- Configuration: Backup .env files (securely)

---

For issues or questions, refer to the main README or open a GitHub issue.
