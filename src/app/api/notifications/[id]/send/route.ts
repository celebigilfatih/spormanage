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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
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

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.status === 'SENT') {
      return NextResponse.json(
        { error: 'Notification already sent' },
        { status: 400 }
      );
    }

    // Simulate sending notification based on method
    let success = false;
    let errorMessage = '';

    try {
      switch (notification.method) {
        case 'EMAIL':
          // Simulate email sending
          console.log('Sending email notification:', {
            to: notification.recipientEmail,
            subject: notification.title,
            body: notification.message
          });
          success = true;
          break;

        case 'SMS':
          // Simulate SMS sending
          console.log('Sending SMS notification:', {
            to: notification.recipientPhone,
            message: `${notification.title}: ${notification.message}`
          });
          success = true;
          break;

        case 'IN_APP':
          // In-app notifications are automatically "sent"
          success = true;
          break;

        default:
          errorMessage = 'Invalid notification method';
      }

      // Update notification status
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          status: success ? 'SENT' : 'FAILED',
          sentAt: success ? new Date() : null
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!success) {
        return NextResponse.json(
          { error: errorMessage || 'Failed to send notification' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        notification: updatedNotification,
        message: 'Notification sent successfully'
      });

    } catch (sendError) {
      console.error('Error sending notification:', sendError);
      
      // Update notification status to FAILED
      await prisma.notification.update({
        where: { id },
        data: { status: 'FAILED' }
      });

      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing send notification request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}