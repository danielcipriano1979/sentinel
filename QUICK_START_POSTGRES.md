# Quick Start: PostgreSQL Configuration

## 5-Minute Setup

### 1. Create `.env` file

```bash
# Copy template
cp .env.example .env

# Edit with your database details
nano .env
```

### 2. Minimal `.env` (for development)

```env
# Required: Choose ONE option

# Option A: Connection String
DATABASE_URL=postgresql://postgres:password@localhost:5432/hostwatch

# Option B: Individual Parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostwatch
DB_USER=postgres
DB_PASSWORD=password

# Required: Authentication
SESSION_SECRET=dev-secret-change-this
```

### 3. Install & Run

```bash
npm install          # Install pg package
npm run dev          # Start development server
```

### 4. Verify Connection

Open browser: `http://localhost:5000`

Check logs for: `serving on port 5000`

## For Kubernetes

### 1. Create Secret

```bash
kubectl create secret generic sentinel-secret \
  --from-literal=DATABASE_URL=postgresql://user:password@vps-hostname:5432/hostwatch \
  --from-literal=SESSION_SECRET=$(openssl rand -base64 32)
```

### 2. Deploy

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 3. Verify

```bash
kubectl get pods
kubectl logs <pod-name>
```

## Environment Variables Reference

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| DATABASE_URL | ⭐ Yes | None | postgresql://user:pass@host:5432/db |
| DB_HOST | ⭐ Yes* | None | localhost (*if no DATABASE_URL) |
| DB_PORT | ⭐ Yes* | None | 5432 |
| DB_NAME | ⭐ Yes* | None | hostwatch |
| DB_USER | ⭐ Yes* | None | postgres |
| DB_PASSWORD | ⭐ Yes* | None | password |
| SESSION_SECRET | ⭐ Yes | None | openssl rand -base64 32 |
| PORT | No | 5000 | 5000 |
| NODE_ENV | No | production | production |
| DB_MAX_CONNECTIONS | No | 20 | 20 |
| DB_MIN_CONNECTIONS | No | 2 | 2 |

## Troubleshooting

### Error: "Database configuration validation failed"
```
✓ Check DATABASE_URL is set OR all DB_* variables are set
✓ Verify format: postgresql://user:password@host:port/database
```

### Error: "connect ECONNREFUSED"
```
✓ Is PostgreSQL running? `psql -U postgres`
✓ Is host/port correct? `telnet <host> <port>`
✓ Check credentials in .env
```

### Error: "Unexpected error on idle client"
```
✓ Check database server logs
✓ Verify network connectivity to database
✓ Check user permissions
```

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Replaced @neondatabase/serverless with pg |
| `server/db.ts` | Now uses pg + node-postgres driver |
| `server/db-config.ts` | **NEW** - Configuration validation |
| `server/index.ts` | Added graceful shutdown |
| `.env.example` | **NEW** - Configuration template |
| `DATABASE_MIGRATION.md` | **NEW** - Full migration guide |

## Generate Session Secret

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: dd + base64
dd if=/dev/urandom bs=32 count=1 2>/dev/null | base64
```

## Next: Persistent Metrics Storage

After you test this, we'll implement Redis or database-backed metrics storage in task #3.
