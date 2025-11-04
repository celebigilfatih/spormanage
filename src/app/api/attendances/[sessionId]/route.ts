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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const { sessionId } = await params

    // Verify session exists
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      )
    }

    // Delete all attendances for this session
    const result = await prisma.attendance.deleteMany({
      where: { sessionId }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} attendance records`,
      count: result.count
    })
  } catch (error) {
    console.error('Failed to delete attendances:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendances' },
      { status: 500 }
    )
  }
}
