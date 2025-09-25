import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createGroupHistory() {
  console.log('🌱 Creating group history records...')

  // Get all students
  const students = await prisma.student.findMany({
    include: { group: true }
  })

  if (!students.length) {
    console.log('❌ No students found. Run the sample data seed first.')
    return
  }

  // Create group history for existing students
  for (const student of students) {
    if (student.groupId) {
      // Check if there's already a group history record
      const existingHistory = await prisma.groupHistory.findFirst({
        where: {
          studentId: student.id,
          groupId: student.groupId,
          endDate: null
        }
      })

      if (!existingHistory) {
        // Create initial group history record
        await prisma.groupHistory.create({
          data: {
            studentId: student.id,
            groupId: student.groupId,
            startDate: student.enrollmentDate,
            reason: 'Initial group assignment'
          }
        })

        console.log(`✅ Created group history for ${student.firstName} ${student.lastName}`)
      }
    }
  }

  // Simulate some transfers by creating historical records
  const groups = await prisma.group.findMany()
  
  if (groups.length >= 2 && students.length >= 2) {
    const student = students[0]
    const currentGroup = groups.find((g: any) => g.id === student.groupId)
    const otherGroup = groups.find((g: any) => g.id !== student.groupId)

    if (currentGroup && otherGroup) {
      // Create a historical transfer (simulate that this student was in another group before)
      const transferDate = new Date(student.enrollmentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days after enrollment

      // End the current group history
      await prisma.groupHistory.updateMany({
        where: {
          studentId: student.id,
          endDate: null
        },
        data: {
          endDate: transferDate,
          reason: 'Transferred due to skill level improvement'
        }
      })

      // Create new group history
      await prisma.groupHistory.create({
        data: {
          studentId: student.id,
          groupId: student.groupId,
          startDate: transferDate,
          reason: 'Transferred from previous group'
        }
      })

      console.log(`✅ Created transfer history for ${student.firstName} ${student.lastName}`)
    }
  }

  console.log('🎉 Group history creation completed!')
}

createGroupHistory()
  .catch((e) => {
    console.error('❌ Group history creation failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })