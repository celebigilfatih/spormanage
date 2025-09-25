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
    const { action, feeTypeId, studentIds, amount, dueDate, groupId } = data

    if (action === 'bulk_charge') {
      // Bulk charge operation
      if (!feeTypeId || !dueDate) {
        return NextResponse.json(
          { error: 'Fee type and due date are required for bulk charge' },
          { status: 400 }
        )
      }

      let targetStudentIds = studentIds

      // If groupId is provided, get all active students in that group
      if (groupId && !studentIds?.length) {
        const groupStudents = await prisma.student.findMany({
          where: {
            groupId,
            isActive: true
          },
          select: { id: true }
        })
        targetStudentIds = groupStudents.map((s: { id: string }) => s.id)
      }

      if (!targetStudentIds?.length) {
        return NextResponse.json(
          { error: 'No students selected for bulk charge' },
          { status: 400 }
        )
      }

      // Get fee type details
      const feeType = await prisma.feeType.findUnique({
        where: { id: feeTypeId }
      })

      if (!feeType) {
        return NextResponse.json(
          { error: 'Fee type not found' },
          { status: 404 }
        )
      }

      const paymentAmount = amount ? parseFloat(amount) : feeType.amount

      // Create payments for all selected students
      const payments = await prisma.$transaction(
        targetStudentIds.map((studentId: string) =>
          prisma.payment.create({
            data: {
              studentId,
              feeTypeId,
              amount: paymentAmount,
              dueDate: new Date(dueDate),
              createdById: user.id,
              status: PaymentStatus.PENDING
            }
          })
        )
      )

      return NextResponse.json({
        message: `Successfully created ${payments.length} payment records`,
        count: payments.length,
        payments: payments
      }, { status: 201 })

    } else if (action === 'bulk_collect') {
      // Bulk collection operation
      const { paymentIds, collectionDate, paymentMethod, notes } = data

      if (!paymentIds?.length) {
        return NextResponse.json(
          { error: 'No payments selected for bulk collection' },
          { status: 400 }
        )
      }

      // Update all selected payments
      const result = await prisma.$transaction(async (tx: typeof prisma) => {
        const updatedPayments = []
        
        for (const paymentId of paymentIds) {
          const payment = await tx.payment.findUnique({
            where: { id: paymentId }
          })

          if (!payment) continue

          const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: {
              paidDate: new Date(collectionDate || new Date()),
              paidAmount: payment.amount,
              paymentMethod: paymentMethod || null,
              status: PaymentStatus.PAID,
              notes: notes ? `${payment.notes ? payment.notes + ' | ' : ''}${notes}` : payment.notes
            },
            include: {
              student: {
                include: { group: true }
              },
              feeType: true
            }
          })

          updatedPayments.push(updatedPayment)
        }

        return updatedPayments
      })

      return NextResponse.json({
        message: `Successfully collected ${result.length} payments`,
        count: result.length,
        payments: result
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "bulk_charge" or "bulk_collect"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Bulk payment operation failed:', error)
    return NextResponse.json(
      { error: 'Bulk payment operation failed' },
      { status: 500 }
    )
  }
}