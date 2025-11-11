# 📝 Complete Submission Guide for Beginners

This guide will walk you through **every single step** needed to complete your submission. Follow it exactly, and you'll be done in about 1 hour.

---

## 📋 What You're Submitting

You need to submit **3 things**:

1. ✅ **GitHub Repository** - Your code
2. ✅ **Deployed URL** - Live API on the internet
3. ✅ **YouTube Video** - 1-2 minute demo

---

## 🎯 STEP 1: Push Code to GitHub (15 minutes)

### What is GitHub?
GitHub is like Google Drive for code. It stores your code online so others can see it.

### Instructions:

#### 1.1 Create a GitHub Account (if you don't have one)
- Go to https://github.com
- Click "Sign up"
- Create account (it's free)

#### 1.2 Create a New Repository
- Click the **"+"** icon (top right)
- Click **"New repository"**
- Fill in:
  - **Repository name**: `Eterna-Backend` (or any name you like)
  - **Description**: "Real-time meme coin data aggregation service"
  - **Public** or **Private**: Choose **Public** (so reviewers can see it)
  - **DON'T** check "Add README" (we already have one)
- Click **"Create repository"**

#### 1.3 Copy Your Repository URL
You'll see a page with commands. Copy the URL that looks like:
```
https://github.com/YOUR-USERNAME/Eterna-Backend.git
```

#### 1.4 Initialize Git and Push Code

Open your terminal in the project folder:

```bash
# Go to your project folder
cd /home/spamprx/Projects/Eterna-Backend

# Initialize git (tells git to start tracking this folder)
git init

# Add all files to git
git add .

# Create your first commit (like saving a version)
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

# Connect to GitHub (replace with YOUR URL from step 1.3)
git remote add origin https://github.com/YOUR-USERNAME/Eterna-Backend.git

# Push to GitHub (uploads your code)
git push -u origin main
```

**If it asks for username/password:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Go to: GitHub Settings → Developer Settings → Personal Access Tokens → Generate new token (classic)
  - Give it "repo" permissions
  - Copy the token and use it as password

#### 1.5 Verify Upload
- Go to your GitHub repository URL in browser
- You should see all your files!

✅ **Checkpoint**: Your code is now on GitHub!

---

## 🚀 STEP 2: Deploy to Render.com (20 minutes)

### What is Render.com?
Render is like a computer in the cloud that runs your code 24/7, so anyone can access your API from the internet.

### Instructions:

#### 2.1 Create Render Account
- Go to https://render.com
- Click **"Get Started"**
- Sign up with **GitHub** (easiest option)
- This connects your GitHub to Render

#### 2.2 Create New Web Service
- Click **"New +"** (top right)
- Select **"Web Service"**
- You'll see a list of your GitHub repositories
- Find and click **"Connect"** next to `Eterna-Backend`

#### 2.3 Configure Web Service

Fill in the form:

**Name**: `eterna-backend` (or any name, will be part of your URL)

**Region**: Choose closest to you (e.g., Oregon, Frankfurt)

**Branch**: `main`

**Root Directory**: Leave empty

**Runtime**: `Node`

**Build Command**: 
```
npm install && npm run build
```

**Start Command**:
```
npm start
```

**Instance Type**: **Free** (select this!)

#### 2.4 Add Environment Variables

Scroll down to "Environment Variables" section. Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `CACHE_ENABLED` | `false` |
| `API_RATE_LIMIT` | `300` |
| `WS_UPDATE_INTERVAL` | `5000` |
| `LOG_LEVEL` | `info` |

**Important**: Set `CACHE_ENABLED` to `false` because free tier doesn't include Redis.

#### 2.5 Deploy!
- Click **"Create Web Service"** at the bottom
- Wait 5-10 minutes for deployment
- You'll see logs on the screen (code building and starting)
- Look for: **"Deploy live ✓"** - You're live!

#### 2.6 Get Your URL
- At the top, you'll see your URL like: `https://eterna-backend-xyz.onrender.com`
- **COPY THIS URL** - you'll need it!

#### 2.7 Test Your Deployed API

Open terminal and test:

```bash
# Replace with YOUR URL
export API_URL="https://eterna-backend-xyz.onrender.com"

# Test health endpoint
curl "$API_URL/api/health"

# Test tokens endpoint
curl "$API_URL/api/tokens?limit=5"
```

You should see JSON responses!

#### 2.8 Update README with Your URL

Edit `README.md` file and find these lines:

```markdown
**Deployed URL:** `https://your-app.onrender.com` (Update after deployment)
```

Change to:
```markdown
**Deployed URL:** https://eterna-backend-xyz.onrender.com
```

Also update:
```markdown
- **Live API**: [Your Deployed URL]
```

Change to:
```markdown
- **Live API**: https://eterna-backend-xyz.onrender.com
```

Save and push to GitHub:
```bash
git add README.md
git commit -m "docs: Add deployed URL"
git push
```

✅ **Checkpoint**: Your API is live on the internet!

---

## 🎥 STEP 3: Record Demo Video (30 minutes)

### What to Record
A 1-2 minute video showing your API working. Think of it like showing your project to a friend.

### Tools You'll Need
- **Screen recorder**: 
  - Mac: QuickTime (built-in) or OBS Studio
  - Windows: Xbox Game Bar (Win+G) or OBS Studio
  - Linux: SimpleScreenRecorder or OBS Studio
- **Browser**: Any browser (Chrome, Firefox)
- **Terminal**: To run commands

### Video Structure (1-2 minutes total)

#### Part 1: API Demo (30-40 seconds)

**Script to follow:**

```
"Hi, this is my real-time meme coin data aggregation service. 
Let me show you it working."

[Open terminal and run:]
```

```bash
# Set your deployed URL
export API_URL="https://your-eterna-backend.onrender.com"

# 1. Health check
echo "=== Health Check ==="
curl "$API_URL/api/health" | jq

# 2. Get tokens
echo "=== Get 5 Tokens ==="
curl "$API_URL/api/tokens?limit=5" | jq

# 3. Sort by volume
echo "=== Top Tokens by Volume ==="
curl "$API_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq

# 4. Filter by volume
echo "=== High Volume Tokens ==="
curl "$API_URL/api/tokens?minVolume=100" | jq

# 5-10. Rapid calls to show response times
echo "=== Testing Response Times ==="
for i in {1..10}; do 
  echo "Request $i:"
  time curl -s "$API_URL/api/tokens?limit=5" > /dev/null
done
```

**While running, say:**
"As you can see, the API returns real token data with prices, volumes, and market caps. The response times are fast, even with multiple rapid requests."

#### Part 2: WebSocket Demo (30-40 seconds)

**Script to follow:**

1. **Open the WebSocket client:**
   - Navigate to your project folder
   - Right-click `examples/websocket-client.html`
   - Open with your browser (Chrome/Firefox)

2. **Before opening, edit the file to use YOUR deployed URL:**
   - Find line: `const serverUrl = 'http://localhost:3000';`
   - Change to: `const serverUrl = 'https://your-eterna-backend.onrender.com';`
   - Save

3. **In the video:**
   - Open the HTML file in browser
   - Click **"Connect"** button
   - Click **"Subscribe to Updates"** button
   - Show the tokens appearing
   - Open the SAME page in 2-3 more browser tabs
   - Show that all tabs receive the same real-time updates

**While recording, say:**
"Here's the WebSocket demo. When I connect and subscribe, I receive real-time token data. Notice how multiple browser tabs all receive updates simultaneously - this is the real-time WebSocket working."

#### Part 3: Architecture Explanation (30-40 seconds)

**Open a diagram or your ARCHITECTURE.md file and say:**

"Let me explain the architecture:

1. **Client** - Browsers or apps connect via HTTP or WebSocket
2. **API Gateway** - Express.js handles requests with security middleware
3. **Service Layer** - This is where the magic happens:
   - Aggregation Service merges data from 3 DEX APIs
   - WebSocket Service pushes real-time updates
   - Cache Service stores data for 30 seconds to reduce API calls
4. **DEX APIs** - We fetch from DexScreener, Jupiter, and GeckoTerminal

Key features:
- **Rate Limiting**: Prevents hitting API limits
- **Exponential Backoff**: Retries failed requests intelligently
- **Caching**: 95% cache hit rate means fast responses
- **Real-time**: WebSocket updates every 5 seconds, no polling needed"

### Recording Tips

1. **Before Recording:**
   - Close unnecessary applications
   - Clear browser tabs
   - Prepare all commands in a text file to copy-paste
   - Test everything once before recording

2. **During Recording:**
   - Speak clearly and not too fast
   - If you make a mistake, pause, and start that section again (you can edit)
   - Show your terminal and browser clearly
   - Zoom in if text is small

3. **After Recording:**
   - Watch it once to make sure everything is visible
   - If you use OBS, it saves automatically
   - If using QuickTime, save the file

### Editing (Optional)
- If you made mistakes, use a free video editor:
  - **iMovie** (Mac)
  - **DaVinci Resolve** (Free, all platforms)
  - **OpenShot** (Free, simple)
- Just cut out the mistakes and join the good parts

### Upload to YouTube

1. **Go to YouTube**
   - Sign in to your Google account
   - Click your profile icon → **YouTube Studio**
   - Click **"Create"** → **"Upload video"**

2. **Upload Video**
   - Drag your video file
   - **Title**: "Eterna Backend - Real-time Meme Coin Data Aggregation Service"
   - **Description**: 
   ```
   Real-time data aggregation service for meme coins on Solana.
   
   Features:
   - Multi-source aggregation (DexScreener, Jupiter, GeckoTerminal)
   - WebSocket real-time updates
   - Redis caching
   - Rate limiting
   - 34 tests passing
   
   GitHub: [Your GitHub URL]
   Live API: [Your Render URL]
   ```
   - **Visibility**: Choose **"Unlisted"** (only people with link can see)
   - Click **"Next"** → **"Next"** → **"Publish"**

3. **Get Your Video Link**
   - After publishing, click **"Video link"**
   - Copy the URL (looks like: `https://youtu.be/xxxxx`)

4. **Add to README**
   - Edit your `README.md`
   - Find: `**Watch the live demo:** [YouTube Link - Coming Soon]`
   - Change to: `**Watch the live demo:** https://youtu.be/xxxxx`
   - Save and push:
   ```bash
   git add README.md
   git commit -m "docs: Add demo video link"
   git push
   ```

✅ **Checkpoint**: Your video is on YouTube!

---

## 📤 STEP 4: Final Submission (5 minutes)

### What to Submit

You should now have:

1. ✅ **GitHub URL**: `https://github.com/YOUR-USERNAME/Eterna-Backend`
2. ✅ **Deployed API URL**: `https://eterna-backend-xyz.onrender.com`
3. ✅ **YouTube Video**: `https://youtu.be/xxxxx`

### Final Checklist

Before submitting, verify:

- [ ] GitHub repository is public
- [ ] README has deployed URL and video link
- [ ] Deployed API responds to: `curl YOUR-URL/api/health`
- [ ] Deployed API returns tokens: `curl YOUR-URL/api/tokens`
- [ ] YouTube video is uploaded (unlisted or public)
- [ ] Video shows API working, WebSocket demo, and architecture
- [ ] Postman collection is in the repo (`postman_collection.json`)
- [ ] Tests pass: Run `npm test` and confirm 34 tests pass

### Submit Your Work

Submit these 3 links to wherever requested:

```
GitHub Repository: https://github.com/YOUR-USERNAME/Eterna-Backend
Deployed API: https://eterna-backend-xyz.onrender.com
Demo Video: https://youtu.be/xxxxx
```

---

## 🆘 Troubleshooting

### Problem: Git push failed with authentication error
**Solution**: 
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Generate new token (classic) with "repo" scope
3. Use token as password when pushing

### Problem: Render deployment failed
**Solution**:
1. Check the logs in Render dashboard
2. Make sure all environment variables are set
3. Verify `npm run build` works locally
4. Make sure `CACHE_ENABLED=false` (no Redis on free tier)

### Problem: API returns errors
**Solution**:
1. Check Render logs (click "Logs" tab)
2. Common issue: DEX APIs might be rate limiting
3. Wait 1 minute and try again
4. Health endpoint should always work: `/api/health`

### Problem: WebSocket not connecting
**Solution**:
1. Make sure you updated `serverUrl` in `websocket-client.html`
2. Use `https://` not `http://` for deployed URL
3. Check browser console for errors (F12)

### Problem: Video is too large to upload
**Solution**:
1. Compress video using HandBrake (free software)
2. Or record in lower quality (720p is fine)
3. YouTube accepts up to 128GB, so shouldn't be an issue

### Problem: Can't install OBS for recording
**Solution**:
- Mac: Use QuickTime (Cmd+Shift+5)
- Windows: Use Xbox Game Bar (Win+G)
- Linux: Use SimpleScreenRecorder
- Or use online tool: Loom.com (free for 5 min videos)

---

## 💡 Pro Tips

1. **Test Everything Locally First**
   ```bash
   npm run dev
   # Then test all endpoints before deploying
   ```

2. **Keep Your Video Simple**
   - Don't try to show everything
   - Focus on: API working + WebSocket + Quick architecture explanation
   - 1-2 minutes is perfect

3. **If Render Free Tier is Slow**
   - First request after 15 min of inactivity takes 30-60 seconds (cold start)
   - Mention this in video if it happens
   - After that, it's fast

4. **Save Your URLs**
   - Write them down somewhere safe
   - You'll need them for submission

---

## ✅ Summary Checklist

- [ ] GitHub account created
- [ ] Repository created and code pushed
- [ ] Render account created
- [ ] Service deployed and live
- [ ] API tested and working
- [ ] README updated with deployed URL
- [ ] Video recorded showing all features
- [ ] Video uploaded to YouTube
- [ ] README updated with video link
- [ ] All 3 URLs ready to submit

---

## 🎉 You're Done!

Congratulations! You've built, deployed, and documented a production-ready backend service. This is a real accomplishment!

### What You've Learned
- Backend development with TypeScript
- REST API design
- WebSocket real-time updates
- Caching strategies
- Deployment to cloud
- Git and GitHub
- Video documentation

**Good luck with your submission!** 🚀

---

**Need Help?**
- Re-read the relevant section carefully
- Check the troubleshooting section
- Google the specific error message
- All the code is already working - just follow deployment steps!

