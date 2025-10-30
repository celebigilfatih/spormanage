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
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = parseInt(searchParams.get('dateRange') || '30');
    const groupId = searchParams.get('groupId');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    // Build where clauses
    const groupWhere = groupId ? { groupId } : {};
    const dateWhere = { createdAt: { gte: startDate } };

    // Student Statistics
    const [totalStudents, activeStudents, newStudents] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { isActive: true, ...groupWhere } }),
      prisma.student.count({ 
        where: { 
          isActive: true, 
          ...groupWhere,
          ...dateWhere 
        } 
      })
    ]);

    // Students by group
    const studentsByGroup = await prisma.group.findMany({
      select: {
        name: true,
        _count: {
          select: {
            students: {
              where: { isActive: true }
            }
          }
        }
      },
      where: { isActive: true }
    });

    // Payment Statistics
    const payments = await prisma.payment.findMany({
      where: {
        student: groupId ? { groupId } : {},
        createdAt: { gte: startDate }
      },
      select: {
        amount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
        paidDate: true,
        createdAt: true
      }
    });

    const totalRevenue = payments
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);

    const monthlyRevenue = payments
      .filter((p: any) => {
        const paymentDate = p.paidDate || p.createdAt;
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return p.status === 'PAID' && paymentDate >= thisMonth;
      })
      .reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);

    const overdueAmount = payments
      .filter((p: any) => p.status === 'OVERDUE')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const paidThisMonth = payments
      .filter((p: any) => {
        const paymentDate = p.paidDate || p.createdAt;
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return p.status === 'PAID' && paymentDate >= thisMonth;
      })
      .reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);

    // Monthly revenue breakdown
    const monthlyBreakdown = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        student: groupId ? { groupId } : {},
        createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } // This year
      },
      _sum: {
        paidAmount: true
      }
    });

    const paymentsByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = new Date(new Date().getFullYear(), index, 1);
      const monthName = month.toLocaleDateString('tr-TR', { month: 'long' });
      const monthPayments = monthlyBreakdown.filter((p: any) => {
        const paymentMonth = new Date(p.createdAt).getMonth();
        return paymentMonth === index;
      });
      
      return {
        month: monthName,
        amount: monthPayments.reduce((sum: number, p: any) => sum + (p._sum.paidAmount || 0), 0)
      };
    });

    // Attendance Statistics
    const trainings = await prisma.training.findMany({
      where: {
        date: { gte: startDate },
        ...(groupId ? { groupId } : {})
      },
      include: {
        attendances: true,
        group: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    const totalSessions = trainings.length;
    const totalPossibleAttendances = trainings.reduce((sum: number, t: any) => sum + (t.group?._count?.students || 0), 0);
    const totalAttendances = trainings.reduce((sum: number, t: any) => sum + t.attendances.filter((a: any) => a.status === 'PRESENT').length, 0);
    const averageAttendanceRate = totalPossibleAttendances > 0 ? (totalAttendances / totalPossibleAttendances) * 100 : 0;

    // Attendance by group
    const attendanceByGroup = await prisma.group.findMany({
      where: { isActive: true },
      select: {
        name: true,
        trainings: {
          where: { date: { gte: startDate } },
          include: {
            attendances: {
              where: { status: 'PRESENT' }
            },
            _count: {
              select: { attendances: true }
            }
          }
        },
        _count: {
          select: { students: true }
        }
      }
    });

    const attendanceRatesByGroup = attendanceByGroup.map((group: any) => {
      const totalTrainings = group.trainings.length;
      const totalPossible = totalTrainings * group._count.students;
      const totalPresent = group.trainings.reduce((sum: number, t: any) => sum + t.attendances.length, 0);
      
      return {
        groupName: group.name,
        rate: totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0
      };
    });

    // Notification Statistics
    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(groupId ? { student: { groupId } } : {})
      },
      select: {
        status: true,
        type: true
      }
    });

    const totalSentNotifications = notifications.filter((n: any) => n.status === 'SENT').length;
    const failedNotifications = notifications.filter((n: any) => n.status === 'FAILED').length;
    const failureRate = notifications.length > 0 ? (failedNotifications / notifications.length) * 100 : 0;

    const notificationsByType = notifications.reduce((acc: any[], n: any) => {
      const existing = acc.find((item: any) => item.type === n.type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: n.type, count: 1 });
      }
      return acc;
    }, [] as Array<{ type: string; count: number }>);

    const reportData = {
      students: {
        total: totalStudents,
        active: activeStudents,
        byGroup: studentsByGroup.map((g: any) => ({
          groupName: g.name,
          count: g._count.students
        })),
        newThisMonth: newStudents
      },
      payments: {
        totalRevenue,
        monthlyRevenue,
        overdue: overdueAmount,
        paidThisMonth,
        byMonth: paymentsByMonth
      },
      attendance: {
        averageRate: averageAttendanceRate,
        totalSessions,
        attendanceByGroup: attendanceRatesByGroup
      },
      notifications: {
        totalSent: totalSentNotifications,
        failureRate,
        byType: notificationsByType
      }
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}