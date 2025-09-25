import { prisma } from './prisma';
import { NotificationType, NotificationMethod, NotificationStatus } from '@/types';

export async function seedNotifications() {
  console.log('🔔 Creating sample notifications...');

  try {
    // Get admin user and some students
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@futbolokulu.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found, skipping notification seeding');
      return;
    }

    const students = await prisma.student.findMany({
      take: 5,
      include: {
        parents: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });

    if (students.length === 0) {
      console.log('❌ No students found, skipping notification seeding');
      return;
    }

    const sampleNotifications = [
      // Payment reminder notifications
      {
        studentId: students[0].id,
        title: 'Aylık Aidat Hatırlatması',
        message: `Merhaba, ${students[0].firstName} ${students[0].lastName} için bu ayın aidat ödemesi henüz alınmamıştır. Lütfen en kısa sürede ödeme yapınız.`,
        type: NotificationType.PAYMENT_REMINDER,
        method: NotificationMethod.EMAIL,
        status: NotificationStatus.SENT,
        recipientEmail: students[0].email || students[0].parents[0]?.email,
        sentAt: new Date(),
        createdById: admin.id
      },
      {
        studentId: students[1].id,
        title: 'Geciken Ödeme Uyarısı',
        message: `${students[1].firstName} ${students[1].lastName} için geçen ay vadesi geçen ödeme bulunmaktadır. Lütfen acilen iletişime geçiniz.`,
        type: NotificationType.PAYMENT_OVERDUE,
        method: NotificationMethod.SMS,
        status: NotificationStatus.SENT,
        recipientPhone: students[1].phone || students[1].parents[0]?.phone,
        sentAt: new Date(),
        createdById: admin.id
      },
      // Training notifications
      {
        studentId: students[2].id,
        title: 'Antrenman İptali',
        message: `Yarın (${new Date().toLocaleDateString('tr-TR')}) planlanmış antrenman hava koşulları nedeniyle iptal edilmiştir.`,
        type: NotificationType.TRAINING_CANCELLED,
        method: NotificationMethod.IN_APP,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        createdById: admin.id
      },
      // Attendance reminder
      {
        studentId: students[3].id,
        title: 'Devamsızlık Uyarısı',
        message: `${students[3].firstName} ${students[3].lastName} son 2 antrenmana katılmamıştır. Lütfen durum hakkında bilgi veriniz.`,
        type: NotificationType.ATTENDANCE_REMINDER,
        method: NotificationMethod.EMAIL,
        status: NotificationStatus.PENDING,
        recipientEmail: students[3].email || students[3].parents[0]?.email,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdById: admin.id
      },
      // General announcement
      {
        title: 'Genel Duyuru - Yeni Sezon Başlıyor',
        message: 'Sevgili veliler, yeni futbol sezonu için kayıtlar başlamıştır. Detaylı bilgi için okul idaresi ile iletişime geçebilirsiniz.',
        type: NotificationType.GENERAL_ANNOUNCEMENT,
        method: NotificationMethod.EMAIL,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        createdById: admin.id
      },
      // Failed notification
      {
        studentId: students[4].id,
        title: 'Test Bildirimi',
        message: 'Bu bir test bildirimidir.',
        type: NotificationType.GENERAL_ANNOUNCEMENT,
        method: NotificationMethod.SMS,
        status: NotificationStatus.FAILED,
        recipientPhone: '555-invalid-number',
        createdById: admin.id
      }
    ];

    for (const notification of sampleNotifications) {
      await prisma.notification.create({
        data: notification
      });
    }

    console.log(`✅ Created ${sampleNotifications.length} sample notifications`);
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  }
}