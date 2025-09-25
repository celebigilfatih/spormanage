import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/lib/auth'
import { UserRole } from '../src/types'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminEmail = 'admin@futbolokulu.com'
  const adminPassword = 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await AuthService.hashPassword(adminPassword)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User',
        phone: '+90 555 123 4567',
        role: UserRole.ADMIN,
      }
    })

    console.log(`✅ Admin user created: ${admin.email}`)
  } else {
    console.log('✅ Admin user already exists')
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