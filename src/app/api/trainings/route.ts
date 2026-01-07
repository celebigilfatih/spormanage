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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const groupId = searchParams.get('groupId');

    let where: any = {};
    if (groupId) {
      where.groupId = groupId;
    }

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coach: { select: { id: true, name: true } },
              _count: { select: { students: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.training.count({ where })
    ]);

    return NextResponse.json({
      trainings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch trainings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
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
    const { groupId, name, description } = data;

    if (!groupId || !name) {
      return NextResponse.json(
        { error: 'Group and name are required' },
        { status: 400 }
      );
    }

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Create training
    const training = await prisma.training.create({
      data: {
        groupId,
        name,
        description
      },
      include: {
        group: true
      }
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error('Failed to create training:', error);
    return NextResponse.json(
      { error: 'Failed to create training' },
      { status: 500 }
    );
  }
}
