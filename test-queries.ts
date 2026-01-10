import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing api/groups query...')
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
    console.log('Groups fetch successful, count:', groups.length)

    const targetId = 'cmk53xrke001or14ge5p5yrv5'
    console.log(`\nTesting api/students/${targetId} query...`)
    const student = await prisma.student.findUnique({
      where: { id: targetId },
      include: {
        group: true,
        branch: true,
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
    if (student) {
      console.log('Student fetch successful, id:', student.id)
    } else {
      console.log('Student not found:', targetId)
      
      // Try finding ANY student to see if the query works at all with the same include
      const anyStudent = await prisma.student.findFirst({
        include: {
          group: true,
          branch: true,
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
      if (anyStudent) {
        console.log('Any student fetch successful, id:', anyStudent.id)
      }
    }

  } catch (error) {
    console.error('Query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
