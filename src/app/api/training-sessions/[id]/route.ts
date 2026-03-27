import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { canAccessGroup } from '@/lib/trainer-permissions';

async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  const payload = AuthService.verifyToken(token);
  if (!payload) return null;

  return await prisma.user.findUnique({
    where: { id: payload.userId }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        group: true,
        field: true,
        attendances: {
          include: {
            student: true
          }
        },
        exception: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // TRAINER rolü için: sadece izinli gruplardaki oturumları görebilir
    if (user.role === 'TRAINER') {
      const hasAccess = await canAccessGroup(user.id, session.groupId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Bu antrenman oturumuna erişim yetkiniz yok' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to fetch training session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the session exists
    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        attendances: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Delete related attendances first
    if (session.attendances.length > 0) {
      await prisma.attendance.deleteMany({
        where: { sessionId: id }
      });
    }

    // Delete the training session
    await prisma.trainingSession.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Training session deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete training session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { date, startTime, endTime, status, fieldId } = data;

    // Check if the session exists
    const session = await prisma.trainingSession.findUnique({
      where: { id }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Update the session
    const updatedSession = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(status && { status }),
        ...(fieldId !== undefined && { fieldId })
      },
      include: {
        group: true,
        field: true
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Failed to update training session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
