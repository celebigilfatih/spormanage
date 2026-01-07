import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/fields/[id] - Update a field
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { name, branchId, capacity, location } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Saha adı gereklidir' },
        { status: 400 }
      );
    }

    const field = await prisma.field.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        branchId: branchId || null,
        capacity: capacity ? parseInt(capacity) : null,
        location: location?.trim() || null
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error('Failed to update field:', error);
    return NextResponse.json(
      { error: 'Saha güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id] - Delete a field
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await prisma.field.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete field:', error);
    return NextResponse.json(
      { error: 'Saha silinemedi' },
      { status: 500 }
    );
  }
}
