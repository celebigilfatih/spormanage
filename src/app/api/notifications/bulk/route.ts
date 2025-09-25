import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// Get current user from token
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, action } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    if (!action || !['send', 'cancel', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (send, cancel, delete)' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'send':
        // Update status to SENT and set sentAt timestamp
        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            status: 'PENDING'
          },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });
        break;

      case 'cancel':
        // Update status to CANCELLED
        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });
        break;

      case 'delete':
        // Delete notifications (only CANCELLED or FAILED ones)
        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            status: { in: ['CANCELLED', 'FAILED'] }
          }
        });
        break;
    }

    return NextResponse.json({
      success: true,
      affectedRows: result.count,
      action
    });
  } catch (error) {
    console.error('Error performing bulk notification operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}