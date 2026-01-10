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

  // Create branches
  const branches = [
    { name: 'Karaman', address: 'Karaman, Bursa', phone: '+90 224 123 4567' },
    { name: 'Özlüce', address: 'Özlüce, Bursa', phone: '+90 224 765 4321' },
  ]

  const createdBranches = []
  for (const branchData of branches) {
    const branch = await prisma.branch.upsert({
      where: { name: branchData.name },
      update: {},
      create: branchData
    })
    createdBranches.push(branch)
    console.log(`✅ Branch created: ${branch.name}`)
  }

  // Create sample groups assigned to branches
  const groups = [
    { name: 'Karaman U10', description: 'Karaman 10 yaş altı futbol grubu', branchId: createdBranches.find(b => b.name === 'Karaman')?.id },
    { name: 'Karaman U12', description: 'Karaman 12 yaş altı futbol grubu', branchId: createdBranches.find(b => b.name === 'Karaman')?.id },
    { name: 'Özlüce U10', description: 'Özlüce 10 yaş altı futbol grubu', branchId: createdBranches.find(b => b.name === 'Özlüce')?.id },
    { name: 'Özlüce U12', description: 'Özlüce 12 yaş altı futbol grubu', branchId: createdBranches.find(b => b.name === 'Özlüce')?.id },
  ]

  const createdGroups = []
  for (const groupData of groups) {
    const group = await prisma.group.upsert({
      where: { name: groupData.name },
      update: { branchId: groupData.branchId },
      create: groupData
    })
    createdGroups.push(group)
    console.log(`✅ Group created: ${group.name}`)
  }

  // Create default fields (Sahalar)
  const defaultFields = [
    { id: 'Saha 1', name: 'Saha 1' },
    { id: 'Saha 2', name: 'Saha 2' },
    { id: 'Saha 3', name: 'Saha 3' },
    { id: 'Saha 4', name: 'Saha 4' },
  ]

  for (const fieldData of defaultFields) {
    const existingField = await prisma.field.findUnique({
      where: { id: fieldData.id }
    })

    if (!existingField) {
      await prisma.field.create({
        data: {
          id: fieldData.id,
          name: fieldData.name,
          isActive: true
        }
      })
      console.log(`✅ Default Field created: ${fieldData.name}`)
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
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!adminUser) {
    throw new Error('Admin user not found')
  }

  // Create 10 students for each group (Total 40)
  const firstNames = ['Ali', 'Ahmet', 'Mehmet', 'Mustafa', 'Can', 'Cem', 'Eren', 'Berk', 'Kerem', 'Furkan', 'Emre', 'Burak', 'Deniz', 'Mert', 'Kaan', 'Arda', 'Yiğit', 'Ege', 'Ömer', 'Zeynep', 'Elif', 'Defne', 'Hira', 'Eylül', 'Miray', 'Zehra', 'Azra', 'Ebrar', 'Yağmur']
  const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Aslan', 'Polat', 'Karaağaç', 'Kılıç', 'Koç', 'Kurt', 'Özkan', 'Şimşek']
  
  let studentTotalCount = 0
  for (const group of createdGroups) {
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      
      // Create parent
      const parent = await prisma.parent.create({
        data: {
          firstName: firstName.length % 2 === 0 ? 'Ayşe' : 'Fatma',
          lastName: lastName,
          phone: `+90 5${Math.floor(Math.random() * 900000000 + 100000000)}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
          relationship: 'veli',
          isPrimary: true
        }
      })

      // Create student
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - Math.floor(Math.random() * 5 + 8)) // 8-13 yaş
      
      await prisma.student.create({
        data: {
          firstName,
          lastName,
          phone: `+90 5${Math.floor(Math.random() * 900000000 + 100000000)}`,
          birthDate,
          groupId: group.id,
          branchId: group.branchId, // Set branch from group
          createdById: adminUser.id,
          parents: {
            connect: { id: parent.id }
          }
        }
      })
      
      studentTotalCount++
    }
    console.log(`✅ Created 10 students for group: ${group.name} (${group.branchId ? 'Has Branch' : 'No Branch'})`)
  }

  console.log(`✅ Total students created: ${studentTotalCount}`)
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