import { Pool } from 'pg'

// ─── Types ───
export interface LicenseInfo {
  id: number
  licenseKey: string
  customerName: string
  databaseName: string | null
  domain: string | null
  planType: 'MONTHLY' | 'YEARLY'
  monthlyFee: number
  startDate: string
  expiryDate: string
  isActive: boolean
  maxStudents: number
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface LicenseCheckResult {
  valid: boolean
  daysLeft: number
  warning: boolean       // true if <= 7 days left
  expired: boolean
  suspended: boolean     // is_active = false by admin
  info: LicenseInfo | null
  error?: string
}

// ─── In-memory cache (5 min TTL) ───
let cachedResult: LicenseCheckResult | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedResult(): LicenseCheckResult | null {
  if (cachedResult && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return cachedResult
  }
  return null
}

function setCachedResult(result: LicenseCheckResult): void {
  cachedResult = result
  cacheTimestamp = Date.now()
}

export function clearLicenseCache(): void {
  cachedResult = null
  cacheTimestamp = 0
}

// ─── DB Connection Pool (lazy) ───
let pool: Pool | null = null

function getPool(): Pool | null {
  if (pool) return pool

  const url = process.env.LICENSE_DB_URL
  if (!url) {
    console.warn('[License] LICENSE_DB_URL not configured — license check disabled')
    return null
  }

  pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  pool.on('error', (err) => {
    console.error('[License] Pool error:', err.message)
    pool = null
  })

  return pool
}

// ─── Core check function ───
export async function checkLicense(forceRefresh = false): Promise<LicenseCheckResult> {
  // If no LICENSE_KEY defined, license check is disabled (dev mode)
  const licenseKey = process.env.LICENSE_KEY
  if (!licenseKey) {
    return {
      valid: true,
      daysLeft: 9999,
      warning: false,
      expired: false,
      suspended: false,
      info: null,
    }
  }

  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedResult()
    if (cached) return cached
  }

  const db = getPool()
  if (!db) {
    // No license DB configured — allow access (graceful)
    return {
      valid: true,
      daysLeft: 9999,
      warning: false,
      expired: false,
      suspended: false,
      info: null,
    }
  }

  try {
    const res = await db.query(
      `SELECT * FROM licenses WHERE license_key = $1 LIMIT 1`,
      [licenseKey]
    )

    if (res.rows.length === 0) {
      const result: LicenseCheckResult = {
        valid: false,
        daysLeft: 0,
        warning: false,
        expired: true,
        suspended: false,
        info: null,
        error: 'Lisans bulunamadı',
      }
      setCachedResult(result)
      return result
    }

    const row = res.rows[0]
    const now = new Date()
    const expiry = new Date(row.expiry_date)
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const info: LicenseInfo = {
      id: row.id,
      licenseKey: row.license_key,
      customerName: row.customer_name,
      databaseName: row.database_name,
      domain: row.domain,
      planType: row.plan_type,
      monthlyFee: parseFloat(row.monthly_fee),
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      isActive: row.is_active,
      maxStudents: row.max_students,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    const suspended = !row.is_active
    const expired = daysLeft <= 0
    const warning = !expired && daysLeft <= 7
    const valid = !suspended && !expired

    const result: LicenseCheckResult = {
      valid,
      daysLeft: Math.max(0, daysLeft),
      warning,
      expired,
      suspended,
      info,
    }

    setCachedResult(result)
    return result
  } catch (error) {
    console.error('[License] DB query error:', error)
    // On DB error, allow access (don't block customer for our infra issues)
    return {
      valid: true,
      daysLeft: 9999,
      warning: false,
      expired: false,
      suspended: false,
      info: null,
      error: 'Lisans kontrolü yapılamadı',
    }
  }
}

// ─── Admin functions (for license-admin panel) ───

export async function getAllLicenses(): Promise<LicenseInfo[]> {
  const db = getPool()
  if (!db) return []

  try {
    const res = await db.query('SELECT * FROM licenses ORDER BY created_at DESC')
    return res.rows.map(row => ({
      id: row.id,
      licenseKey: row.license_key,
      customerName: row.customer_name,
      databaseName: row.database_name,
      domain: row.domain,
      planType: row.plan_type,
      monthlyFee: parseFloat(row.monthly_fee),
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      isActive: row.is_active,
      maxStudents: row.max_students,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  } catch (error) {
    console.error('[License] getAllLicenses error:', error)
    return []
  }
}

export async function createLicense(data: {
  licenseKey: string
  customerName: string
  databaseName?: string
  domain?: string
  planType: string
  monthlyFee: number
  startDate: string
  expiryDate: string
  maxStudents?: number
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
}): Promise<LicenseInfo | null> {
  const db = getPool()
  if (!db) return null

  try {
    const res = await db.query(
      `INSERT INTO licenses (license_key, customer_name, database_name, domain, plan_type, monthly_fee, start_date, expiry_date, max_students, contact_name, contact_email, contact_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.licenseKey, data.customerName, data.databaseName || null,
        data.domain || null, data.planType, data.monthlyFee,
        data.startDate, data.expiryDate, data.maxStudents || 0,
        data.contactName || null, data.contactEmail || null,
        data.contactPhone || null, data.notes || null,
      ]
    )
    const row = res.rows[0]
    return {
      id: row.id, licenseKey: row.license_key, customerName: row.customer_name,
      databaseName: row.database_name, domain: row.domain, planType: row.plan_type,
      monthlyFee: parseFloat(row.monthly_fee), startDate: row.start_date,
      expiryDate: row.expiry_date, isActive: row.is_active, maxStudents: row.max_students,
      contactName: row.contact_name, contactEmail: row.contact_email,
      contactPhone: row.contact_phone, notes: row.notes,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }
  } catch (error) {
    console.error('[License] createLicense error:', error)
    return null
  }
}

export async function updateLicense(id: number, data: Partial<{
  customerName: string
  databaseName: string
  domain: string
  planType: string
  monthlyFee: number
  startDate: string
  expiryDate: string
  isActive: boolean
  maxStudents: number
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
}>): Promise<boolean> {
  const db = getPool()
  if (!db) return false

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  const mapping: Record<string, string> = {
    customerName: 'customer_name', databaseName: 'database_name',
    domain: 'domain', planType: 'plan_type', monthlyFee: 'monthly_fee',
    startDate: 'start_date', expiryDate: 'expiry_date', isActive: 'is_active',
    maxStudents: 'max_students', contactName: 'contact_name',
    contactEmail: 'contact_email', contactPhone: 'contact_phone', notes: 'notes',
  }

  for (const [key, col] of Object.entries(mapping)) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${col} = $${idx}`)
      values.push((data as any)[key])
      idx++
    }
  }

  if (fields.length === 0) return false

  values.push(id)

  try {
    await db.query(
      `UPDATE licenses SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
    clearLicenseCache()
    return true
  } catch (error) {
    console.error('[License] updateLicense error:', error)
    return false
  }
}

export async function deleteLicense(id: number): Promise<boolean> {
  const db = getPool()
  if (!db) return false

  try {
    await db.query('DELETE FROM licenses WHERE id = $1', [id])
    clearLicenseCache()
    return true
  } catch (error) {
    console.error('[License] deleteLicense error:', error)
    return false
  }
}

// Generate a random license key
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = 3
  const segLen = 4
  const parts: string[] = []
  for (let s = 0; s < segments; s++) {
    let seg = ''
    for (let i = 0; i < segLen; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)]
    }
    parts.push(seg)
  }
  return parts.join('-')
}
