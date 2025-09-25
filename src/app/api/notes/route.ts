import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { NoteType } from '@/types'

async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  
  const payload = AuthService.verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({
    where: { id: payload.userId }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type')
    const pinned = searchParams.get('pinned') === 'true'
    const important = searchParams.get('important') === 'true'

    const skip = (page - 1) * limit
    const where: any = {}

    if (studentId && studentId !== 'all') {
      where.studentId = studentId
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (pinned) {
      where.isPinned = true
    }

    if (important) {
      where.isImportant = true
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              group: true
            }
          },
          createdBy: {
            select: { 
              id: true, 
              name: true, 
              email: true 
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { isImportant: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.note.count({ where })
    ])

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { 
      studentId, 
      title, 
      content, 
      type = NoteType.GENERAL,
      isPinned = false,
      isImportant = false 
    } = data

    if (!studentId || !title || !content) {
      return NextResponse.json(
        { error: 'Student, title, and content are required' },
        { status: 400 }
      )
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const note = await prisma.note.create({
      data: {
        studentId,
        title,
        content,
        type,
        isPinned,
        isImportant,
        createdById: user.id,
      },
      include: {
        student: {
          include: {
            group: true
          }
        },
        createdBy: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          }
        }
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}