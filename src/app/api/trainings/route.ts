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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const groupId = searchParams.get('groupId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const upcoming = searchParams.get('upcoming') === 'true'

    const skip = (page - 1) * limit
    const where: any = {}

    if (groupId) {
      where.groupId = groupId
    }

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        skip,
        take: limit,
        include: {
          group: {
            include: {
              coach: {
                select: {
                  id: true,
                  name: true,
                  position: true
                }
              },
              assistantCoach: {
                select: {
                  id: true,
                  name: true,
                  position: true
                }
              },
              _count: {
                select: { students: true }
              }
            }
          },
          sessions: {
            where: startDate && endDate ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : upcoming ? {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            } : undefined,
            include: {
              _count: {
                select: { attendances: true }
              }
            },
            orderBy: { date: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.training.count({ where })
    ])

    return NextResponse.json({
      trainings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch trainings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
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
    const { 
      groupId, 
      name, 
      description, 
      sessions
    } = data

    if (!groupId || !name || !sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'Group, name, and at least one session are required' },
        { status: 400 }
      )
    }

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Create training with sessions
    const training = await prisma.training.create({
      data: {
        groupId,
        name,
        description,
        sessions: {
          create: sessions.map((session: any) => {
            const trainingDate = new Date(session.date)
            const [startHour, startMinute] = session.startTime.split(':').map(Number)
            const [endHour, endMinute] = session.endTime.split(':').map(Number)

            const startDateTime = new Date(trainingDate)
            startDateTime.setHours(startHour, startMinute, 0, 0)

            const endDateTime = new Date(trainingDate)
            endDateTime.setHours(endHour, endMinute, 0, 0)

            return {
              date: trainingDate,
              startTime: startDateTime,
              endTime: endDateTime,
              location: session.location,
              notes: session.notes
            }
          })
        }
      },
      include: {
        group: {
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                position: true
              }
            },
            assistantCoach: {
              select: {
                id: true,
                name: true,
                position: true
              }
            },
            _count: {
              select: { students: true }
            }
          }
        },
        sessions: {
          include: {
            _count: {
              select: { attendances: true }
            }
          }
        }
      }
    })

    return NextResponse.json(training, { status: 201 })
  } catch (error) {
    console.error('Failed to create training:', error)
    return NextResponse.json(
      { error: 'Failed to create training' },
      { status: 500 }
    )
  }
}