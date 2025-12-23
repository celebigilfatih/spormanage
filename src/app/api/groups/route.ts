import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        branchId: true,
        coachId: true,
        assistantCoachId: true,
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
        _count: {
          select: { students: true }
        }
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, coachId, assistantCoachId, branchId } = await request.json()

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
