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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (studentId) {
      where.studentId = studentId;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      type,
      method,
      studentId,
      scheduledAt,
      recipientEmail,
      recipientPhone
    } = body;

    // Validation
    if (!title || !message || !type || !method) {
      return NextResponse.json(
        { error: 'Title, message, type, and method are required' },
        { status: 400 }
      );
    }

    // If studentId is provided, validate it exists
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          parents: {
            where: { isPrimary: true },
            select: { email: true, phone: true }
          }
        }
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      // Auto-fill recipient info from student's primary parent if not provided
      if (!recipientEmail && student.parents[0]?.email) {
        body.recipientEmail = student.parents[0].email;
      }
      if (!recipientPhone && student.parents[0]?.phone) {
        body.recipientPhone = student.parents[0].phone;
      }
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        method,
        studentId: studentId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        recipientEmail: body.recipientEmail || null,
        recipientPhone: body.recipientPhone || null,
        createdById: user.id
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

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}