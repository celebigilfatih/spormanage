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
    const sessionId = searchParams.get('sessionId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    const where: any = {}

    if (sessionId) {
      where.sessionId = sessionId
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
        session: {
          include: {
            training: {
              include: {
                group: true
              }
            }
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { session: { date: 'desc' } },
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
              studentId_sessionId: {
                studentId: attendance.studentId,
                sessionId: attendance.sessionId
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
              sessionId: attendance.sessionId,
              status: attendance.status,
              notes: attendance.notes,
              excuseReason: attendance.excuseReason,
              createdById: user.id
            },
            include: {
              student: true,
              session: {
                include: {
                  training: true
                }
              }
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
    const { studentId, sessionId, status, notes, excuseReason } = data

    if (!studentId || !sessionId || !status) {
      return NextResponse.json(
        { error: 'Student, session, and status are required' },
        { status: 400 }
      )
    }

    // Verify student and session exist
    const [student, session] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.trainingSession.findUnique({ where: { id: sessionId } })
    ])

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      )
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_sessionId: {
          studentId,
          sessionId
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
        sessionId,
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
        session: {
          include: {
            training: {
              include: {
                group: true
              }
            }
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