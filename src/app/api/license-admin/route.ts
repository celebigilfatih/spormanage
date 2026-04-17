import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import {
  getAllLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  generateLicenseKey,
} from '@/lib/license'

// Super admin guard
function isSuperAdmin(request: NextRequest): boolean {
  const superKey = process.env.SUPER_ADMIN_KEY
  if (!superKey) return false

  // Check token — must be logged in as ADMIN
  const token = request.cookies.get('auth-token')?.value
  if (!token) return false
  const payload = AuthService.verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') return false

  // Check super admin header or query param
  const headerKey = request.headers.get('x-super-admin-key')
  const urlKey = request.nextUrl.searchParams.get('key')
  return headerKey === superKey || urlKey === superKey
}

// GET - List all licenses
export async function GET(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  const licenses = await getAllLicenses()
  return NextResponse.json({ licenses })
}

// POST - Create new license
export async function POST(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action } = body

    // Generate key action
    if (action === 'generate-key') {
      return NextResponse.json({ key: generateLicenseKey() })
    }

    // Create license
    const license = await createLicense({
      licenseKey: body.licenseKey || generateLicenseKey(),
      customerName: body.customerName,
      databaseName: body.databaseName,
      domain: body.domain,
      planType: body.planType || 'MONTHLY',
      monthlyFee: body.monthlyFee ?? 3000,
      startDate: body.startDate,
      expiryDate: body.expiryDate,
      maxStudents: body.maxStudents,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      notes: body.notes,
    })

    if (!license) {
      return NextResponse.json({ error: 'Lisans oluşturulamadı' }, { status: 500 })
    }

    return NextResponse.json({ license }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// PUT - Update license
export async function PUT(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Lisans ID gerekli' }, { status: 400 })
    }

    const success = await updateLicense(id, data)
    if (!success) {
      return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// DELETE - Delete license
export async function DELETE(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  try {
    const { searchParams } = request.nextUrl
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'Lisans ID gerekli' }, { status: 400 })
    }

    const success = await deleteLicense(id)
    if (!success) {
      return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
