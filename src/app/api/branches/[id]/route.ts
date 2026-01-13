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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            groups: true,
            fields: true,
            locations: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Failed to fetch branch:', error)
    return NextResponse.json(
      { error: 'Şube yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
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
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check for associated records
    const [studentsCount, groupsCount, fieldsCount, locationsCount] = await Promise.all([
      prisma.student.count({ where: { branchId: id } }),
      prisma.group.count({ where: { branchId: id } }),
      prisma.field.count({ where: { branchId: id } }),
      prisma.location.count({ where: { branchId: id } })
    ])

    if (!force && (studentsCount > 0 || groupsCount > 0 || fieldsCount > 0 || locationsCount > 0)) {
      const details = []
      if (studentsCount > 0) details.push(`${studentsCount} öğrenci`)
      if (groupsCount > 0) details.push(`${groupsCount} grup`)
      if (fieldsCount > 0) details.push(`${fieldsCount} saha`)
      if (locationsCount > 0) details.push(`${locationsCount} lokasyon`)

      // Extra safety: log this to terminal
      console.log(`[Branch DELETE] Blocked: ${id} has ${details.join(', ')}`);

      return NextResponse.json(
        { error: `Bu şubeye bağlı ${details.join(', ')} var, doğrudan silinemez.`, 
          details: { studentsCount, groupsCount, fieldsCount, locationsCount },
          canForce: true
        },
        { status: 400 }
      )
    }

    console.log(`[Branch DELETE] Executing delete for: ${id} (force: ${force})`);

    // Use transaction to cleanup associated records if force is true
    await prisma.$transaction(async (tx) => {
      if (force) {
        console.log(`[Branch DELETE] Cleaning up associations for ${id}`);
        // 1. Detach students and groups
        await tx.student.updateMany({
          where: { branchId: id },
          data: { branchId: null }
        })

        await tx.group.updateMany({
          where: { branchId: id },
          data: { branchId: null }
        })

        // Detach parents who might be indirectly linked through students (none needed, students keep parents)

        // 2. Find all fields and locations for this branch to cleanup their relations
        const fields = await tx.field.findMany({ where: { branchId: id }, select: { id: true } })
        const locations = await tx.location.findMany({ where: { branchId: id }, select: { id: true } })
        
        const fieldIds = fields.map(f => f.id)
        const locationIds = locations.map(l => l.id)

        // 3. Cleanup relations for fields/locations (TrainingSession, TrainingException)
        if (fieldIds.length > 0) {
          await tx.trainingSession.updateMany({ where: { fieldId: { in: fieldIds } }, data: { fieldId: null } })
          await tx.trainingException.updateMany({ where: { newFieldId: { in: fieldIds } }, data: { newFieldId: null } })
        }
        
        if (locationIds.length > 0) {
          await tx.trainingSession.updateMany({ where: { locationId: { in: locationIds } }, data: { locationId: null } })
          await tx.trainingException.updateMany({ where: { newLocationId: { in: locationIds } }, data: { newLocationId: null } })
        }

        // 4. Delete associated fields and locations
        await tx.field.deleteMany({ where: { branchId: id } })
        await tx.location.deleteMany({ where: { branchId: id } })
      }

      await tx.branch.delete({
        where: { id }
      })
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
