# ==============================================================================
# NETIFY WEB NEXT.JS PRODUCTION DOCKERFILE
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo configuration and package definitions for caching
COPY package.json package-lock.json* turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies (cached by Docker based on package.json & lockfile)
RUN npm install --legacy-peer-deps

# Copy web app source code
COPY apps/web/ ./apps/web/

# Build the Next.js app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npx turbo run build --filter=@netify/web...

# ==============================================================================
# RUNNER STAGE
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.js ./apps/web/

EXPOSE 8080

CMD ["npx", "next", "start", "apps/web", "-p", "8080"]
