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

export async function GET() {
  try {
    const feeTypes = await prisma.feeType.findMany({
      where: { isActive: true },
      include: {
        group: true,
        _count: {
          select: { payments: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(feeTypes)
  } catch (error) {
    console.error('Failed to fetch fee types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fee types' },
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

    if (!AuthService.canManagePayments(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { name, amount, period, groupId } = await request.json()

    if (!name || !amount || !period) {
      return NextResponse.json(
        { error: 'Name, amount, and period are required' },
        { status: 400 }
      )
    }

    const feeType = await prisma.feeType.create({
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

    return NextResponse.json(feeType, { status: 201 })
  } catch (error) {
    console.error('Failed to create fee type:', error)
    return NextResponse.json(
      { error: 'Failed to create fee type' },
      { status: 500 }
    )
  }
}