#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma@6.17.1 migrate deploy

# Run seed to ensure admin user exists
echo "👤 Checking/creating admin user..."
npx tsx prisma/seed.ts

# Start the Next.js application
echo "✅ Starting Next.js server..."
exec node server.js
