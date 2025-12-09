import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/lib/auth'
import { UserRole } from '../src/types'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user - read from environment or use defaults
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@futbolokulu.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin User'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    console.log(`📝 Creating admin user: ${adminEmail}`)
    const hashedPassword = await AuthService.hashPassword(adminPassword)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        phone: '+90 555 123 4567',
        role: UserRole.ADMIN,
      }
    })

    console.log(`✅ Admin user created: ${admin.email}`)
    console.log(`🔑 Login credentials: ${adminEmail} / ${adminPassword}`)
  } else {
    console.log(`✅ Admin user already exists: ${adminEmail}`)
  }

  // Create sample groups
  const groups = [
    { name: 'U10', description: '10 yaş altı futbol grubu' },
    { name: 'U12', description: '12 yaş altı futbol grubu' },
    { name: 'U14', description: '14 yaş altı futbol grubu' },
    { name: 'Başlangıç', description: 'Başlangıç seviyesi futbol grubu' },
    { name: 'İleri', description: 'İleri seviye futbol grubu' },
  ]

  for (const groupData of groups) {
    const existingGroup = await prisma.group.findUnique({
      where: { name: groupData.name }
    })

    if (!existingGroup) {
      await prisma.group.create({
        data: groupData
      })
      console.log(`✅ Group created: ${groupData.name}`)
    }
  }

  // Create sample fee types
  const feeTypes = [
    { 
      name: 'Aylık Aidat', 
      amount: 500, 
      period: 'MONTHLY' as const 
    },
    { 
      name: 'Kayıt Ücreti', 
      amount: 200, 
      period: 'ONE_TIME' as const 
    },
    { 
      name: 'Dönem Ücreti', 
      amount: 1500, 
      period: 'QUARTERLY' as const 
    },
  ]

  for (const feeTypeData of feeTypes) {
    const existingFeeType = await prisma.feeType.findFirst({
      where: { name: feeTypeData.name }
    })

    if (!existingFeeType) {
      await prisma.feeType.create({
        data: feeTypeData
      })
      console.log(`✅ Fee type created: ${feeTypeData.name}`)
    }
  }

  // Create sample trainers
  const trainers = [
    { 
      name: 'Ahmet Yılmaz', 
      position: 'Baş Antrenör',
      experience: 15,
      license: 'UEFA PRO'
    },
    { 
      name: 'Mehmet Demir', 
      position: 'Antrenör',
      experience: 10,
      license: 'UEFA A'
    },
    { 
      name: 'Ali Kaya', 
      position: 'Yardımcı Antrenör',
      experience: 5,
      license: 'UEFA B'
    },
    { 
      name: 'Fatma Özkan', 
      position: 'Kaleci Antrenörü',
      experience: 8,
      license: 'UEFA A'
    },
  ]

  for (const trainerData of trainers) {
    const existingTrainer = await prisma.trainer.findFirst({
      where: { name: trainerData.name }
    })

    if (!existingTrainer) {
      await prisma.trainer.create({
        data: trainerData
      })
      console.log(`✅ Trainer created: ${trainerData.name}`)
    }
  }

  // Get admin user for createdBy
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!admin) {
    throw new Error('Admin user not found')
  }

  // Create 10 students for each group
  const allGroups = await prisma.group.findMany()
  const firstNames = ['Ali', 'Ahmet', 'Mehmet', 'Mustafa', 'Can', 'Cem', 'Eren', 'Berk', 'Kerem', 'Furkan', 'Emre', 'Burak', 'Deniz', 'Mert', 'Kaan']
  const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Aslan', 'Polat', 'Karaağaç']
  
  let studentCount = 0
  for (const group of allGroups) {
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      
      // Create parent
      const parent = await prisma.parent.create({
        data: {
          firstName: firstName === 'Ali' ? 'Ayşe' : 'Fatma',
          lastName: lastName,
          phone: `+90 5${Math.floor(Math.random() * 900000000 + 100000000)}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          relationship: 'anne',
          isPrimary: true
        }
      })

      // Create student
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - Math.floor(Math.random() * 5 + 8)) // 8-13 yaş
      
      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          phone: `+90 5${Math.floor(Math.random() * 900000000 + 100000000)}`,
          birthDate,
          groupId: group.id,
          createdById: admin.id,
          parents: {
            connect: { id: parent.id }
          }
        }
      })
      
      studentCount++
    }
    console.log(`✅ Created 10 students for group: ${group.name}`)
  }

  console.log(`✅ Total students created: ${studentCount}`)
  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('Login credentials:')
  console.log('Email: admin@futbolokulu.com')
  console.log('Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })