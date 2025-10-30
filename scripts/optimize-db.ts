import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function optimizeDatabase() {
  console.log('🔍 Analyzing database performance...\n')

  try {
    // Check notification count
    const notificationCount = await prisma.notification.count()
    console.log(`📊 Total notifications: ${notificationCount}`)

    // Check student count
    const studentCount = await prisma.student.count()
    console.log(`📊 Total students: ${studentCount}`)

    // Check payment count
    const paymentCount = await prisma.payment.count()
    console.log(`📊 Total payments: ${paymentCount}`)

    console.log('\n🧹 Running VACUUM and ANALYZE on tables...')
    
    // Run VACUUM ANALYZE on key tables
    await prisma.$executeRawUnsafe('VACUUM ANALYZE "notifications"')
    console.log('✅ Optimized notifications table')
    
    await prisma.$executeRawUnsafe('VACUUM ANALYZE "students"')
    console.log('✅ Optimized students table')
    
    await prisma.$executeRawUnsafe('VACUUM ANALYZE "payments"')
    console.log('✅ Optimized payments table')

    // Get table sizes
    console.log('\n📏 Table sizes:')
    const tableSizes: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `)
    
    tableSizes.forEach(table => {
      console.log(`  ${table.tablename}: ${table.size} (${table.row_count} rows)`)
    })

    // Check for missing indexes
    console.log('\n🔍 Index usage statistics:')
    const indexStats: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        tablename,
        indexname,
        idx_scan,
        idx_tup_read
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    `)
    
    indexStats.forEach(idx => {
      console.log(`  ${idx.tablename}.${idx.indexname}: ${idx.idx_scan} scans, ${idx.idx_tup_read} rows read`)
    })

    console.log('\n✅ Database optimization complete!')

  } catch (error) {
    console.error('❌ Error optimizing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

optimizeDatabase()
