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
    const search = searchParams.get('search') || ''
    const sortField = searchParams.get('sortField') || 'dueDate'
    const sortDirection = searchParams.get('sortDirection') || 'asc'

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

    // Search by student name
    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (overdue) {
      where.AND = [
        { status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } },
        { dueDate: { lt: new Date() } }
      ]
    }

    // Determine sorting
    let orderBy: any = { dueDate: 'asc' }
    if (sortField === 'amount') {
      orderBy = { amount: sortDirection }
    } else if (sortField === 'dueDate') {
      orderBy = { dueDate: sortDirection }
    } else if (sortField === 'student') {
      orderBy = {
        student: {
          lastName: sortDirection
        }
      }
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
        orderBy
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
    const { studentId, feeTypeId, amount, installmentCount = 1, startDate, notes } = data

    if (!studentId || !feeTypeId || !amount || !startDate) {
      return NextResponse.json(
        { error: 'Student, fee type, amount, and start date are required' },
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

    const paymentAmount = parseFloat(amount)
    const numInstallments = parseInt(installmentCount) || 1
    const baseDate = new Date(startDate)

    // Generate a unique plan ID for grouping installments
    const planId = `PLAN_${Date.now()}_${studentId.substring(0, 8)}`

    // Calculate interval based on fee period
    let monthsInterval = 1
    switch (feeType.period) {
      case 'MONTHLY':
        monthsInterval = 1
        break
      case 'QUARTERLY':
        monthsInterval = 3
        break
      case 'YEARLY':
        monthsInterval = 12
        break
      case 'ONE_TIME':
        monthsInterval = 1
        break
      default:
        monthsInterval = 1
    }

    // Create multiple payment records
    const payments = []
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(dueDate.getMonth() + (i * monthsInterval))
      
      payments.push({
        studentId,
        feeTypeId,
        amount: paymentAmount,
        dueDate,
        notes: numInstallments > 1 
          ? `${notes ? notes + ' - ' : ''}${planId} - Vade ${i + 1}/${numInstallments}` 
          : notes,
        createdById: user.id,
        status: PaymentStatus.PENDING,
        referenceNumber: numInstallments > 1 ? planId : null
      })
    }

    // Create all payments in a transaction
    const createdPayments = await prisma.$transaction(
      payments.map(payment => 
        prisma.payment.create({
          data: payment,
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
      )
    )

    return NextResponse.json({
      message: `${createdPayments.length} ödeme kaydı oluşturuldu`,
      count: createdPayments.length,
      planId: numInstallments > 1 ? planId : null,
      payments: createdPayments
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const groupId = searchParams.get('groupId')
    const overdue = searchParams.get('overdue') === 'true'
    const search = searchParams.get('search') || ''

    const where: any = {}

    // Target only non-cancelled payments by default
    where.status = { not: PaymentStatus.CANCELLED }

    if (status && status !== 'all') {
      where.status = status
    }

    if (groupId && groupId !== 'all') {
      where.student = { groupId }
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (overdue) {
      where.AND = [
        { status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } },
        { dueDate: { lt: new Date() } }
      ]
    }

    const result = await prisma.payment.updateMany({
      where,
      data: {
        status: PaymentStatus.CANCELLED,
        notes: `CANCELLED (bulk) by ${user.name}`
      }
    })

    return NextResponse.json({
      message: 'Payments cancelled successfully',
      count: result.count
    })
  } catch (error) {
    console.error('Failed to bulk cancel payments:', error)
    return NextResponse.json(
      { error: 'Failed to bulk cancel payments' },
      { status: 500 }
    )
  }
}