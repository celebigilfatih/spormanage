# Multi-stage build for Next.js production

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* .npmrc ./
RUN npm ci --include=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
RUN npx prisma generate
# Build Next.js
RUN npm run build

FROM node:20-alpine AS runner
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

# Conditionally copy public directory if it exists and is not empty
RUN if [ -d "/app/public" ] && [ "$(ls -A /app/public)" ]; then \
      cp -r /app/public/* ./public/; \
    fi

RUN chown -R nextjs:nodejs /app

EXPOSE 3000
USER nextjs
CMD ["node", "server.js"]