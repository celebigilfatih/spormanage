import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// Get current user from token
async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  
  const payload = AuthService.verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({
    where: { id: payload.userId }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        group: true,
        parents: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            payments: true,
            notes: true,
            attendances: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Failed to fetch student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!AuthService.canManageStudents(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await request.json()
    const { 
      firstName, 
      lastName, 
      phone, 
      birthDate, 
      groupId, 
      isActive,
      parents 
    } = data

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      )
    }

    // Validate at least one parent is marked as primary if parents are provided
    if (parents && parents.length > 0) {
      const primaryParent = parents.find((p: any) => p.isPrimary)
      if (!primaryParent) {
        return NextResponse.json(
          { error: 'At least one parent must be marked as primary' },
          { status: 400 }
        )
      }
    }

    // Update student with parents in a transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update student basic info
      const student = await tx.student.update({
        where: { id },
        data: {
          firstName,
          lastName,
          phone,
          birthDate: birthDate ? new Date(birthDate) : null,
          groupId: groupId || null,
          isActive: isActive !== undefined ? isActive : true,
        }
      })

      // Handle parents update if provided
      if (parents && parents.length > 0) {
        // Get existing parents
        const existingParents = await tx.parent.findMany({
          where: {
            students: {
              some: {
                id
              }
            }
          }
        })

        // Delete all existing parent relationships
        for (const parent of existingParents) {
          await tx.parent.update({
            where: { id: parent.id },
            data: {
              students: {
                disconnect: { id }
              }
            }
          })
        }

        // Delete orphaned parents (parents with no students)
        for (const parent of existingParents) {
          const parentStudentCount = await tx.parent.findUnique({
            where: { id: parent.id },
            select: {
              _count: {
                select: { students: true }
              }
            }
          })
          
          if (parentStudentCount && parentStudentCount._count.students === 0) {
            await tx.parent.delete({
              where: { id: parent.id }
            })
          }
        }

        // Create or update parents
        for (const parentData of parents) {
          if (parentData.id) {
            // Update existing parent
            await tx.parent.update({
              where: { id: parentData.id },
              data: {
                firstName: parentData.firstName,
                lastName: parentData.lastName,
                phone: parentData.phone,
                email: parentData.email || null,
                address: parentData.address || null,
                relationship: parentData.relationship,
                isEmergency: parentData.isEmergency || false,
                isPrimary: parentData.isPrimary || false,
                students: {
                  connect: { id }
                }
              }
            })
          } else {
            // Create new parent
            await tx.parent.create({
              data: {
                firstName: parentData.firstName,
                lastName: parentData.lastName,
                phone: parentData.phone,
                email: parentData.email || null,
                address: parentData.address || null,
                relationship: parentData.relationship,
                isEmergency: parentData.isEmergency || false,
                isPrimary: parentData.isPrimary || false,
                students: {
                  connect: { id }
                }
              }
            })
          }
        }
      }

      return student
    })

    // Fetch the complete updated student data
    const completeStudent = await prisma.student.findUnique({
      where: { id: updatedStudent.id },
      include: {
        group: true,
        parents: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(completeStudent)
  } catch (error) {
    console.error('Failed to update student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!AuthService.canManageStudents(user.role as any)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Soft delete - just mark as inactive
    await prisma.student.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
