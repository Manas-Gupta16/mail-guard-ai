# ============================================
# Mail Guard AI — API Server Dockerfile
# Multi-stage build for production
# ============================================

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# --- Stage 2: Runtime ---
FROM node:20-alpine AS runtime

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system app && adduser --system --ingroup app app

# Copy dependencies and source
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

# Set ownership
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start server
CMD ["node", "src/index.js"]
