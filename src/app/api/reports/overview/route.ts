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
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const timeRange = searchParams.get('timeRange') || '30';

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // 1. Student Stats
    const studentWhere = groupId ? { groupId, isActive: true } : { isActive: true };
    const [totalStudents, activeStudents, newStudents] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.student.count({ where: { ...studentWhere, createdAt: { gte: startDate } } }),
      prisma.student.count({
        where: {
          ...studentWhere,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const studentsByGroup = await prisma.group.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: { select: { students: true } }
      }
    });

    // 2. Payment Stats
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(groupId ? { student: { groupId } } : {})
      },
      select: { amount: true, paidDate: true, status: true, dueDate: true }
    });

    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const paidThisMonth = payments.filter(
      p => p.paidDate && p.paidDate.getMonth() === new Date().getMonth()
    ).length;

    const overdueAmount = payments
      .filter(p => p.status === 'PENDING' && p.dueDate < new Date())
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // 3. Attendance Stats (New System)
    const trainingSessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startDate },
        ...(groupId ? { groupId } : {}),
        status: 'COMPLETED'
      },
      include: {
        attendances: true,
        group: { select: { name: true, _count: { select: { students: true } } } }
      }
    });

    const totalSessions = trainingSessions.length;
    const totalPossibleAttendances = trainingSessions.reduce((sum, s) => sum + (s.group?._count?.students || 0), 0);
    const totalPresent = trainingSessions.reduce(
      (sum, s) => sum + s.attendances.filter(a => a.status === 'PRESENT').length, 
      0
    );
    const averageAttendanceRate = totalPossibleAttendances > 0 ? (totalPresent / totalPossibleAttendances) * 100 : 0;

    // Group attendance rates
    const groupAttendanceMap = new Map<string, { present: number; possible: number }>();
    trainingSessions.forEach(s => {
      const name = s.group.name;
      const existing = groupAttendanceMap.get(name) || { present: 0, possible: 0 };
      groupAttendanceMap.set(name, {
        present: existing.present + s.attendances.filter(a => a.status === 'PRESENT').length,
        possible: existing.possible + s.group._count.students
      });
    });

    const attendanceByGroup = Array.from(groupAttendanceMap.entries()).map(([name, data]) => ({
      groupName: name,
      rate: data.possible > 0 ? (data.present / data.possible) * 100 : 0
    }));

    return NextResponse.json({
      students: {
        total: totalStudents,
        active: activeStudents,
        byGroup: studentsByGroup.map(g => ({ groupName: g.name, count: g._count.students })),
        newThisMonth: newStudents
      },
      payments: {
        totalRevenue,
        monthlyRevenue: 0, // Simplified for now
        overdue: overdueAmount,
        paidThisMonth,
        byMonth: []
      },
      attendance: {
        averageRate: averageAttendanceRate,
        totalSessions,
        attendanceByGroup
      },
      notifications: {
        totalSent: 0,
        failureRate: 0,
        byType: []
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
