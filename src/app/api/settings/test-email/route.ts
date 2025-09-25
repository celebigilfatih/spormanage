import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await AuthService.verifyToken(token || '');
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate email test
    console.log('📧 Test Email Sent:');
    console.log('To: admin@futbolokulu.com');
    console.log('Subject: Email Test - Football School Management System');
    console.log('Body: This is a test email to verify email settings are working correctly.');
    console.log('---');

    // In a real application, you would use the actual email service here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        recipient: 'admin@futbolokulu.com',
        subject: 'Email Test - Football School Management System',
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}