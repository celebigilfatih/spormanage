import { NotificationMethod, NotificationType } from '@/types';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  method: NotificationMethod;
  recipientEmail?: string;
  recipientPhone?: string;
  studentName?: string;
}

export class NotificationService {
  // Email service configuration
  private static emailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    }
  };

  // SMS service configuration
  private static smsConfig = {
    apiKey: process.env.SMS_API_KEY || '',
    apiUrl: process.env.SMS_API_URL || '',
    sender: process.env.SMS_SENDER || 'FUTBOL_OKULU'
  };

  /**
   * Send a notification based on its method
   */
  static async sendNotification(notification: NotificationData): Promise<{
    success: boolean;
    error?: string;
    sentAt?: Date;
  }> {
    try {
      switch (notification.method) {
        case 'EMAIL':
          return await this.sendEmail(notification);
        case 'SMS':
          return await this.sendSMS(notification);
        case 'IN_APP':
          return { success: true, sentAt: new Date() }; // In-app notifications are handled by UI
        default:
          return { success: false, error: 'Unknown notification method' };
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmail(notification: NotificationData): Promise<{
    success: boolean;
    error?: string;
    sentAt?: Date;
  }> {
    if (!notification.recipientEmail) {
      return { success: false, error: 'No email address provided' };
    }

    // For development, we'll simulate email sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email Notification (Simulated):');
      console.log(`To: ${notification.recipientEmail}`);
      console.log(`Subject: ${notification.title}`);
      console.log(`Message: ${notification.message}`);
      console.log('---');
      
      // Simulate random failure (10% chance)
      if (Math.random() < 0.1) {
        return { success: false, error: 'Simulated email sending failure' };
      }
      
      return { success: true, sentAt: new Date() };
    }

    // Real email implementation would go here
    // Example with nodemailer:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter(this.emailConfig);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@futbolokulu.com',
      to: notification.recipientEmail,
      subject: notification.title,
      html: this.generateEmailTemplate(notification)
    };
    
    await transporter.sendMail(mailOptions);
    */

    return { success: true, sentAt: new Date() };
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(notification: NotificationData): Promise<{
    success: boolean;
    error?: string;
    sentAt?: Date;
  }> {
    if (!notification.recipientPhone) {
      return { success: false, error: 'No phone number provided' };
    }

    // For development, we'll simulate SMS sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 SMS Notification (Simulated):');
      console.log(`To: ${notification.recipientPhone}`);
      console.log(`Message: ${notification.message}`);
      console.log('---');
      
      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        return { success: false, error: 'Simulated SMS sending failure' };
      }
      
      return { success: true, sentAt: new Date() };
    }

    // Real SMS implementation would go here
    // Example with a Turkish SMS provider:
    /*
    const response = await fetch(this.smsConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.smsConfig.apiKey}`
      },
      body: JSON.stringify({
        sender: this.smsConfig.sender,
        recipient: notification.recipientPhone,
        message: notification.message
      })
    });
    
    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`);
    }
    */

    return { success: true, sentAt: new Date() };
  }

  /**
   * Generate HTML email template
   */
  private static generateEmailTemplate(notification: NotificationData): string {
    const studentInfo = notification.studentName ? `<p><strong>Öğrenci:</strong> ${notification.studentName}</p>` : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .type-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .type-payment { background: #fef3c7; color: #92400e; }
          .type-training { background: #dbeafe; color: #1e40af; }
          .type-general { background: #e5e7eb; color: #374151; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Futbol Okulu</h1>
            <span class="type-badge ${this.getTypeBadgeClass(notification.type)}">${this.getTypeLabel(notification.type)}</span>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            ${studentInfo}
            <p>${notification.message.replace(/\n/g, '<br>')}</p>
          </div>
          <div class="footer">
            <p>Bu mesaj Futbol Okulu Yönetim Sistemi tarafından gönderilmiştir.</p>
            <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getTypeBadgeClass(type: NotificationType): string {
    switch (type) {
      case 'PAYMENT_REMINDER':
      case 'PAYMENT_OVERDUE':
        return 'type-payment';
      case 'TRAINING_CANCELLED':
      case 'ATTENDANCE_REMINDER':
        return 'type-training';
      default:
        return 'type-general';
    }
  }

  private static getTypeLabel(type: NotificationType): string {
    const labels = {
      PAYMENT_REMINDER: 'Ödeme Hatırlatması',
      PAYMENT_OVERDUE: 'Geciken Ödeme',
      ATTENDANCE_REMINDER: 'Devamsızlık Uyarısı',
      GENERAL_ANNOUNCEMENT: 'Genel Duyuru',
      TRAINING_CANCELLED: 'Antrenman İptali'
    };
    return labels[type] || type;
  }

  /**
   * Create automatic payment reminder notifications
   */
  static async createPaymentReminders(): Promise<{
    created: number;
    errors: string[];
  }> {
    // This would be called by a scheduled job
    // Implementation would fetch overdue payments and create notifications
    return { created: 0, errors: [] };
  }

  /**
   * Create automatic attendance reminders
   */
  static async createAttendanceReminders(): Promise<{
    created: number;
    errors: string[];
  }> {
    // This would be called by a scheduled job
    // Implementation would fetch students with low attendance and create notifications
    return { created: 0, errors: [] };
  }
}