import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  
  const payload = AuthService.verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({
    where: { id: payload.userId }
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const branches = await prisma.branch.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(branches)
  } catch (error) {
    console.error('Failed to fetch branches:', error)
    return NextResponse.json(
      { error: 'Şubeler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Şube adı gereklidir' },
        { status: 400 }
      )
    }

    // Check if branch with same name exists
    const existingBranch = await prisma.branch.findUnique({
      where: { name: data.name }
    })

    if (existingBranch) {
      return NextResponse.json(
        { error: 'Bu isimde bir şube zaten mevcut' },
        { status: 400 }
      )
    }

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        managerName: data.managerName || null,
        isActive: true
      }
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error('Failed to create branch:', error)
    return NextResponse.json(
      { error: 'Şube oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
