# Unified Production Dockerfile for Call Calendar
# Builds both frontend (React) and backend (NestJS) into a single container

# Stage 1: Build Web (React + Vite)
FROM node:20-slim AS web-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install

# Install platform-specific native bindings required by Vite 8
# Automatically detect architecture using uname (works with legacy and BuildKit builders)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
        cd apps/web && npm install @rolldown/binding-linux-arm64-gnu lightningcss-linux-arm64-gnu; \
    elif [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then \
        cd apps/web && npm install @rolldown/binding-linux-x64-gnu lightningcss-linux-x64-gnu; \
    else \
        echo "Unknown architecture: $ARCH, skipping platform-specific packages"; \
    fi

# Copy web source code
COPY apps/web/src ./apps/web/src/
COPY apps/web/public ./apps/web/public/
COPY apps/web/index.html ./apps/web/
COPY apps/web/vite.config.ts ./apps/web/
COPY apps/web/tsconfig*.json ./apps/web/
COPY apps/web/eslint.config.js ./apps/web/

# Build the frontend (outputs to apps/web/dist)
RUN cd apps/web && npm run build

# Stage 2: Build API (NestJS + Prisma)
FROM node:20-slim AS api-builder

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY apps/api/package*.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY packages/db/package*.json ./packages/db/
COPY packages/db/tsconfig.json ./packages/db/

# Install dependencies
RUN npm install

# Install Prisma in packages/db
RUN cd packages/db && npm install @prisma/client prisma

# Copy Prisma schema and source
COPY packages/db/prisma ./packages/db/prisma/
COPY packages/db/src ./packages/db/src/

# Generate Prisma client and build packages/db
RUN cd packages/db && npx prisma generate && npm run build

# Copy API source code
COPY apps/api/src ./apps/api/src/

# Build API
RUN cd apps/api && npm run build

# Stage 3: Production Image
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma and wget for health check
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

# Copy production files from builders
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=api-builder /app/apps/api/package.json ./apps/api/
COPY --from=api-builder /app/packages/db ./packages/db/
COPY --from=api-builder /app/packages/db/node_modules ./packages/db/node_modules

# Copy built frontend files to API's public directory
COPY --from=web-builder /app/apps/web/dist ./apps/api/public/

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (configurable via PORT environment variable)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Start application with database migrations
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma && node apps/api/dist/main"]
