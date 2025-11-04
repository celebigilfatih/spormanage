#!/bin/bash
# Production Deployment Script for portal.spormanage.com.tr
# Run this script on your remote server (140.245.10.7)

echo "🚀 Starting production deployment for portal.spormanage.com.tr"

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down

# Pull latest changes (if using git)
# git pull origin main

# Rebuild and start containers with new environment variables
echo "🔨 Building and starting containers with production configuration..."
docker-compose up -d --build

# Wait for containers to be healthy
echo "⏳ Waiting for containers to start..."
sleep 15

# Check container status
echo "✅ Checking container status..."
docker-compose ps

# Verify environment variables
echo "🔍 Verifying environment variables..."
docker exec spormanage-frontend-1 printenv | grep -E "JWT_SECRET|NEXTAUTH"

# Check database connection
echo "🗄️  Checking database connection..."
docker exec spormanage-postgres-1 psql -U postgres -d aidat_takip -c "SELECT COUNT(*) as user_count FROM users;"

# Show logs to verify no errors
echo "📋 Checking frontend logs for errors..."
docker logs --tail 50 spormanage-frontend-1

echo "✨ Deployment complete!"
echo "🌐 Application is now available at: http://portal.spormanage.com.tr:3077"
echo ""
echo "⚠️  IMPORTANT STEPS:"
echo "1. Clear browser cookies for portal.spormanage.com.tr"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Hard refresh the page (Ctrl+Shift+R)"
echo "4. Login again with admin credentials"
echo ""
echo "📧 Admin users:"
echo "   - admin@futbolokulu.com"
echo "   - core@spormanage.com.tr"
echo ""
echo "🔍 To view live logs:"
echo "   docker logs -f spormanage-frontend-1"
