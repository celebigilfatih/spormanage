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

    const feeType = await prisma.feeType.findUnique({
      where: { id },
      include: {
        group: true,
        _count: {
          select: { payments: true }
        }
      }
    })

    if (!feeType) {
      return NextResponse.json(
        { error: 'Fee type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(feeType)
  } catch (error) {
    console.error('Failed to fetch fee type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fee type' },
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

    if (!AuthService.canManagePayments(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { name, amount, period, groupId } = await request.json()

    if (!name || !amount || !period) {
      return NextResponse.json(
        { error: 'Name, amount, and period are required' },
        { status: 400 }
      )
    }

    const feeType = await prisma.feeType.update({
      where: { id },
      data: {
        name,
        amount: parseFloat(amount),
        period,
        groupId: groupId || null,
      },
      include: {
        group: true
      }
    })

    return NextResponse.json(feeType)
  } catch (error) {
    console.error('Failed to update fee type:', error)
    return NextResponse.json(
      { error: 'Failed to update fee type' },
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

    if (!AuthService.canManagePayments(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if fee type is being used
    const paymentsCount = await prisma.payment.count({
      where: { feeTypeId: id }
    })

    if (paymentsCount > 0) {
      // Soft delete by marking as inactive
      await prisma.feeType.update({
        where: { id },
        data: { isActive: false }
      })
    } else {
      // Hard delete if no payments
      await prisma.feeType.delete({
        where: { id }
      })
    }

    return NextResponse.json({ message: 'Fee type deleted successfully' })
  } catch (error) {
    console.error('Failed to delete fee type:', error)
    return NextResponse.json(
      { error: 'Failed to delete fee type' },
      { status: 500 }
    )
  }
}
