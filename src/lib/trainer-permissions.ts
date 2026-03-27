import { prisma } from '@/lib/prisma'

/**
 * Antrenör kullanıcısının erişebildiği grup ID'lerini döndürür
 */
export async function getTrainerGroupIds(userId: string): Promise<string[]> {
  const permissions = await prisma.userGroupPermission.findMany({
    where: { userId },
    select: { groupId: true }
  })
  return permissions.map(p => p.groupId)
}

/**
 * Antrenör kullanıcısının belirli bir gruba erişimi olup olmadığını kontrol eder
 */
export async function canAccessGroup(userId: string, groupId: string): Promise<boolean> {
  const permission = await prisma.userGroupPermission.findUnique({
    where: {
      userId_groupId: { userId, groupId }
    }
  })
  return !!permission
}

/**
 * Antrenör kullanıcısının şubesini döndürür
 */
export async function getTrainerBranchId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { branchId: true }
  })
  return user?.branchId || null
}

/**
 * Kullanıcının rolüne göre grup filtreleme koşulu oluşturur
 * ADMIN/SECRETARY/ACCOUNTING: tüm gruplar
 * TRAINER: sadece izinli gruplar
 */
export async function getGroupFilterForUser(userId: string, role: string): Promise<{ groupId?: { in: string[] } } | {}> {
  if (role === 'TRAINER') {
    const groupIds = await getTrainerGroupIds(userId)
    return { groupId: { in: groupIds } }
  }
  return {}
}

/**
 * Kullanıcının rolüne göre öğrenci filtreleme koşulu oluşturur
 * TRAINER: sadece izinli gruplardaki öğrenciler
 */
export async function getStudentFilterForUser(userId: string, role: string): Promise<{ groupId?: { in: string[] } } | {}> {
  if (role === 'TRAINER') {
    const groupIds = await getTrainerGroupIds(userId)
    return { groupId: { in: groupIds } }
  }
  return {}
}
