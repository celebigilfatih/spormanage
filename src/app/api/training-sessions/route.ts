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
    const trainingId = searchParams.get('trainingId')
    const groupId = searchParams.get('groupId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: any = {}

    if (trainingId) {
      where.trainingId = trainingId
    }

    if (groupId) {
      where.training = {
        groupId
      }
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (upcoming) {
      where.date = {
        gte: new Date()
      }
    }

    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        training: {
          include: {
            group: true
          }
        },
        attendances: {
          include: {
            student: true
          }
        },
        _count: {
          select: {
            attendances: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Failed to fetch training sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training sessions' },
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
      trainingId, 
      date, 
      startTime, 
      endTime, 
      location,
      notes
    } = data

    if (!trainingId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Training ID, date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Verify training exists
    const training = await prisma.training.findUnique({
      where: { id: trainingId }
    })

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      )
    }

    // Create datetime objects
    const sessionDate = new Date(date)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startDateTime = new Date(sessionDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(sessionDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    const session = await prisma.trainingSession.create({
      data: {
        trainingId,
        date: sessionDate,
        startTime: startDateTime,
        endTime: endDateTime,
        location,
        notes
      },
      include: {
        training: {
          include: {
            group: true
          }
        },
        _count: {
          select: {
            attendances: true
          }
        }
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Failed to create training session:', error)
    return NextResponse.json(
      { error: 'Failed to create training session' },
      { status: 500 }
    )
  }
}
