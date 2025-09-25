import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    const groupHistory = await prisma.groupHistory.findMany({
      where: { studentId },
      include: {
        group: true
      },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json(groupHistory)
  } catch (error) {
    console.error('Failed to fetch group history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group history' },
      { status: 500 }
    )
  }
}