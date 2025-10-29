import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { license: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    const [trainers, total] = await Promise.all([
      prisma.trainer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.trainer.count({ where })
    ])

    return NextResponse.json({
      trainers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch trainers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trainers' },
      { status: 500 }
    )
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
