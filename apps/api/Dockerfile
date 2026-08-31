# ==============================================================================
# NETIFY API PRODUCTION DOCKERFILE
# ==============================================================================
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy monorepo configuration and lockfiles
COPY package.json package-lock.json* turbo.json tsconfig.json ./

# Copy internal packages
COPY packages/ ./packages/

# Copy API app
COPY apps/api/ ./apps/api/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma Client & Build
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/netify_db"
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npx turbo run build --filter=@netify/api...

# ==============================================================================
# RUNNER STAGE
# ==============================================================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built node_modules, packages, and api artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

USER nestjs

EXPOSE 8080

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
