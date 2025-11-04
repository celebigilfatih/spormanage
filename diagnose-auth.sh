#!/bin/bash
# Authentication Diagnostic Script
# Run this on your remote server to diagnose authentication issues

echo "🔍 Authentication Diagnostics for portal.spormanage.com.tr"
echo "=========================================================="
echo ""

echo "1️⃣ Checking container status..."
docker ps | grep -E "spormanage|CONTAINER"
echo ""

echo "2️⃣ Verifying JWT environment variables..."
echo "JWT_SECRET:"
docker exec spormanage-frontend-1 printenv JWT_SECRET | head -c 20
echo "... (truncated for security)"
echo ""
echo "NEXTAUTH_SECRET:"
docker exec spormanage-frontend-1 printenv NEXTAUTH_SECRET | head -c 20
echo "... (truncated for security)"
echo ""
echo "NEXTAUTH_URL:"
docker exec spormanage-frontend-1 printenv NEXTAUTH_URL
echo ""

echo "3️⃣ Checking database users..."
docker exec spormanage-postgres-1 psql -U postgres -d aidat_takip -c "SELECT id, email, role, 'Active:' || isActive as status FROM users;"
echo ""

echo "4️⃣ Checking frontend application logs (last 30 lines)..."
docker logs --tail 30 spormanage-frontend-1
echo ""

echo "5️⃣ Testing database connectivity from frontend..."
docker exec spormanage-frontend-1 node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.count().then(count => console.log('✅ Database connected. User count:', count)).catch(err => console.error('❌ Database error:', err.message));"
echo ""

echo "6️⃣ Container resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" spormanage-frontend-1 spormanage-postgres-1
echo ""

echo "=========================================================="
echo "📋 Next Steps:"
echo "1. If JWT_SECRET or NEXTAUTH_SECRET show 'fallback' or short values, rebuild containers"
echo "2. If database connection fails, check DATABASE_URL in docker-compose.yml"
echo "3. Check logs for 'Token verification failed' or 'Unauthorized' messages"
echo "4. Make sure to clear browser cookies after any changes"
echo ""
echo "💡 To watch live logs:"
echo "   docker logs -f spormanage-frontend-1"
