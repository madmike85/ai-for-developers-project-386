# Docker Configuration

## Overview

This project uses Docker Compose for development environment with:
- **PostgreSQL** (database)
- **API** (NestJS backend with hot-reload)
- **Web** (React + Vite frontend with hot-reload)

All services include health checks for proper startup order and monitoring.

## Quick Start

### First Time Setup

```bash
# Build and start all services
npm run docker:up:build
```

### Daily Development

```bash
# Start all services (uses cached images)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Full cleanup (removes volumes and images)
npm run docker:clean
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:up` | Start all services |
| `npm run docker:up:build` | Build images and start |
| `npm run docker:down` | Stop all services |
| `npm run docker:logs` | View logs in real-time |
| `npm run docker:clean` | Full cleanup with volumes |

## Service URLs

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432

## Hot Reload

Both frontend and backend support hot-reload:
- Changes to `apps/web/src/` are instantly reflected
- Changes to `apps/api/src/` trigger NestJS reload

## Database Migrations

Migrations run automatically on API container startup. To run manually:

```bash
# Execute migration command in API container
docker-compose exec api sh -c "cd packages/db && npx prisma migrate deploy"
```

## Environment Variables

### API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/call_calendar?schema=public
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Web (`apps/web/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCK_API=false
```

## Troubleshooting

### Services won't start
```bash
# Check service status
docker-compose ps

# View specific service logs
docker-compose logs api
docker-compose logs web
docker-compose logs postgres
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps

# Reset database (WARNING: loses data)
npm run docker:clean
npm run docker:up:build
```

### Port already in use
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:5432 | xargs kill -9
```

### Permission issues with node_modules
```bash
# Clean and rebuild
docker-compose down
rm -rf apps/*/node_modules packages/*/node_modules
npm run docker:up:build
```

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      Web        │────────▶│       API       │────────▶│    PostgreSQL   │
│   (Port 5173)   │         │   (Port 3000)   │         │   (Port 5432)   │
│  React + Vite   │         │     NestJS      │         │   Health Check  │
│  Health Check   │         │  Health Check   │         │   (pg_isready)  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       │                           │                           │
       └───────────────────────────┴───────────────────────────┘
                           Docker Network
```

## Health Check Strategy

1. **PostgreSQL** must be healthy before API starts
2. **API** must be healthy before Web starts (and runs migrations)
3. **Web** starts only when API is ready

This ensures proper startup order and prevents connection errors.

---

# Production Mode

## Overview

Production mode uses optimized, secure Docker images:
- **PostgreSQL** — Same as development
- **API** — Compiled NestJS with non-root user
- **Web** — Nginx serving static build files (not Vite dev server)

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      Web        │────────▶│       API       │────────▶│    PostgreSQL   │
│   (Port 80)     │         │   (Port 3000)   │         │   (Port 5432)   │
│  Nginx + Static │         │  Compiled Nest  │         │   Health Check  │
│   Health Check  │         │   Non-root User │         │   (pg_isready)  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       │                           │                           │
       └───────────────────────────┴───────────────────────────┘
                           Docker Network
```

## Production Features

- ✅ **Multi-stage builds** — Smaller final images
- ✅ **Compiled code only** — No TypeScript source in production
- ✅ **Non-root user** — API runs as `nodejs` user (not root)
- ✅ **Nginx** — High-performance static file serving
- ✅ **Gzip compression** — Optimized asset delivery
- ✅ **Static file caching** — 1 year cache for assets
- ✅ **API proxy** — `/api/*` routes proxied to backend

## Quick Start (Production)

### Setup

```bash
# 1. Create production environment file
cp .env.production.example .env

# 2. Edit .env and set secure password
# POSTGRES_PASSWORD=your_secure_password_here

# 3. Build and start production services
npm run docker:prod:build
```

### Daily Operations

```bash
# Start production services
npm run docker:prod:up

# View logs
npm run docker:prod:logs

# Stop services
npm run docker:prod:down

# Full cleanup (WARNING: removes database)
npm run docker:prod:clean
```

## Production Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:prod:up` | Start production services |
| `npm run docker:prod:build` | Build images and start |
| `npm run docker:prod:down` | Stop production services |
| `npm run docker:prod:logs` | View production logs |
| `npm run docker:prod:clean` | Full cleanup with volumes |

## Production URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web** | http://localhost:80 | Production frontend (Nginx) |
| **API** | http://localhost:3000 | Direct API access |
| **API Docs** | http://localhost:3000/api/docs | Swagger documentation |
| **Health** | http://localhost:3000/health | API health check |

## Production Files

### Dockerfiles
- `apps/web/Dockerfile.prod` — Multi-stage Nginx build
- `apps/api/Dockerfile.prod` — Multi-stage Node.js build

### Configuration
- `apps/web/nginx.conf` — Nginx with API proxy and caching
- `docker-compose.prod.yml` — Production orchestration
- `.env.production.example` — Environment template

## Security Features

### API Container
- Runs as `nodejs` user (UID 1001, non-root)
- Only `node` binary available (no dev tools)
- Compiled JavaScript only (no TypeScript source)

### Web Container
- Nginx runs as non-root
- Static files only (no Node.js)
- Minimal attack surface

### Network
- Internal Docker network (services isolated)
- Only ports 80 and 3000 exposed
- PostgreSQL not exposed to host

## Nginx Configuration

The production Nginx setup:
- **Port 80** — HTTP (no SSL as requested)
- **Static files** — Served directly with 1-year cache
- **API proxy** — `/api/*` → `http://api:3000/api/`
- **SPA routing** — All routes serve `index.html`
- **Gzip** — Compression for JS/CSS/HTML
- **Health check** — `/nginx-health` endpoint

## Switching Between Modes

### From Development to Production
```bash
# Stop development
npm run docker:down

# Start production
npm run docker:prod:build
```

### From Production to Development
```bash
# Stop production
npm run docker:prod:down

# Start development
npm run docker:up:build
```

## Troubleshooting (Production)

### Web container shows 502 error
```bash
# Check if API is healthy
docker-compose -f docker-compose.prod.yml ps

# View API logs
docker-compose -f docker-compose.prod.yml logs api
```

### Database connection issues
```bash
# Check environment variables
cat .env

# Verify database is healthy
docker-compose -f docker-compose.prod.yml ps
```

### Static files not updating
```bash
# Rebuild web container
npm run docker:prod:down
docker-compose -f docker-compose.prod.yml build --no-cache web
npm run docker:prod:up
```

### CORS errors
If you see CORS errors in browser console when calling API:

**Cause**: The `FRONTEND_URL` environment variable doesn't match your actual frontend URL.

**Solution**: Update `FRONTEND_URL` in `docker-compose.prod.yml`:
```yaml
api:
  environment:
    - FRONTEND_URL=http://localhost  # Change to your actual frontend URL
```

Then restart the API container:
```bash
docker-compose -f docker-compose.prod.yml up -d api
```
