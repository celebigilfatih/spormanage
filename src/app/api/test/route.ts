import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'basic';

    switch (testType) {
      case 'auth':
        return testAuth();
      case 'database':
        return testDatabase();
      case 'permissions':
        return testPermissions(request);
      default:
        return testBasic();
    }
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testBasic() {
  return NextResponse.json({
    success: true,
    message: 'Football School Management System API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      students: '/api/students',
      payments: '/api/payments',
      trainings: '/api/trainings',
      notifications: '/api/notifications',
      reports: '/api/reports/overview'
    }
  });
}

async function testAuth() {
  try {
    // Test token generation and verification
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'ADMIN' as any,
      name: 'Test User'
    };

    const token = AuthService.generateToken(testPayload);
    const verifiedPayload = AuthService.verifyToken(token);

    return NextResponse.json({
      success: true,
      message: 'Authentication system working correctly',
      test: {
        tokenGenerated: !!token,
        tokenVerified: !!verifiedPayload,
        payloadMatch: verifiedPayload?.userId === testPayload.userId
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Authentication test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testDatabase() {
  try {
    // Test basic database operations
    const tests = {
      connection: false,
      userQuery: false,
      studentQuery: false,
      groupQuery: false
    };

    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    tests.connection = true;

    // Test table queries
    const userCount = await prisma.user.count();
    tests.userQuery = true;

    const studentCount = await prisma.student.count();
    tests.studentQuery = true;

    const groupCount = await prisma.group.count();
    tests.groupQuery = true;

    return NextResponse.json({
      success: true,
      message: 'Database tests passed',
      tests,
      statistics: {
        users: userCount,
        students: studentCount,
        groups: groupCount
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testPermissions(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No authorization token provided for permission test'
      }, { status: 401 });
    }

    const user = AuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid token for permission test'
      }, { status: 401 });
    }

    const permissions = {
      canManagePayments: AuthService.canManagePayments(user.role),
      canManageStudents: AuthService.canManageStudents(user.role),
      canManageTraining: AuthService.canManageTraining(user.role),
      isAdmin: AuthService.isAdmin(user.role)
    };

    return NextResponse.json({
      success: true,
      message: 'Permission test completed',
      user: {
        role: user.role,
        name: user.name
      },
      permissions
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Permission test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}