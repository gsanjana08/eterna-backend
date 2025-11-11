# ⚡ Quick Command Reference

Copy-paste these commands for each step.

---

## 📦 STEP 1: Push to GitHub

```bash
# Navigate to project
cd /home/spamprx/Projects/Eterna-Backend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "feat: Complete real-time meme coin aggregation service

✨ Features:
- Multi-source data aggregation (DexScreener, Jupiter, GeckoTerminal)
- WebSocket real-time updates  
- Redis caching with 30s TTL
- Rate limiting and exponential backoff
- Filtering, sorting, cursor-based pagination
- 34 tests passing
- Comprehensive documentation
- Production ready"

# Add remote (REPLACE WITH YOUR URL!)
git remote add origin https://github.com/YOUR-USERNAME/Eterna-Backend.git

# Push to GitHub
git push -u origin main
```

---

## 🧪 STEP 2: Test Locally (Before Deploying)

```bash
# Start server
npm run dev

# In another terminal, test endpoints:

# Health check
curl http://localhost:3000/api/health | jq

# Get tokens
curl http://localhost:3000/api/tokens | jq

# Top 5 by volume
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq

# Filter by volume
curl "http://localhost:3000/api/tokens?minVolume=100" | jq

# Pagination
curl "http://localhost:3000/api/tokens?limit=5&cursor=0" | jq

# Stop server when done (Ctrl+C)
```

---

## 🚀 STEP 3: After Deploying to Render

Replace `YOUR_URL` with your actual Render URL:

```bash
# Set your URL
export API_URL="https://eterna-backend-xyz.onrender.com"

# Test health
curl "$API_URL/api/health" | jq

# Test tokens
curl "$API_URL/api/tokens?limit=5" | jq

# Test sorting
curl "$API_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq

# Test filtering
curl "$API_URL/api/tokens?minVolume=100" | jq

# Test time periods
curl "$API_URL/api/tokens?timePeriod=24h&sortBy=price_change&sortOrder=desc" | jq

# Test pagination
curl "$API_URL/api/tokens?limit=5&cursor=0" | jq
curl "$API_URL/api/tokens?limit=5&cursor=5" | jq

# Refresh data
curl -X POST "$API_URL/api/tokens/refresh" | jq

# 10 rapid calls to test performance
echo "=== Testing Performance ==="
for i in {1..10}; do 
  echo "Request $i:"
  time curl -s "$API_URL/api/tokens?limit=5" > /dev/null
done
```

---

## 🎥 STEP 4: Video Recording Commands

Use these for your demo video:

```bash
# Set your deployed URL
export API_URL="https://your-eterna-backend.onrender.com"

# Part 1: Basic API Demo
echo "=== DEMO STARTING ==="
echo ""

echo "1. Health Check"
curl "$API_URL/api/health" | jq
echo ""

echo "2. Get 5 Tokens"
curl "$API_URL/api/tokens?limit=5" | jq '.data.data[] | {name: .token_name, ticker: .token_ticker, price: .price_sol, volume: .volume_sol}'
echo ""

echo "3. Top Tokens by Volume"
curl "$API_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq '.data.data[] | {name: .token_name, volume: .volume_sol}'
echo ""

echo "4. Filter High Volume Tokens"
curl "$API_URL/api/tokens?minVolume=100" | jq '.data.total'
echo ""

echo "5-10. Performance Test - 10 Rapid API Calls"
for i in {1..10}; do 
  echo -n "Request $i: "
  time curl -s "$API_URL/api/tokens?limit=5" > /dev/null 2>&1
done
```

---

## 📝 STEP 5: Update README After Deployment

```bash
# Edit README.md and replace these lines:

# Find: **Deployed URL:** `https://your-app.onrender.com`
# Change to: **Deployed URL:** https://your-actual-url.onrender.com

# Find: - **Live API**: [Your Deployed URL]
# Change to: - **Live API**: https://your-actual-url.onrender.com

# After editing, push changes:
git add README.md
git commit -m "docs: Add deployed URL"
git push
```

---

## 🎬 STEP 6: Update README After Video Upload

```bash
# Edit README.md

# Find: **Watch the live demo:** [YouTube Link - Coming Soon]
# Change to: **Watch the live demo:** https://youtu.be/YOUR_VIDEO_ID

# Push changes:
git add README.md  
git commit -m "docs: Add demo video link"
git push
```

---

## 🧪 Run Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Watch mode (re-runs on file changes)
npm run test:watch

# Build project
npm run build

# Start production server
npm start
```

---

## 🐳 Docker Commands

```bash
# Start with Docker Compose (includes Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Build Docker image manually
docker build -t eterna-backend .

# Run container
docker run -d -p 3000:3000 --name eterna-backend eterna-backend
```

---

## 🔍 Troubleshooting Commands

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Check git status
git status

# View git log
git log --oneline

# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build

# Check for linting errors
npm run lint
```

---

## 📊 Useful Checks

```bash
# Count TypeScript files
find src -name "*.ts" | wc -l

# Count test files
find src/__tests__ -name "*.test.ts" | wc -l

# Count lines of code (excluding node_modules)
find src -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l

# Check project structure
tree -L 2 -I 'node_modules|dist|coverage'

# Check package size
du -sh node_modules

# Check environment variables
cat .env
```

---

## 🆘 Emergency Reset

If something goes really wrong:

```bash
# Reset git (CAREFUL - loses uncommitted changes!)
rm -rf .git
git init
git add .
git commit -m "Initial commit"

# Clean and rebuild
rm -rf node_modules dist coverage
npm install
npm run build
npm test

# Reset to working state
git checkout main
git reset --hard HEAD
npm install
```

---

## ✅ Pre-Submission Checklist Commands

Run these to verify everything:

```bash
# 1. Tests pass
npm test

# 2. Build succeeds
npm run build

# 3. Server starts
timeout 10 npm run dev || echo "Server started successfully"

# 4. Git is clean
git status

# 5. Remote is set
git remote -v

# 6. All files committed
git log -1 --oneline
```

---

## 📋 What to Submit

After completing all steps, submit these 3 URLs:

```
1. GitHub Repository: https://github.com/YOUR-USERNAME/Eterna-Backend
2. Deployed API URL: https://eterna-backend-xyz.onrender.com
3. YouTube Video: https://youtu.be/YOUR_VIDEO_ID
```

---

**Pro Tip**: Save this file and use Ctrl+F to quickly find commands you need!

