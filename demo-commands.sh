#!/bin/bash

# Eterna Backend - Video Demo Script
# This shows each command as it runs

API_URL="https://eterna-backend-vqx9.onrender.com"

echo "════════════════════════════════════════════════════════"
echo "🚀 ETERNA BACKEND - REAL-TIME MEME COIN AGGREGATION"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Deployed at: $API_URL"
echo ""
sleep 2

# Command 1: Health Check
echo "════════════════════════════════════════════════════════"
echo "✅ Command 1: Health Check"
echo "════════════════════════════════════════════════════════"
echo "$ curl $API_URL/api/health | jq"
echo ""
curl -s "$API_URL/api/health" | jq '{status: .data.status, uptime: .data.uptime, cache: .data.cache, memory: .data.memory}'
echo ""
sleep 3

# Command 2: Get Tokens
echo "════════════════════════════════════════════════════════"
echo "✅ Command 2: Get Top 5 Tokens"
echo "════════════════════════════════════════════════════════"
echo "$ curl $API_URL/api/tokens?limit=5 | jq"
echo ""
curl -s "$API_URL/api/tokens?limit=5" | jq '.data.data[0:3] | .[] | {name: .token_name, ticker: .token_ticker, price_sol: .price_sol, volume: .volume_sol, sources: .sources}'
echo ""
echo "Total tokens: $(curl -s "$API_URL/api/tokens?limit=5" | jq '.data.total')"
echo ""
sleep 3

# Command 3: Sort by Volume
echo "════════════════════════════════════════════════════════"
echo "✅ Command 3: Sort by Volume (Descending)"
echo "════════════════════════════════════════════════════════"
echo "$ curl $API_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=5 | jq"
echo ""
curl -s "$API_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=5" | jq '.data.data[0:3] | .[] | {name: .token_name, volume_sol: .volume_sol, liquidity_sol: .liquidity_sol}'
echo ""
sleep 3

# Command 4: Filter by Volume
echo "════════════════════════════════════════════════════════"
echo "✅ Command 4: Filter High Volume Tokens (>100 SOL)"
echo "════════════════════════════════════════════════════════"
echo "$ curl $API_URL/api/tokens?minVolume=100 | jq"
echo ""
curl -s "$API_URL/api/tokens?minVolume=100" | jq '{total_matching: .data.total, showing: (.data.data | length), has_more: .data.has_more}'
echo ""
sleep 3

# Command 5: Time Period Filter
echo "════════════════════════════════════════════════════════"
echo "✅ Command 5: Filter by 24h Price Changes"
echo "════════════════════════════════════════════════════════"
echo "$ curl $API_URL/api/tokens?timePeriod=24h&sortBy=price_change&limit=3 | jq"
echo ""
curl -s "$API_URL/api/tokens?timePeriod=24h&sortBy=price_change&limit=3" | jq '.data.data[] | {name: .token_name, price_change_24h: .price_24hr_change}'
echo ""
sleep 3

# Command 6: Pagination
echo "════════════════════════════════════════════════════════"
echo "✅ Command 6: Pagination Example"
echo "════════════════════════════════════════════════════════"
echo "$ curl $API_URL/api/tokens?limit=5&cursor=0 | jq"
echo ""
curl -s "$API_URL/api/tokens?limit=5&cursor=0" | jq '{returned: (.data.data | length), next_cursor: .data.next_cursor, has_more: .data.has_more}'
echo ""
sleep 3

# Performance Test
echo "════════════════════════════════════════════════════════"
echo "⚡ Performance Test: 10 Rapid API Calls"
echo "════════════════════════════════════════════════════════"
echo "$ for i in {1..10}; do curl $API_URL/api/tokens?limit=5; done"
echo ""
for i in {1..10}; do 
  echo -n "Request $i: "
  START=$(date +%s.%N)
  curl -s "$API_URL/api/tokens?limit=5" > /dev/null
  END=$(date +%s.%N)
  DIFF=$(echo "$END - $START" | bc)
  echo "${DIFF}s"
done
echo ""
sleep 2

echo "════════════════════════════════════════════════════════"
echo "✅ API Demo Complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "  - Multi-source data aggregation (GeckoTerminal, DexScreener, Jupiter)"
echo "  - Rate limiting with exponential backoff"
echo "  - Intelligent token merging by address"
echo "  - 30s caching for performance"
echo "  - Filtering, sorting, and pagination"
echo "  - WebSocket real-time updates"
echo ""
echo "Next: Open examples/websocket-client.html to see real-time updates!"
echo "════════════════════════════════════════════════════════"
