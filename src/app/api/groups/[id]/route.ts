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
    const { id: groupId } = await params

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            position: true,
            license: true
          }
        },
        assistantCoach: {
          select: {
            id: true,
            name: true,
            position: true,
            license: true
          }
        },
        students: {
          where: { isActive: true },
          include: {
            parents: {
              where: { isPrimary: true },
              take: 1
            },
            _count: {
              select: {
                payments: true,
                notes: true,
                attendances: true
              }
            }
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ]
        },
        feeTypes: true,
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to fetch group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
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
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!AuthService.canManageStudents(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: groupId } = await params
    const { name, description, coachId, assistantCoachId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current group)
    const existingGroup = await prisma.group.findFirst({
      where: {
        name,
        id: { not: groupId }
      }
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group name already exists' },
        { status: 400 }
      )
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        description: description || null,
        coachId: coachId || null,
        assistantCoachId: assistantCoachId || null,
      },
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
        students: {
          where: { isActive: true }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Failed to update group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!AuthService.canManageStudents(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: groupId } = await params
    const data = await request.json()

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: data.name || group.name,
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : group.isActive,
      },
      include: {
        students: {
          where: { isActive: true }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Failed to update group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
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
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!AuthService.canManageStudents(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: groupId } = await params

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            students: true,
            trainings: true,
            feeTypes: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Use transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // 1. Remove students from group
      if (group._count.students > 0) {
        await tx.student.updateMany({
          where: { groupId },
          data: { groupId: null }
        })
      }

      // 2. Delete all trainings and their sessions/attendances
      if (group._count.trainings > 0) {
        const trainings = await tx.training.findMany({
          where: { groupId },
          select: { id: true }
        })

        for (const training of trainings) {
          // Delete attendance records for all sessions of this training
          const sessions = await tx.trainingSession.findMany({
            where: { trainingId: training.id },
            select: { id: true }
          })

          for (const session of sessions) {
            await tx.attendance.deleteMany({
              where: { sessionId: session.id }
            })
          }

          // Delete all sessions
          await tx.trainingSession.deleteMany({
            where: { trainingId: training.id }
          })

          // Delete training
          await tx.training.delete({
            where: { id: training.id }
          })
        }
      }

      // 3. Update fee types to remove group reference
      if (group._count.feeTypes > 0) {
        await tx.feeType.updateMany({
          where: { groupId },
          data: { groupId: null }
        })
      }

      // 4. Finally, delete the group
      await tx.group.delete({
        where: { id: groupId }
      })
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Failed to delete group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
