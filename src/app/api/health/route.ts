import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic system statistics
    const [
      userCount,
      studentCount,
      groupCount,
      paymentCount,
      trainingCount,
      notificationCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.group.count(),
      prisma.payment.count(),
      prisma.training.count(),
      prisma.notification.count()
    ]);

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        status: 'connected',
        statistics: {
          users: userCount,
          students: studentCount,
          groups: groupCount,
          payments: paymentCount,
          trainings: trainingCount,
          notifications: notificationCount
        }
      },
      services: {
        authentication: 'operational',
        notifications: 'operational',
        reports: 'operational'
      }
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected'
      }
    }, { status: 503 });
  }
}