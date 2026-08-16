# ============================================
# Mail Guard AI — API Server Dockerfile
# Multi-stage production container
# ============================================

FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma native binary support
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY src/ ./src/

# Generate Prisma database client
RUN npx prisma generate --schema=src/db/schema.prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "src/index.js"]
