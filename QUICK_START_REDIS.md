# Quick Start: Redis Metrics Persistence

## 5-Minute Setup

### 1. Start Redis (Choose One)

**Docker (Recommended)**
```bash
docker run -d -p 6379:6379 --name hostwatch-redis redis:7-alpine

# Verify
docker exec hostwatch-redis redis-cli ping
# Expected: PONG
```

**Homebrew (macOS)**
```bash
brew install redis
redis-server
```

**Linux (Ubuntu/Debian)**
```bash
sudo apt-get install redis-server
redis-server
```

**Windows (WSL)**
```bash
wsl apt-get install redis-server
redis-server
```

### 2. Update .env

```env
# Add to your .env file
REDIS_URL=redis://localhost:6379
REDIS_METRICS_RETENTION_DAYS=30
```

### 3. Install & Run

```bash
npm install          # Install redis package
npm run dev          # Start app
```

### 4. Verify Connection

Watch the startup logs for:
```
Metrics Redis persistence enabled
```

### 5. Test It Works

```bash
# In another terminal, connect to Redis
redis-cli

# Monitor activity in real-time
MONITOR

# Check metrics being stored
KEYS metrics:*

# Check count of metrics for a host
ZCARD metrics:history:host-123
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| REDIS_URL | redis://localhost:6379 | Connection URL |
| REDIS_HOST | localhost | Hostname (if no URL) |
| REDIS_PORT | 6379 | Port (if no URL) |
| REDIS_PASSWORD | (empty) | Optional password |
| REDIS_DB | 0 | Database number |
| REDIS_METRICS_RETENTION_DAYS | 30 | How long to keep metrics |
| REDIS_BATCH_WRITE_INTERVAL_MS | 30000 | Write frequency (30 seconds) |

## API Endpoints

### Get Last 100 Metrics
```bash
curl "http://localhost:5000/api/hosts/HOST_ID/metrics/recent?orgId=ORG_ID&count=100"
```

### Get Metrics for Last 24 Hours
```bash
# Calculate timestamps
NOW=$(date +%s000)
24_HOURS_AGO=$((NOW - 86400000))

curl "http://localhost:5000/api/hosts/HOST_ID/metrics/range?orgId=ORG_ID&startTime=$24_HOURS_AGO&endTime=$NOW"
```

### Get Metrics for Last 7 Days
```bash
NOW=$(date +%s000)
7_DAYS_AGO=$((NOW - 604800000))

curl "http://localhost:5000/api/hosts/HOST_ID/metrics/range?orgId=ORG_ID&startTime=$7_DAYS_AGO&endTime=$NOW"
```

## What's Working

✅ **In-memory cache** - Fast access to recent metrics (5 minutes)
✅ **Redis persistence** - Long-term storage (30 days by default)
✅ **Batch writes** - Every 30 seconds, no blocking
✅ **Graceful shutdown** - Flushes metrics before exit
✅ **Fallback mode** - Works without Redis, uses memory only
✅ **Time-range queries** - New endpoints for historical data
✅ **Retention policies** - Configurable expiration

## Files Changed

| File | Changes |
|------|---------|
| `package.json` | Added redis package |
| `.env.example` | Added Redis configuration |
| `server/redis-config.ts` | **NEW** - Configuration validation |
| `server/redis.ts` | **NEW** - Redis client & connection |
| `server/metrics-service.ts` | **NEW** - Metrics persistence operations |
| `server/storage.ts` | Updated MetricsStore for hybrid mode |
| `server/index.ts` | Added Redis init & graceful shutdown |
| `server/routes.ts` | New `/metrics/range` & `/metrics/recent` endpoints |
| `.env.example` | Redis configuration section |

## Troubleshooting

### "Redis not available, using in-memory metrics only"

**Not a problem!** The app works fine without Redis, just using in-memory.

To fix:
```bash
# Make sure Redis is running
redis-cli ping

# Check REDIS_URL in .env
echo $REDIS_URL

# Restart app
npm run dev
```

### Can't Connect to Redis

```bash
# Check if Redis is running
ps aux | grep redis

# Check if port is listening
lsof -i :6379

# Test connection
redis-cli ping
```

### Metrics Not Saving

**Check Redis has data:**
```bash
redis-cli
KEYS metrics:*
ZCARD metrics:history:host-123
```

**Check app logs** for batch write errors

### High Memory Usage

```bash
# Check Redis memory
redis-cli INFO memory

# Reduce retention
# Set in .env: REDIS_METRICS_RETENTION_DAYS=7
```

## Next Steps

1. Deploy with Redis on VPS
2. Monitor metrics persisting correctly
3. Tune retention period based on storage
4. Set up Redis backup/recovery
5. Consider Redis cluster for high availability

## Docker Compose (Full Stack)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hostwatch
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/hostwatch
      REDIS_URL: redis://redis:6379
      SESSION_SECRET: dev-secret
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

Save as `docker-compose.yml`, then:
```bash
docker-compose up
```

Open http://localhost:5000
