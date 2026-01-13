import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const isActiveParam = searchParams.get('isActive')

    const where: any = {}
    if (branchId && branchId !== 'all') where.branchId = branchId
    
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }
    // Removed default isActive: true to see if it fixes the issue

    const groups = await prisma.group.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        branchId: true,
        coachId: true,
        assistantCoachId: true,
        trainingDays: true,
        trainingStartTime: true,
        trainingEndTime: true,
        trainingType: true,
        fieldId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        coach: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        assistantCoach: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        field: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { students: true }
        }
      }
    })

    console.log(`[API Groups] Found ${groups.length} groups for query:`, where)
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Detailed fetch groups error:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error)
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      description, 
      coachId, 
      assistantCoachId, 
      branchId,
      trainingDays,
      trainingStartTime,
      trainingEndTime,
      trainingType,
      fieldId
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch is required' },
        { status: 400 }
      )
    }

    const existingGroup = await prisma.group.findUnique({
      where: { name }
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group name already exists' },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        coachId: coachId || null,
        assistantCoachId: assistantCoachId || null,
        branchId: branchId || null,
        trainingDays: trainingDays || [],
        trainingStartTime: trainingStartTime || null,
        trainingEndTime: trainingEndTime || null,
        trainingType: trainingType || null,
        fieldId: fieldId || null,
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        assistantCoach: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        field: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Failed to create group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
