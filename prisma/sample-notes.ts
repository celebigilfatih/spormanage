import { PrismaClient } from '@prisma/client'
import { NoteType } from '../src/types'

const prisma = new PrismaClient()

async function createSampleNotes() {
  console.log('🌱 Creating sample notes...')

  // Get admin user and students
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@futbolokulu.com' }
  })

  const students = await prisma.student.findMany({
    take: 4 // Get first 4 students
  })

  if (!admin || !students.length) {
    console.log('❌ Admin user or students not found. Run the previous seeds first.')
    return
  }

  const sampleNotes = [
    {
      studentId: students[0].id,
      title: 'First Training Session',
      content: 'Student showed great enthusiasm during the first training session. Good ball control and listening skills. Needs to work on passing accuracy.',
      type: NoteType.GENERAL,
      isPinned: true,
      isImportant: false
    },
    {
      studentId: students[0].id,
      title: 'Payment Reminder',
      content: 'Parent mentioned they will pay the monthly fee by next week. Follow up on Friday.',
      type: NoteType.PAYMENT,
      isPinned: false,
      isImportant: true
    },
    {
      studentId: students[1].id,
      title: 'Minor Injury Report',
      content: 'Student twisted ankle during training. Applied ice and rest. Parent informed. Should be fine for next session but monitor closely.',
      type: NoteType.HEALTH,
      isPinned: true,
      isImportant: true
    },
    {
      studentId: students[1].id,
      title: 'Excellent Progress',
      content: 'Remarkable improvement in shooting technique. Scored 3 goals in practice match. Consider moving to advanced group next month.',
      type: NoteType.ACADEMIC,
      isPinned: false,
      isImportant: false
    },
    {
      studentId: students[2].id,
      title: 'Behavioral Issue',
      content: 'Student was disruptive during training, not following instructions. Spoke with parent after session. Need to monitor behavior in upcoming sessions.',
      type: NoteType.BEHAVIOR,
      isPinned: false,
      isImportant: true
    },
    {
      studentId: students[2].id,
      title: 'Team Captain Material',
      content: 'Shows natural leadership qualities. Helps other students and encourages team spirit. Could be a good candidate for team captain role.',
      type: NoteType.GENERAL,
      isPinned: true,
      isImportant: false
    },
    {
      studentId: students[3].id,
      title: 'Parent Meeting',
      content: 'Met with parent to discuss training schedule. They are very supportive and want to increase training frequency. Discussed options for additional coaching.',
      type: NoteType.GENERAL,
      isPinned: false,
      isImportant: false
    },
    {
      studentId: students[3].id,
      title: 'Diet Recommendations',
      content: 'Parent asked about nutrition advice. Provided basic guidelines for young athletes. Recommended consulting with sports nutritionist for detailed plan.',
      type: NoteType.HEALTH,
      isPinned: false,
      isImportant: false
    }
  ]

  // Create notes
  for (const noteData of sampleNotes) {
    await prisma.note.create({
      data: {
        ...noteData,
        createdById: admin.id,
      }
    })
  }

  console.log(`✅ Created ${sampleNotes.length} sample notes`)
  console.log('🎉 Sample notes creation completed!')
}

createSampleNotes()
  .catch((e) => {
    console.error('❌ Sample notes creation failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })