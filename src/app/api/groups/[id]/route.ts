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
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
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
        trainings: {
          where: {
            date: {
              gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const groupId = params.id
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