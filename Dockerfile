# Multi-stage build for Next.js production

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* .npmrc ./
# Install all dependencies including devDependencies for builder
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate
# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache postgresql-client
WORKDIR /app
ENV NODE_ENV=production
# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts/startup.sh ./scripts/startup.sh

# Copy all node_modules needed for Prisma and startup scripts
# This ensures all dependencies for migrations and seed are available
COPY --from=deps /app/node_modules ./node_modules

# Regenerate Prisma client in the runner stage to ensure it's available
RUN npx prisma generate

RUN chown -R nextjs:nodejs /app
RUN chmod +x /app/scripts/startup.sh

EXPOSE 3000
USER nextjs
CMD ["/app/scripts/startup.sh"]