import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// Get current user from token
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const groupId = searchParams.get('groupId') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { parents: { some: { firstName: { contains: search, mode: 'insensitive' } } } },
        { parents: { some: { lastName: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    if (groupId && groupId !== 'all') {
      where.groupId = groupId
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Optimize query by selecting only necessary fields
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          birthDate: true,
          isActive: true,
          enrollmentDate: true,
          group: {
            select: {
              id: true,
              name: true
            }
          },
          parents: {
            where: { isPrimary: true },
            take: 1,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              relationship: true
            }
          },
          _count: {
            select: {
              payments: {
                where: {
                  status: { not: 'CANCELLED' }
                }
              },
              notes: true,
              attendances: true
            }
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.student.count({ where })
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!AuthService.canManageStudents(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { 
      firstName, 
      lastName, 
      phone, 
      birthDate, 
      groupId, 
      parents 
    } = data

    if (!firstName || !lastName || !parents || parents.length === 0) {
      return NextResponse.json(
        { error: 'Student name and at least one parent are required' },
        { status: 400 }
      )
    }

    // Validate at least one parent is marked as primary
    const primaryParent = parents.find((p: any) => p.isPrimary)
    if (!primaryParent) {
      return NextResponse.json(
        { error: 'At least one parent must be marked as primary' },
        { status: 400 }
      )
    }

    // Create student with parents in a transaction
    const student = await prisma.$transaction(async (tx) => {
      // Create student
      const newStudent = await tx.student.create({
        data: {
          firstName,
          lastName,
          phone,
          birthDate: birthDate ? new Date(birthDate) : null,
          groupId: groupId || null,
          createdById: user.id,
        }
      })

      // Create parents
      await Promise.all(
        parents.map((parent: any) =>
          tx.parent.create({
            data: {
              firstName: parent.firstName,
              lastName: parent.lastName,
              phone: parent.phone,
              email: parent.email || null,
              address: parent.address || null,
              relationship: parent.relationship,
              isEmergency: parent.isEmergency || false,
              isPrimary: parent.isPrimary || false,
              students: {
                connect: { id: newStudent.id }
              }
            }
          })
        )
      )

      return newStudent
    })

    // Fetch the complete student data
    const completeStudent = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        group: true,
        parents: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(completeStudent, { status: 201 })
  } catch (error) {
    console.error('Failed to create student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
