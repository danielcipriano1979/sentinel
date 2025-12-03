# Database Configuration: Neon → PostgreSQL Migration

## Overview

This document covers the migration from Neon serverless PostgreSQL to a standard PostgreSQL database suitable for Kubernetes deployments with a VPS database.

## Changes Made

### 1. Dependency Updates

**Removed:**
- `@neondatabase/serverless` - Neon-specific serverless client
- `ws` - WebSocket library (only needed for Neon)
- `@types/ws` - TypeScript types for WebSocket

**Added:**
- `pg` (^8.11.3) - Standard PostgreSQL client with connection pooling
- `@types/pg` (^8.11.6) - TypeScript types for pg

### 2. Database Connection Configuration

**Previous Implementation (db.ts):**
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**New Implementation (db.ts):**
```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { loadDatabaseConfig, getPoolConfig } from './db-config';

const dbConfig = loadDatabaseConfig();
const poolConfig = getPoolConfig(dbConfig);
const pool = new Pool(poolConfig);
```

### 3. New Configuration System (db-config.ts)

A new `db-config.ts` file provides:

- **Environment validation** using Zod schema
- **Flexible connection options**:
  - Option 1: `DATABASE_URL` (connection string - recommended for K8s)
  - Option 2: Individual parameters (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- **Connection pooling configuration**:
  - `DB_MAX_CONNECTIONS` (default: 20)
  - `DB_MIN_CONNECTIONS` (default: 2)
  - `DB_CONNECTION_TIMEOUT_MS` (default: 10000ms)
  - `DB_IDLE_TIMEOUT_MS` (default: 30000ms)
  - `DB_STATEMENT_TIMEOUT_MS` (default: 30000ms)

### 4. Improved Error Handling

- Validates all required database configuration on startup
- Detailed error messages for configuration issues
- Pool error listener for unexpected connection errors
- Graceful shutdown function (`closeDatabase()`)

## Environment Configuration

### For Local Development

Create a `.env` file:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hostwatch
DB_MAX_CONNECTIONS=5
DB_CONNECTION_TIMEOUT_MS=10000
SESSION_SECRET=dev-session-secret-change-me
```

Or use individual parameters:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostwatch
DB_USER=postgres
DB_PASSWORD=postgres
SESSION_SECRET=dev-session-secret-change-me
```

### For Kubernetes Deployment

Use `DATABASE_URL` in the Kubernetes secret:
```bash
kubectl create secret generic sentinel-secret \
  --from-literal=DATABASE_URL=postgresql://user:password@vps-host:5432/hostwatch \
  --from-literal=SESSION_SECRET=$(openssl rand -base64 32)
```

See `k8s/deployment.yaml` for how secrets are injected.

### For VPS with Custom PostgreSQL

Example with self-hosted PostgreSQL on VPS:
```env
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=hostwatch
DB_USER=hostwatch_user
DB_PASSWORD=secure_password_here
DB_MAX_CONNECTIONS=20
SESSION_SECRET=your-secure-session-secret
```

## Connection Pool Tuning

The default pool configuration is suitable for most deployments:

- **DB_MAX_CONNECTIONS=20**: Maximum concurrent connections
  - For Kubernetes: 20 per pod (adjust if running multiple replicas)
  - For single server: 20 should be sufficient
  - **Increase to 50** if experiencing "Too many connections" errors
  - **Decrease to 10** if running 3+ replicas on the same database

- **DB_MIN_CONNECTIONS=2**: Minimum idle connections kept open
  - Reduces cold-start latency for requests
  - Increase to 5 if experiencing connection timeout issues

- **DB_CONNECTION_TIMEOUT_MS=10000**: Time to acquire a connection
  - Increase to 20000 if database is slow or overloaded
  - Decrease to 5000 for aggressive timeout handling

- **DB_IDLE_TIMEOUT_MS=30000**: Idle connection expiry
  - Default is suitable for most cases
  - Increase to 60000 if experiencing frequent reconnects

- **DB_STATEMENT_TIMEOUT_MS=30000**: SQL query timeout
  - Increase for long-running operations
  - Decrease to 5000 for aggressive query timeout

## Kubernetes Configuration

Update `k8s/deployment.yaml` to ensure DATABASE_URL is set:

```yaml
envFrom:
  - secretRef:
      name: sentinel-secret

# Alternatively, use individual env vars:
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: sentinel-secret
        key: DATABASE_URL
```

## Migration Checklist

- [ ] Install new dependencies: `npm install`
- [ ] Remove Neon-specific imports from codebase (if any remain)
- [ ] Set up `.env` file with database credentials
- [ ] Test local connection: `npm run dev`
- [ ] Run database migrations: `npm run db:push` (if needed)
- [ ] Update Kubernetes secret with new DATABASE_URL
- [ ] Deploy to Kubernetes: `kubectl apply -f k8s/`
- [ ] Verify pod health: `kubectl logs <pod-name>`
- [ ] Test application endpoints

## Troubleshooting

### "Database configuration validation failed"
- Ensure `DATABASE_URL` OR all of (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) are set
- Check `.env` file syntax and values

### "connect ECONNREFUSED"
- Verify database host is reachable: `telnet <host> <port>`
- Check database credentials are correct
- Ensure PostgreSQL service is running

### "Unexpected error on idle client"
- Check database server logs for errors
- Verify network connectivity to database
- Check database user permissions

### "Too many connections"
- Increase `DB_MAX_CONNECTIONS`
- Reduce the number of Kubernetes replicas
- Check for connection leaks in application code

### "Authentication failed for user"
- Verify username and password in DATABASE_URL
- Check PostgreSQL user exists and has correct permissions
- Test with `psql` command-line tool

## Performance Considerations

1. **Connection pooling**: Always use pooling in production (enabled by default)
2. **Network latency**: Database on VPS adds ~10-50ms latency per query
3. **Idle connections**: Min connections help reduce cold-start latency
4. **Query timeouts**: Set reasonable statement timeouts to prevent slow queries

## Security Considerations

1. **Credentials in secrets**: Use Kubernetes secrets, not environment variables in code
2. **Network isolation**: Consider using VPC/private networks for database access
3. **SSL/TLS**: PostgreSQL supports SSL connections (add `?sslmode=require` to CONNECTION_URL if needed)
4. **Least privilege**: Create database user with minimal required permissions
