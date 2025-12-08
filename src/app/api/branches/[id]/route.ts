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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const data = await request.json()
    const { id } = await params

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Şube adı gereklidir' },
        { status: 400 }
      )
    }

    // Check if another branch with same name exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name: data.name,
        id: { not: id }
      }
    })

    if (existingBranch) {
      return NextResponse.json(
        { error: 'Bu isimde bir şube zaten mevcut' },
        { status: 400 }
      )
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        managerName: data.managerName || null,
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Failed to update branch:', error)
    return NextResponse.json(
      { error: 'Şube güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { id } = await params

    // Check if branch has students
    const studentsCount = await prisma.student.count({
      where: { branchId: id }
    })

    if (studentsCount > 0) {
      return NextResponse.json(
        { error: 'Bu şubede kayıtlı öğrenciler var, silinemez' },
        { status: 400 }
      )
    }

    await prisma.branch.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Şube başarıyla silindi' })
  } catch (error) {
    console.error('Failed to delete branch:', error)
    return NextResponse.json(
      { error: 'Şube silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
