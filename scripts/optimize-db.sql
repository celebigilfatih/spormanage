-- Optimize PostgreSQL database performance
-- Run this with: npx prisma db execute --file scripts/optimize-db.sql --schema prisma/schema.prisma

-- Update statistics for query planner
ANALYZE notifications;
ANALYZE students;
ANALYZE payments;
ANALYZE "Student";
ANALYZE "Notification";
ANALYZE "Payment";

-- Vacuum to reclaim storage and update statistics
VACUUM ANALYZE notifications;
VACUUM ANALYZE students;
VACUUM ANALYZE payments;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
