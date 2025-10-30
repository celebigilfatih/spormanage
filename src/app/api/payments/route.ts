import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { PaymentStatus } from '@/types'

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
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const groupId = searchParams.get('groupId')
    const overdue = searchParams.get('overdue') === 'true'

    const skip = (page - 1) * limit
    const where: any = {}

    // Exclude cancelled payments by default unless specifically requested
    if (!status || status === 'all') {
      where.status = { not: PaymentStatus.CANCELLED }
    } else {
      where.status = status
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (groupId && groupId !== 'all') {
      where.student = {
        groupId: groupId
      }
    }

    if (overdue) {
      where.AND = [
        { status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } },
        { dueDate: { lt: new Date() } }
      ]
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              group: true,
              parents: {
                where: { isPrimary: true },
                take: 1
              }
            }
          },
          feeType: true,
          createdBy: {
            select: { name: true }
          }
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.payment.count({ where })
    ])

    // Calculate summary stats
    const summaryStats = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
        paidAmount: true
      },
      _count: {
        id: true
      }
    })

    const overduePayments = await prisma.payment.count({
      where: {
        ...where,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        dueDate: { lt: new Date() }
      }
    })

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: summaryStats._sum.amount || 0,
        totalPaid: summaryStats._sum.paidAmount || 0,
        totalCount: summaryStats._count.id,
        overdueCount: overduePayments
      }
    })
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
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

    const data = await request.json()
    const { studentId, feeTypeId, amount, dueDate, notes } = data

    if (!studentId || !feeTypeId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Student, fee type, amount, and due date are required' },
        { status: 400 }
      )
    }

    // Verify student and fee type exist
    const [student, feeType] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.feeType.findUnique({ where: { id: feeTypeId } })
    ])

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (!feeType) {
      return NextResponse.json(
        { error: 'Fee type not found' },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        feeTypeId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes,
        createdById: user.id,
        status: PaymentStatus.PENDING
      },
      include: {
        student: {
          include: { group: true }
        },
        feeType: true,
        createdBy: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Failed to create payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}