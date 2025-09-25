import { PrismaClient } from '@prisma/client'
import { PaymentStatus } from '../src/types'

const prisma = new PrismaClient()

async function createSampleData() {
  console.log('🌱 Creating sample data...')

  // Get admin user and groups
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@futbolokulu.com' }
  })

  if (!admin) {
    console.log('❌ Admin user not found. Run the main seed first.')
    return
  }

  const groups = await prisma.group.findMany()
  const feeTypes = await prisma.feeType.findMany()

  if (!groups.length || !feeTypes.length) {
    console.log('❌ Groups or fee types not found. Run the main seed first.')
    return
  }

  const u10Group = groups.find((g: any) => g.name === 'U10')
  const u12Group = groups.find((g: any) => g.name === 'U12')
  const monthlyFee = feeTypes.find((ft: any) => ft.name === 'Aylık Aidat')
  const registrationFee = feeTypes.find((ft: any) => ft.name === 'Kayıt Ücreti')

  // Create sample students with parents
  const sampleStudents = [
    {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '+90 555 111 2233',
      birthDate: new Date('2013-05-15'),
      groupId: u10Group?.id,
      parents: [
        {
          firstName: 'Mehmet',
          lastName: 'Yılmaz',
          phone: '+90 555 111 2234',
          email: 'mehmet.yilmaz@email.com',
          address: 'İstanbul, Kadıköy',
          relationship: 'Baba',
          isPrimary: true,
          isEmergency: false
        },
        {
          firstName: 'Ayşe',
          lastName: 'Yılmaz',
          phone: '+90 555 111 2235',
          email: 'ayse.yilmaz@email.com',
          address: 'İstanbul, Kadıköy',
          relationship: 'Anne',
          isPrimary: false,
          isEmergency: true
        }
      ]
    },
    {
      firstName: 'Elif',
      lastName: 'Demir',
      phone: '+90 555 222 3344',
      birthDate: new Date('2011-08-22'),
      groupId: u12Group?.id,
      parents: [
        {
          firstName: 'Ali',
          lastName: 'Demir',
          phone: '+90 555 222 3345',
          email: 'ali.demir@email.com',
          address: 'İstanbul, Üsküdar',
          relationship: 'Baba',
          isPrimary: true,
          isEmergency: true
        }
      ]
    },
    {
      firstName: 'Can',
      lastName: 'Öztürk',
      phone: '+90 555 333 4455',
      birthDate: new Date('2012-12-10'),
      groupId: u10Group?.id,
      parents: [
        {
          firstName: 'Fatma',
          lastName: 'Öztürk',
          phone: '+90 555 333 4456',
          email: 'fatma.ozturk@email.com',
          address: 'İstanbul, Beşiktaş',
          relationship: 'Anne',
          isPrimary: true,
          isEmergency: true
        }
      ]
    },
    {
      firstName: 'Zeynep',
      lastName: 'Kaya',
      phone: '+90 555 444 5566',
      birthDate: new Date('2012-03-18'),
      groupId: u12Group?.id,
      parents: [
        {
          firstName: 'Hasan',
          lastName: 'Kaya',
          phone: '+90 555 444 5567',
          email: 'hasan.kaya@email.com',
          address: 'İstanbul, Şişli',
          relationship: 'Baba',
          isPrimary: true,
          isEmergency: false
        },
        {
          firstName: 'Zehra',
          lastName: 'Kaya',
          phone: '+90 555 444 5568',
          email: 'zehra.kaya@email.com',
          address: 'İstanbul, Şişli',
          relationship: 'Anne',
          isPrimary: false,
          isEmergency: true
        }
      ]
    }
  ]

  // Create students and their parents
  const createdStudents = []
  for (const studentData of sampleStudents) {
    const { parents, ...studentInfo } = studentData

    const student = await prisma.student.create({
      data: {
        ...studentInfo,
        createdById: admin.id,
      }
    })

    // Create parents
    for (const parentData of parents) {
      await prisma.parent.create({
        data: {
          ...parentData,
          students: {
            connect: { id: student.id }
          }
        }
      })
    }

    createdStudents.push(student)
    console.log(`✅ Created student: ${student.firstName} ${student.lastName}`)
  }

  // Create sample payments
  if (monthlyFee && registrationFee) {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    for (const student of createdStudents) {
      // Registration fee (paid)
      await prisma.payment.create({
        data: {
          studentId: student.id,
          feeTypeId: registrationFee.id,
          amount: registrationFee.amount,
          dueDate: student.createdAt,
          paidDate: student.createdAt,
          paidAmount: registrationFee.amount,
          status: PaymentStatus.PAID,
          paymentMethod: 'CASH',
          createdById: admin.id,
        }
      })

      // Last month fee (paid)
      await prisma.payment.create({
        data: {
          studentId: student.id,
          feeTypeId: monthlyFee.id,
          amount: monthlyFee.amount,
          dueDate: lastMonth,
          paidDate: new Date(lastMonth.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after due
          paidAmount: monthlyFee.amount,
          status: PaymentStatus.PAID,
          paymentMethod: 'BANK_TRANSFER',
          createdById: admin.id,
        }
      })

      // This month fee (pending or partial)
      const isPartial = Math.random() > 0.5
      const isPaid = Math.random() > 0.7
      
      if (isPaid) {
        await prisma.payment.create({
          data: {
            studentId: student.id,
            feeTypeId: monthlyFee.id,
            amount: monthlyFee.amount,
            dueDate: thisMonth,
            paidDate: new Date(),
            paidAmount: monthlyFee.amount,
            status: PaymentStatus.PAID,
            paymentMethod: 'CASH',
            createdById: admin.id,
          }
        })
      } else if (isPartial) {
        const partialAmount = monthlyFee.amount * 0.5
        await prisma.payment.create({
          data: {
            studentId: student.id,
            feeTypeId: monthlyFee.id,
            amount: monthlyFee.amount,
            dueDate: thisMonth,
            paidDate: new Date(),
            paidAmount: partialAmount,
            status: PaymentStatus.PARTIAL,
            paymentMethod: 'CASH',
            createdById: admin.id,
          }
        })
      } else {
        // Check if overdue
        const isOverdue = thisMonth < today
        await prisma.payment.create({
          data: {
            studentId: student.id,
            feeTypeId: monthlyFee.id,
            amount: monthlyFee.amount,
            dueDate: thisMonth,
            status: isOverdue ? PaymentStatus.OVERDUE : PaymentStatus.PENDING,
            createdById: admin.id,
          }
        })
      }

      // Next month fee (pending)
      await prisma.payment.create({
        data: {
          studentId: student.id,
          feeTypeId: monthlyFee.id,
          amount: monthlyFee.amount,
          dueDate: nextMonth,
          status: PaymentStatus.PENDING,
          createdById: admin.id,
        }
      })
    }

    console.log(`✅ Created payment records for ${createdStudents.length} students`)
  }

  console.log('🎉 Sample data creation completed!')
}

createSampleData()
  .catch((e) => {
    console.error('❌ Sample data creation failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })