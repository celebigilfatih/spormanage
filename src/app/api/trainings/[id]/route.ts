import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params;

    // Check if training exists
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        sessions: {
          include: {
            _count: {
              select: { attendances: true }
            }
          }
        }
      }
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Delete associated attendances first (via sessions)
    for (const session of training.sessions) {
      if (session._count.attendances > 0) {
        await prisma.attendance.deleteMany({
          where: { sessionId: session.id }
        });
      }
    }

    // Delete sessions
    await prisma.trainingSession.deleteMany({
      where: { trainingId }
    });

    // Delete the training
    await prisma.training.delete({
      where: { id: trainingId }
    });

    return NextResponse.json({ message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting training:', error);
    return NextResponse.json(
      { error: 'Failed to delete training' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params;
    const body = await request.json();
    
    const { groupId, name, description, sessions } = body;

    // Check if training exists
    const existingTraining = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        sessions: true
      }
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Delete existing sessions
    await prisma.trainingSession.deleteMany({
      where: { trainingId }
    });

    // Update training with new sessions
    const updatedTraining = await prisma.training.update({
      where: { id: trainingId },
      data: {
        groupId,
        name,
        description,
        sessions: {
          create: sessions.map((session: any) => {
            const trainingDate = new Date(session.date);
            const [startHour, startMinute] = session.startTime.split(':').map(Number);
            const [endHour, endMinute] = session.endTime.split(':').map(Number);

            const startDateTime = new Date(trainingDate);
            startDateTime.setHours(startHour, startMinute, 0, 0);

            const endDateTime = new Date(trainingDate);
            endDateTime.setHours(endHour, endMinute, 0, 0);

            return {
              date: trainingDate,
              startTime: startDateTime,
              endTime: endDateTime,
              location: session.location,
              notes: session.notes
            };
          })
        }
      },
      include: {
        group: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        },
        sessions: {
          include: {
            _count: {
              select: { attendances: true }
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedTraining);
  } catch (error) {
    console.error('Error updating training:', error);
    return NextResponse.json(
      { error: 'Failed to update training' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params;

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: { students: true }
            }
          }
        },
        sessions: {
          include: {
            _count: {
              select: { attendances: true }
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(training);
  } catch (error) {
    console.error('Error fetching training:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training' },
      { status: 500 }
    );
  }
}