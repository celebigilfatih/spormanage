// Warmup script to pre-compile all routes
async function warmupRoutes() {
  console.log('🔥 Warming up API routes...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  const routes = [
    '/api/auth/me',
    '/api/students?page=1&limit=10&search=&groupId=all&status=all',
    '/api/notifications?method=IN_APP&status=SENT&limit=20',
    '/api/payments?page=1&limit=20&status=all&groupId=all&overdue=false',
    '/api/groups',
    '/api/fee-types',
    '/api/trainings',
  ]

  for (const route of routes) {
    try {
      const start = Date.now()
      const response = await fetch(baseUrl + route)
      const duration = Date.now() - start
      const status = response.ok ? '✅' : '❌'
      console.log(`${status} ${route}`)
      console.log(`   ${duration}ms - ${response.status}\n`)
    } catch (error: any) {
      console.log(`❌ ${route}`)
      console.log(`   Error: ${error.message}\n`)
    }
  }

  console.log('✅ Warmup complete!')
}

// Wait 2 seconds for server to be ready
setTimeout(warmupRoutes, 2000)
