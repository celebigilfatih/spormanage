#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma@6.17.1 migrate deploy

# Run seed to ensure admin user exists (optional - won't fail if dependencies missing)
echo "👤 Checking/creating admin user..."
npx tsx prisma/seed.ts || echo "⚠️ Seed skipped (dependencies not available in production build)"

# Start the Next.js application
echo "✅ Starting Next.js server..."
exec node server.js
