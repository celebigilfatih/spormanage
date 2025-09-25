import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { PaymentStatus, PaymentMethod } from '@/types'

async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  
  const payload = AuthService.verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({
    where: { id: payload.userId }
  })
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

    if (!AuthService.canManagePayments(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const paymentId = params.id
    const data = await request.json()
    const { 
      action, 
      paidAmount, 
      paymentMethod, 
      notes, 
      paidDate 
    } = data

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    if (action === 'record_payment') {
      const amount = paidAmount ? parseFloat(paidAmount) : payment.amount
      const currentPaid = payment.paidAmount || 0
      const newPaidAmount = currentPaid + amount

      updateData = {
        paidAmount: newPaidAmount,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        paymentMethod: paymentMethod || payment.paymentMethod,
        notes: notes ? `${payment.notes ? payment.notes + ' | ' : ''}${notes}` : payment.notes
      }

      // Determine new status
      if (newPaidAmount >= payment.amount) {
        updateData.status = PaymentStatus.PAID
      } else if (newPaidAmount > 0) {
        updateData.status = PaymentStatus.PARTIAL
      }

    } else if (action === 'mark_overdue') {
      updateData = {
        status: PaymentStatus.OVERDUE
      }

    } else if (action === 'cancel') {
      updateData = {
        status: PaymentStatus.CANCELLED,
        notes: notes ? `${payment.notes ? payment.notes + ' | ' : ''}CANCELLED: ${notes}` : payment.notes
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
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
      }
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Failed to update payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}