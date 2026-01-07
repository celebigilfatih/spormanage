import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

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
    const dateStr = searchParams.get('date');
    const groupId = searchParams.get('groupId');
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    let where: any = {};

    if (dateStr) {
      const date = new Date(dateStr);
      where.date = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      };
    } else if (monthStr && yearStr) {
      const month = parseInt(monthStr);
      const year = parseInt(yearStr);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end
      };
    }

    if (groupId) {
      where.groupId = groupId;
    }

    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        attendances: true,
        group: true
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch training sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
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

    if (action === 'generate') {
      const { groupId, startDate, endDate } = data;

      if (!groupId || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          trainingExceptions: true
        }
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      if (!group.trainingDays || group.trainingDays.length === 0) {
        return NextResponse.json(
          { error: 'Group has no training days defined' },
          { status: 400 }
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const sessionsToCreate = [];

      // Get existing sessions to avoid duplicates
      const existingSessions = await prisma.trainingSession.findMany({
        where: {
          groupId: groupId,
          date: {
            gte: start,
            lte: end
          }
        },
        select: { date: true }
      });

      const existingDates = new Set(
        existingSessions.map(s => s.date.toISOString().split('T')[0])
      );

      // Get exception dates for this period
      const exceptionDates = new Map(
        group.trainingExceptions
          .filter(ex => ex.date >= start && ex.date <= end)
          .map(ex => [ex.date.toISOString().split('T')[0], ex])
      );

      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = currentDate.toISOString().split('T')[0];
        
        if (group.trainingDays.includes(dayName) && !existingDates.has(dateStr)) {
          // Check if there's an exception for this date
          const exception = exceptionDates.get(dateStr);
          const isCancelled = exception?.type === 'CANCELLED';

          if (!isCancelled) {
            sessionsToCreate.push({
              groupId: groupId,
              date: new Date(currentDate),
              startTime: exception?.newStartTime || group.trainingStartTime || '09:00',
              endTime: exception?.newEndTime || group.trainingEndTime || '10:00',
              fieldId: exception?.newFieldId || group.fieldId,
              locationId: exception?.newLocationId || group.locationId,
              status: 'PLANNED' as const,
              exceptionId: exception?.id,
              generatedAutomatically: true
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (sessionsToCreate.length > 0) {
        await prisma.trainingSession.createMany({
          data: sessionsToCreate
        });
      }

      return NextResponse.json({
        success: true,
        generated: sessionsToCreate.length
      });
    }

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
    console.error('Failed to process training session:', error);
    return NextResponse.json(
      { error: 'Failed to process training session' },
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

    // Get all attendances for these students in this month
    const month = session.date.getMonth() + 1;
    const year = session.date.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const monthlyAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        session: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      },
      include: { session: true }
    });

    // Group attendances by student
    const studentAttendanceMap = new Map<string, any[]>();
    monthlyAttendances.forEach(att => {
      if (!studentAttendanceMap.has(att.studentId)) {
        studentAttendanceMap.set(att.studentId, []);
      }
      studentAttendanceMap.get(att.studentId)!.push(att);
    });

    // Update analytics for each student
    const studentEntries = Array.from(studentAttendanceMap.entries());
    for (const [studentId, attendances] of studentEntries) {
      // Calculate metrics
      const totalSessions = attendances.length;
      const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
      const absentCount = attendances.filter(a => a.status === 'ABSENT').length;
      const lateCount = attendances.filter(a => a.status === 'LATE').length;
      const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length;
      
      const attendancePercentage = totalSessions > 0 
        ? ((presentCount + excusedCount) / totalSessions) * 100 
        : 0;

      // Calculate consecutive absences
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
          studentId_month_year: {
            studentId,
            month,
            year
          }
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
