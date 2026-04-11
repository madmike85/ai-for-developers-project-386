# Unified Production Dockerfile for Call Calendar
# Builds both frontend (React) and backend (NestJS) into a single container

# Stage 1: Build Web (React + Vite)
FROM node:20-slim AS web-builder

# Invalidate cache to ensure fresh build
ARG CACHE_BUST=1

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies with verbose output
RUN npm install

# Install platform-specific native bindings required by Vite 8
RUN ARCH=$(uname -m) && \
    echo "Architecture: $ARCH" && \
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

# Debug: Show copied files
RUN echo "=== Contents of apps/web/ ===" && ls -la apps/web/ && \
    echo "=== Contents of apps/web/src/ ===" && ls -la apps/web/src/ | head -10

# Build the frontend with explicit error handling
RUN cd apps/web && \
    echo "Starting build..." && \
    npm run build 2>&1 && \
    echo "Build completed, checking dist..." && \
    ls -la dist/ || (echo "ERROR: dist directory not created!" && exit 1)

# Ensure dist layer is properly exported (create marker file to force layer creation)
RUN touch /app/apps/web/dist/.build-complete && ls -la /app/apps/web/dist/

# Stage 2: Build API (NestJS + Prisma)
FROM node:20-slim AS api-builder

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

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
FROM api-builder AS production

WORKDIR /app

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
