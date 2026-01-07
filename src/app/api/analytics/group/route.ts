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
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const groupId = searchParams.get('groupId');

    // 1. Determine which group to show (first active if none specified)
    let group;
    if (groupId) {
      group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { students: { where: { isActive: true } } }
      });
    } else {
      group = await prisma.group.findFirst({
        where: { isActive: true },
        include: { students: { where: { isActive: true } } }
      });
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 2. Fetch pre-calculated analytics for students in this group
    const studentIds = group.students.map(s => s.id);
    const analyticsRecords = await prisma.attendanceAnalytics.findMany({
      where: {
        studentId: { in: studentIds },
        month,
        year
      }
    });

    // 3. Map analytics to students, providing defaults for those without records
    const studentAnalytics = group.students.map(student => {
      const record = analyticsRecords.find(r => r.studentId === student.id);
      
      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        presentCount: record?.presentCount || 0,
        absentCount: record?.absentCount || 0,
        lateCount: record?.lateCount || 0,
        excusedCount: record?.excusedCount || 0,
        attendancePercentage: record?.attendancePercentage || 0,
        consecutiveAbsences: record?.consecutiveAbsences || 0,
        hasWarning: record?.hasWarning || false
      };
    });

    // 4. Calculate group average
    const studentsWithData = studentAnalytics.filter(s => s.presentCount + s.absentCount + s.lateCount + s.excusedCount > 0);
    const avgAttendance = studentsWithData.length > 0
      ? studentsWithData.reduce((sum, s) => sum + s.attendancePercentage, 0) / studentsWithData.length
      : 0;

    // 5. Get total sessions for the group in this month
    const totalSessions = await prisma.trainingSession.count({
      where: {
        groupId: group.id,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59, 999)
        },
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      month,
      year,
      totalSessions,
      avgAttendance,
      students: studentAnalytics
    });
  } catch (error) {
    console.error('Failed to fetch group analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
