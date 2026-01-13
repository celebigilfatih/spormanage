#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Run database migrations
echo "📦 Running database migrations..."
./node_modules/.bin/prisma migrate deploy

# Run seed only if explicitly requested via environment variable
if [ "$RUN_SEED" = "true" ]; then
  echo "👤 Running database seed..."
  ./node_modules/.bin/tsx prisma/seed.ts || echo "⚠️ Seed failed"
else
  echo "⏭️ Skipping database seed (Set RUN_SEED=true to run)"
fi

# Start the Next.js application
echo "✅ Starting Next.js server..."
exec node server.js
