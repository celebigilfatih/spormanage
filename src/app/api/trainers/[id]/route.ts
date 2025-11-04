import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trainer = await prisma.trainer.findUnique({
      where: { id }
    });

    if (!trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trainer);
  } catch (error) {
    console.error('Error fetching trainer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json();
    const { name, position, experience, license, photo, biography, isActive } = body;

    const trainer = await prisma.trainer.update({
      where: { id },
      data: {
        name,
        position,
        experience: parseInt(experience),
        license,
        photo,
        biography,
        isActive
      }
    });

    return NextResponse.json(trainer);
  } catch (error) {
    console.error('Error updating trainer:', error);
    return NextResponse.json(
      { error: 'Failed to update trainer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.trainer.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    return NextResponse.json(
      { error: 'Failed to delete trainer' },
      { status: 500 }
    );
  }
}
