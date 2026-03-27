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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId');

    let where: any = {};

    if (sessionId) {
      where.sessionId = sessionId;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: true,
        session: true,
        markedByUser: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Failed to fetch attendances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { action } = data;

    if (action === 'mark_attendance') {
      const { sessionId, attendance } = data;

      if (!sessionId || !attendance || !Array.isArray(attendance)) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const session = await prisma.trainingSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Training session not found' },
          { status: 404 }
        );
      }

      // TRAINER rolü için: gruba erişim kontrolü
      if (user.role === 'TRAINER') {
        const hasAccess = await canAccessGroup(user.id, session.groupId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Bu grubun yoklamasına erişim yetkiniz yok' },
            { status: 403 }
          );
        }
      }

      await prisma.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          attendanceTaken: true,
          attendanceTakenAt: new Date()
        }
      });

      const results = [];
      for (const record of attendance) {
        const { studentId, status, notes } = record;
        
        const attendanceRecord = await prisma.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: sessionId,
              studentId: studentId
            }
          },
          update: {
            status: status,
            notes: notes || null,
            markedBy: user.id,
            markedAt: new Date()
          },
          create: {
            sessionId: sessionId,
            studentId: studentId,
            status: status,
            notes: notes || null,
            markedBy: user.id,
            markedAt: new Date()
          }
        });
        
        results.push(attendanceRecord);
      }

      // Trigger analytics update (fire and forget)
      updateAttendanceAnalytics(sessionId);

      return NextResponse.json({
        success: true,
        marked: results.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process attendance:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance' },
      { status: 500 }
    );
  }
}

async function updateAttendanceAnalytics(sessionId: string) {
  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        attendances: true,
        group: {
          include: { students: true }
        }
      }
    });

    if (!session) return;

    const studentIds = session.group.students.map(s => s.id);

    const month = session.date.getMonth() + 1;
    const year = session.date.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const monthlyAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        session: {
          date: { gte: startOfMonth, lte: endOfMonth }
        }
      },
      include: { session: true }
    });

    const studentAttendanceMap = new Map<string, any[]>();
    monthlyAttendances.forEach(att => {
      if (!studentAttendanceMap.has(att.studentId)) {
        studentAttendanceMap.set(att.studentId, []);
      }
      studentAttendanceMap.get(att.studentId)!.push(att);
    });

    const studentEntries = Array.from(studentAttendanceMap.entries());
    for (const [studentId, attendances] of studentEntries) {
      const totalSessions = attendances.length;
      const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
      const absentCount = attendances.filter(a => a.status === 'ABSENT').length;
      const lateCount = attendances.filter(a => a.status === 'LATE').length;
      const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length;
      
      const attendancePercentage = totalSessions > 0 
        ? ((presentCount + excusedCount) / totalSessions) * 100 
        : 0;

      let consecutiveAbsences = 0;
      const recentSessions = await prisma.trainingSession.findMany({
        where: {
          groupId: session.groupId,
          date: { lte: session.date },
          status: 'COMPLETED'
        },
        orderBy: { date: 'desc' },
        take: 10
      });

      for (const recentSession of recentSessions) {
        const recentAttendance = attendances.find(a => a.sessionId === recentSession.id);
        if (recentAttendance && recentAttendance.status === 'ABSENT') {
          consecutiveAbsences++;
        } else if (recentAttendance) {
          break;
        }
      }

      const hasWarning = consecutiveAbsences >= 3;

      await prisma.attendanceAnalytics.upsert({
        where: {
          studentId_month_year: { studentId, month, year }
        },
        update: {
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendancePercentage,
          consecutiveAbsences,
          hasWarning,
          updatedAt: new Date()
        },
        create: {
          studentId,
          month,
          year,
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendancePercentage,
          consecutiveAbsences,
          hasWarning
        }
      });
    }
  } catch (error) {
    console.error('Failed to update analytics:', error);
  }
}