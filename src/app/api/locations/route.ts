import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/locations - List all locations
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

    const locations = await prisma.location.findMany({
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
            trainingSessions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json(
      { error: 'Lokasyonlar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, branchId, address, city, district, phone } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Lokasyon adı gereklidir' },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        branchId: branchId || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        district: district?.trim() || null,
        phone: phone?.trim() || null,
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

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Failed to create location:', error);
    return NextResponse.json(
      { error: 'Lokasyon oluşturulamadı' },
      { status: 500 }
    );
  }
}
