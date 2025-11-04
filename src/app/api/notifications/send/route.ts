import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await AuthService.verifyToken(token || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, sendImmediately = false } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const notificationId of notificationIds) {
      try {
        // Get notification details
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        });

        if (!notification) {
          results.errors.push(`Notification ${notificationId} not found`);
          results.failed++;
          continue;
        }

        // Check if already sent
        if (notification.status === 'SENT') {
          results.errors.push(`Notification ${notificationId} already sent`);
          results.failed++;
          continue;
        }

        // Check if scheduled for future and not forcing immediate send
        if (!sendImmediately && notification.scheduledAt && notification.scheduledAt > new Date()) {
          results.errors.push(`Notification ${notificationId} is scheduled for future`);
          results.failed++;
          continue;
        }

        // Prepare notification data
        const notificationData = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          method: notification.method,
          recipientEmail: notification.recipientEmail,
          recipientPhone: notification.recipientPhone || notification.student?.phone,
          studentName: notification.student ? `${notification.student.firstName} ${notification.student.lastName}` : undefined
        };

        // Send notification
        const sendResult = await NotificationService.sendNotification(notificationData);

        if (sendResult.success) {
          // Update notification status
          await prisma.notification.update({
            where: { id: notificationId },
            data: {
              status: 'SENT',
              sentAt: sendResult.sentAt || new Date()
            }
          });
          results.sent++;
        } else {
          // Update notification status to failed
          await prisma.notification.update({
            where: { id: notificationId },
            data: {
              status: 'FAILED'
            }
          });
          results.failed++;
          results.errors.push(`${notificationId}: ${sendResult.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${notificationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Processed ${notificationIds.length} notifications`,
      results
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}