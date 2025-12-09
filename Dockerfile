# Multi-stage build for Next.js production

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* .npmrc ./
# Use npm ci with frozen lockfile for faster, deterministic installs
RUN npm ci --prefer-offline --no-audit --include=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client with checksum ignore for offline/network issues
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate
# Build Next.js with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache postgresql-client
WORKDIR /app
ENV NODE_ENV=production
# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# Copy standalone output (conditional copy for public directory)
RUN mkdir -p ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/@types ./node_modules/@types
COPY --from=builder /app/scripts/startup.sh ./scripts/startup.sh
COPY --from=builder /app/src ./src

# Conditionally copy public directory if it exists and is not empty
RUN if [ -d "/app/public" ] && [ "$(ls -A /app/public)" ]; then \
      cp -r /app/public/* ./public/; \
    fi

RUN chown -R nextjs:nodejs /app
RUN chmod +x /app/scripts/startup.sh

EXPOSE 3000
USER nextjs
CMD ["/app/scripts/startup.sh"]