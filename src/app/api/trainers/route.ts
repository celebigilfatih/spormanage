import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const trainers = await prisma.trainer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        position: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(trainers)
  } catch (error) {
    console.error('Failed to fetch trainers:', error)
    return NextResponse.json({ error: 'Failed to fetch trainers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, position, experience, license, photo, biography } = data

    if (!name || !position || experience === undefined) {
      return NextResponse.json(
        { error: 'Name, position, and experience are required' },
        { status: 400 }
      )
    }

    const trainer = await prisma.trainer.create({
      data: {
        name,
        position,
        experience: parseInt(experience),
        license,
        photo,
        biography
      }
    })

    return NextResponse.json(trainer, { status: 201 })
  } catch (error) {
    console.error('Failed to create trainer:', error)
    return NextResponse.json(
      { error: 'Failed to create trainer' },
      { status: 500 }
    )
  }
}
