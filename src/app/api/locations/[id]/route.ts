import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/locations/[id] - Update a location
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { name, address, city, district } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Lokasyon adı gereklidir' },
        { status: 400 }
      );
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        district: district?.trim() || null
      }
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Failed to update location:', error);
    return NextResponse.json(
      { error: 'Lokasyon güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Delete a location
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await prisma.location.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete location:', error);
    return NextResponse.json(
      { error: 'Lokasyon silinemedi' },
      { status: 500 }
    );
  }
}
