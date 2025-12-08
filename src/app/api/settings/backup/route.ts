import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

function getDbKind(url: string) {
  const lower = (url || '').toLowerCase()
  if (lower.startsWith('file:') || lower.includes('sqlite')) return 'sqlite'
  if (lower.startsWith('postgres') || lower.includes('postgresql')) return 'postgres'
  return 'unknown'
}

function resolveSqlitePath(dbUrl: string) {
  // Handles typical Prisma SQLite URLs like: file:./prisma/dev.db
  const raw = dbUrl.replace(/^file:/i, '')
  return path.resolve(process.cwd(), raw)
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Backup] Starting backup process...')
    const token = request.cookies.get('auth-token')?.value
    console.log('[Backup] Token found:', !!token)
    const user = AuthService.verifyToken(token || '')
    console.log('[Backup] User verified:', user?.email, user?.role)

    if (!user || user.role !== 'ADMIN') {
      console.log('[Backup] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'auto' // auto, sql, json

    const dbUrl = process.env.DATABASE_URL || ''
    const kind = getDbKind(dbUrl)
    console.log('[Backup] Database type:', kind, 'Format requested:', format)

    if (kind === 'sqlite') {
      const dbPath = resolveSqlitePath(dbUrl)
      const buffer = await fs.readFile(dbPath)

      const headers = new Headers()
      headers.set('Content-Type', 'application/octet-stream')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      headers.set('Content-Disposition', `attachment; filename="aidat_takip_backup_${ts}.db"`)

      // Convert Buffer to Uint8Array for Response compatibility
      return new Response(new Uint8Array(buffer), { headers })
    }

    // PostgreSQL: SQL dump or JSON export
    if (kind === 'postgres' && (format === 'sql' || format === 'auto')) {
      try {
        console.log('[Backup] Attempting PostgreSQL dump...')
        const sqlDump = await createPostgresDump(dbUrl)
        
        const headers = new Headers()
        headers.set('Content-Type', 'application/sql')
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        headers.set('Content-Disposition', `attachment; filename="aidat_takip_backup_${ts}.sql"`)

        console.log('[Backup] SQL dump created, size:', sqlDump.length, 'bytes')
        return new Response(sqlDump, { headers })
      } catch (error) {
        console.error('[Backup] pg_dump failed, falling back to JSON:', error)
        // Fall through to JSON export
      }
    }

    // Fallback: full data export as JSON (for Postgres without pg_dump or when format=json)
    console.log('[Backup] Fetching data for JSON export...')
    const [
      users,
      students,
      parents,
      groups,
      feeTypes,
      payments,
      notes,
      trainings,
      trainingSessions,
      attendances,
      notifications,
      groupHistories,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.student.findMany(),
      prisma.parent.findMany(),
      prisma.group.findMany(),
      prisma.feeType.findMany(),
      prisma.payment.findMany(),
      prisma.note.findMany(),
      prisma.training.findMany(),
      prisma.trainingSession.findMany(),
      prisma.attendance.findMany(),
      prisma.notification.findMany(),
      prisma.groupHistory.findMany(),
    ])

    const backup = {
      meta: {
        app: 'aidat_takip',
        generatedAt: new Date().toISOString(),
        version: 'v1',
        kind,
      },
      data: {
        users,
        students,
        parents,
        groups,
        feeTypes,
        payments,
        notes,
        trainings,
        trainingSessions,
        attendances,
        notifications,
        groupHistories,
      },
    }

    const json = JSON.stringify(backup, (_key, value) => {
      // Serialize Date objects to ISO strings
      if (value instanceof Date) return value.toISOString()
      return value
    }, 2)

    console.log('[Backup] JSON generated, size:', json.length, 'bytes')

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    headers.set('Content-Disposition', `attachment; filename="aidat_takip_backup_${ts}.json"`)

    console.log('[Backup] Sending JSON response...')
    return new Response(json, { headers })
  } catch (error) {
    console.error('[Backup] Error generating backup:', error)
    return NextResponse.json(
      { error: 'Failed to generate backup' },
      { status: 500 }
    )
  }
}

async function createPostgresDump(dbUrl: string): Promise<string> {
  // Parse DATABASE_URL to get connection details
  const url = new URL(dbUrl)
  const host = url.hostname
  const port = url.port || '5432'
  const database = url.pathname.slice(1).split('?')[0]
  const username = url.username
  const password = url.password

  // Set environment variable for password
  const env = { ...process.env, PGPASSWORD: password }

  // Use pg_dump command
  const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists --no-owner --no-privileges`

  console.log('[Backup] Running pg_dump command...')
  const { stdout, stderr } = await execAsync(command, { env, maxBuffer: 50 * 1024 * 1024 }) // 50MB buffer

  if (stderr && !stderr.includes('NOTICE')) {
    console.warn('[Backup] pg_dump warnings:', stderr)
  }

  return stdout
}
