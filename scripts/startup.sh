#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Run database migrations
echo "📦 Running database migrations..."
./node_modules/.bin/prisma migrate deploy

# Run seed to ensure admin user exists
echo "👤 Checking/creating admin user..."
./node_modules/.bin/tsx prisma/seed.ts || echo "⚠️ Seed skipped"

# Start the Next.js application
echo "✅ Starting Next.js server..."
exec node server.js
