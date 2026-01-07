import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/fields - List all fields
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const fields = await prisma.field.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            trainingSessions: true,
            groups: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error('Failed to fetch fields:', error);
    return NextResponse.json(
      { error: 'Sahalar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST /api/fields - Create a new field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, branchId, capacity, location } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Saha adı gereklidir' },
        { status: 400 }
      );
    }

    const field = await prisma.field.create({
      data: {
        name: name.trim(),
        branchId: branchId || null,
        capacity: capacity ? parseInt(capacity) : null,
        location: location?.trim() || null,
        isActive: true
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

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error('Failed to create field:', error);
    return NextResponse.json(
      { error: 'Saha oluşturulamadı' },
      { status: 500 }
    );
  }
}
