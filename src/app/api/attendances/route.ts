import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { AttendanceStatus } from '@/types'

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
    const trainingId = searchParams.get('trainingId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    const where: any = {}

    if (trainingId) {
      where.trainingId = trainingId
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            group: true
          }
        },
        training: {
          include: {
            group: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { training: { date: 'desc' } },
        { student: { lastName: 'asc' } }
      ]
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error('Failed to fetch attendances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendances' },
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

    if (!AuthService.canManageTraining(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Handle bulk attendance creation
    if (Array.isArray(data)) {
      const attendances = await prisma.$transaction(
        data.map((attendance: any) =>
          prisma.attendance.upsert({
            where: {
              studentId_trainingId: {
                studentId: attendance.studentId,
                trainingId: attendance.trainingId
              }
            },
            update: {
              status: attendance.status,
              notes: attendance.notes,
              excuseReason: attendance.excuseReason,
              createdById: user.id
            },
            create: {
              studentId: attendance.studentId,
              trainingId: attendance.trainingId,
              status: attendance.status,
              notes: attendance.notes,
              excuseReason: attendance.excuseReason,
              createdById: user.id
            },
            include: {
              student: true,
              training: true
            }
          })
        )
      )

      return NextResponse.json({
        message: `Successfully recorded attendance for ${attendances.length} students`,
        attendances
      }, { status: 201 })
    }

    // Handle single attendance creation
    const { studentId, trainingId, status, notes, excuseReason } = data

    if (!studentId || !trainingId || !status) {
      return NextResponse.json(
        { error: 'Student, training, and status are required' },
        { status: 400 }
      )
    }

    // Verify student and training exist
    const [student, training] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.training.findUnique({ where: { id: trainingId } })
    ])

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      )
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_trainingId: {
          studentId,
          trainingId
        }
      },
      update: {
        status,
        notes,
        excuseReason,
        createdById: user.id
      },
      create: {
        studentId,
        trainingId,
        status,
        notes,
        excuseReason,
        createdById: user.id
      },
      include: {
        student: {
          include: {
            group: true
          }
        },
        training: {
          include: {
            group: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Failed to record attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}