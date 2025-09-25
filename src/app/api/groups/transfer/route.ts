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

export async function POST(request: NextRequest) {
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

    const data = await request.json()
    const { studentId, newGroupId, reason } = data

    if (!studentId || !newGroupId) {
      return NextResponse.json(
        { error: 'Student ID and new group ID are required' },
        { status: 400 }
      )
    }

    // Verify student and new group exist
    const [student, newGroup] = await Promise.all([
      prisma.student.findUnique({ 
        where: { id: studentId },
        include: { group: true }
      }),
      prisma.group.findUnique({ where: { id: newGroupId } })
    ])

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (!newGroup) {
      return NextResponse.json(
        { error: 'New group not found' },
        { status: 404 }
      )
    }

    if (student.groupId === newGroupId) {
      return NextResponse.json(
        { error: 'Student is already in this group' },
        { status: 400 }
      )
    }

    // Perform transfer in a transaction
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      // End current group history if student is in a group
      if (student.groupId) {
        await tx.groupHistory.updateMany({
          where: {
            studentId,
            endDate: null
          },
          data: {
            endDate: new Date(),
            reason: reason || 'Transferred to another group'
          }
        })
      }

      // Update student's group
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: { groupId: newGroupId },
        include: {
          group: true,
          parents: {
            where: { isPrimary: true },
            take: 1
          }
        }
      })

      // Create new group history record
      await tx.groupHistory.create({
        data: {
          studentId,
          groupId: newGroupId,
          startDate: new Date(),
          reason: reason || 'Transferred from another group'
        }
      })

      return updatedStudent
    })

    return NextResponse.json({
      message: 'Student transferred successfully',
      student: result
    })
  } catch (error) {
    console.error('Failed to transfer student:', error)
    return NextResponse.json(
      { error: 'Failed to transfer student' },
      { status: 500 }
    )
  }
}