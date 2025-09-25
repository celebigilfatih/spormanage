import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trainingId = params.id;

    // Check if training exists
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        _count: {
          select: { attendances: true }
        }
      }
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Delete associated attendances first
    if (training._count.attendances > 0) {
      await prisma.attendance.deleteMany({
        where: { trainingId }
      });
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const trainingId = params.id;
    const body = await request.json();
    
    const { groupId, name, description, date, startTime, endTime, location, status } = body;

    // Check if training exists
    const existingTraining = await prisma.training.findUnique({
      where: { id: trainingId }
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Parse date and time
    const trainingDate = new Date(date);
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');
    
    const startDateTime = new Date(trainingDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);
    
    const endDateTime = new Date(trainingDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);
    
    const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

    // Update training
    const updatedTraining = await prisma.training.update({
      where: { id: trainingId },
      data: {
        groupId,
        name,
        description,
        date: trainingDate,
        time: startTime,
        duration,
        location,
        status: status || 'SCHEDULED'
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: {
              select: { students: true }
            }
          }
        },
        _count: {
          select: { attendances: true }
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
  { params }: { params: { id: string } }
) {
  try {
    const trainingId = params.id;

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
            _count: {
              select: { students: true }
            }
          }
        },
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentNumber: true
              }
            }
          }
        },
        _count: {
          select: { attendances: true }
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