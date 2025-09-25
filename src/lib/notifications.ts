import { prisma } from '@/lib/prisma';

export interface NotificationData {
  studentId?: string;
  title: string;
  message: string;
  type: 'PAYMENT_REMINDER' | 'PAYMENT_OVERDUE' | 'ATTENDANCE_REMINDER' | 'GENERAL_ANNOUNCEMENT' | 'TRAINING_CANCELLED';
  method: 'EMAIL' | 'SMS' | 'IN_APP';
  scheduledAt?: Date;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface SMSConfig {
  apiKey: string;
  apiSecret: string;
  from: string;
}

export class NotificationService {
  private emailConfig: EmailConfig | null = null;
  private smsConfig: SMSConfig | null = null;

  constructor(emailConfig?: EmailConfig, smsConfig?: SMSConfig) {
    this.emailConfig = emailConfig || null;
    this.smsConfig = smsConfig || null;
  }

  async createNotification(data: NotificationData, createdById: string) {
    try {
      // If studentId is provided, get student and parent information
      let recipientEmail = data.recipientEmail;
      let recipientPhone = data.recipientPhone;

      if (data.studentId && (!recipientEmail || !recipientPhone)) {
        const student = await prisma.student.findUnique({
          where: { id: data.studentId },
          include: {
            parents: {
              where: { isPrimary: true },
              select: { email: true, phone: true }
            }
          }
        });

        if (student && student.parents.length > 0) {
          const primaryParent = student.parents[0];
          recipientEmail = recipientEmail || primaryParent.email || undefined;
          recipientPhone = recipientPhone || primaryParent.phone || undefined;
        }
      }

      const notification = await prisma.notification.create({
        data: {
          studentId: data.studentId || null,
          title: data.title,
          message: data.message,
          type: data.type,
          method: data.method,
          scheduledAt: data.scheduledAt || null,
          recipientEmail,
          recipientPhone,
          createdById
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async sendNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          student: {
            include: {
              parents: {
                where: { isPrimary: true },
                select: { email: true, phone: true }
              }
            }
          }
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status === 'SENT') {
        throw new Error('Notification already sent');
      }

      let success = false;

      switch (notification.method) {
        case 'EMAIL':
          success = await this.sendEmail(notification);
          break;
        case 'SMS':
          success = await this.sendSMS(notification);
          break;
        case 'IN_APP':
          success = true; // In-app notifications are automatically "sent"
          break;
        default:
          throw new Error('Invalid notification method');
      }

      // Update notification status
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: success ? 'SENT' : 'FAILED',
          sentAt: success ? new Date() : null
        }
      });

      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Update notification status to FAILED
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' }
      });

      return false;
    }
  }

  private async sendEmail(notification: any): Promise<boolean> {
    try {
      if (!this.emailConfig) {
        console.log('Email configuration not provided, simulating email send');
        return this.simulateEmailSend(notification);
      }

      // TODO: Implement actual email sending with nodemailer
      console.log('Sending email notification:', {
        to: notification.recipientEmail,
        subject: notification.title,
        body: notification.message
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private async sendSMS(notification: any): Promise<boolean> {
    try {
      if (!this.smsConfig) {
        console.log('SMS configuration not provided, simulating SMS send');
        return this.simulateSMSSend(notification);
      }

      // TODO: Implement actual SMS sending with provider API
      console.log('Sending SMS notification:', {
        to: notification.recipientPhone,
        message: `${notification.title}: ${notification.message}`
      });

      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  private simulateEmailSend(notification: any): boolean {
    if (!notification.recipientEmail) {
      console.error('No recipient email provided');
      return false;
    }

    console.log(`📧 [SIMULATED EMAIL]`);
    console.log(`To: ${notification.recipientEmail}`);
    console.log(`Subject: ${notification.title}`);
    console.log(`Body: ${notification.message}`);
    console.log(`Sent at: ${new Date().toISOString()}`);
    
    return true;
  }

  private simulateSMSSend(notification: any): boolean {
    if (!notification.recipientPhone) {
      console.error('No recipient phone provided');
      return false;
    }

    console.log(`📱 [SIMULATED SMS]`);
    console.log(`To: ${notification.recipientPhone}`);
    console.log(`Message: ${notification.title}: ${notification.message}`);
    console.log(`Sent at: ${new Date().toISOString()}`);
    
    return true;
  }

  async sendBulkNotifications(notificationIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of notificationIds) {
      try {
        const result = await this.sendNotification(id);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error sending notification ${id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async scheduleNotification(data: NotificationData, createdById: string, scheduleDate: Date) {
    const notification = await this.createNotification({
      ...data,
      scheduledAt: scheduleDate
    }, createdById);

    return notification;
  }

  async getNotifications(filters?: {
    studentId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Helper methods for creating specific notification types
  async createPaymentReminder(studentId: string, amount: number, dueDate: Date, createdById: string) {
    return this.createNotification({
      studentId,
      title: 'Ödeme Hatırlatması',
      message: `${amount} TL tutarındaki ödemenizin son tarihi ${dueDate.toLocaleDateString('tr-TR')}. Lütfen ödemenizi zamanında yapınız.`,
      type: 'PAYMENT_REMINDER',
      method: 'SMS'
    }, createdById);
  }

  async createAttendanceReminder(studentId: string, trainingDate: Date, createdById: string) {
    return this.createNotification({
      studentId,
      title: 'Antrenman Hatırlatması',
      message: `${trainingDate.toLocaleDateString('tr-TR')} tarihinde antrenmanınız bulunmaktadır. Lütfen zamanında gelmeyiniz.`,
      type: 'ATTENDANCE_REMINDER',
      method: 'SMS'
    }, createdById);
  }

  async createGeneralAnnouncement(title: string, message: string, method: 'EMAIL' | 'SMS' | 'IN_APP', createdById: string) {
    return this.createNotification({
      title,
      message,
      type: 'GENERAL_ANNOUNCEMENT',
      method
    }, createdById);
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();