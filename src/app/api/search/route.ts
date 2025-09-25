import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await AuthService.verifyToken(token || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];

    // Search students
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true
      },
      include: {
        group: { select: { name: true } }
      },
      take: 5
    });

    students.forEach((student: any) => {
      results.push({
        id: `student-${student.id}`,
        type: 'student',
        title: `${student.firstName} ${student.lastName}`,
        description: `${student.group?.name || 'No Group'} • ${student.phone || 'No Phone'}`,
        url: `/students?search=${student.firstName}+${student.lastName}`
      });
    });

    // Search groups
    const groups = await prisma.group.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isActive: true
      },
      include: {
        _count: { select: { students: true } }
      },
      take: 3
    });

    groups.forEach((group: any) => {
      results.push({
        id: `group-${group.id}`,
        type: 'group',
        title: group.name,
        description: `${group._count.students} öğrenci`,
        url: `/groups/${group.id}`
      });
    });

    // Search payments by student name or amount
    if (!isNaN(Number(query))) {
      const payments = await prisma.payment.findMany({
        where: {
          amount: { equals: Number(query) }
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
          feeType: { select: { name: true } }
        },
        take: 3
      });

      payments.forEach((payment: any) => {
        results.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: `${payment.amount} TL - ${payment.feeType.name}`,
          description: `${payment.student.firstName} ${payment.student.lastName} • ${payment.status}`,
          url: `/payments?studentId=${payment.studentId}`
        });
      });
    }

    // Search trainings
    const trainings = await prisma.training.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        group: { select: { name: true } }
      },
      take: 3
    });

    trainings.forEach((training: any) => {
      results.push({
        id: `training-${training.id}`,
        type: 'training',
        title: training.name,
        description: `${training.group.name} • ${new Date(training.date).toLocaleDateString('tr-TR')}`,
        url: `/trainings`
      });
    });

    return NextResponse.json({ 
      results: results.slice(0, 10) // Limit to 10 results
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}