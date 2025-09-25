import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    // Get all pending scheduled notifications that are due
    const now = new Date();
    const dueNotifications = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: now
        }
      },
      include: {
        student: {
          include: {
            parents: {
              where: { isPrimary: true },
              select: { email: true, phone: true }
            }
          }
        }
      }
    });

    if (dueNotifications.length === 0) {
      return NextResponse.json({
        message: 'No due notifications found',
        processed: 0
      });
    }

    // Process each notification
    const results = {
      success: 0,
      failed: 0,
      total: dueNotifications.length
    };

    for (const notification of dueNotifications) {
      try {
        const success = await notificationService.sendNotification(notification.id);
        if (success) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: 'Scheduled notifications processed',
      results
    });
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled notifications' },
      { status: 500 }
    );
  }
}