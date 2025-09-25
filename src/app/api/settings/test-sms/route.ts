import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await AuthService.verifyToken(token || '');
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate SMS test
    console.log('📱 Test SMS Sent:');
    console.log('To: +90 555 123 4567');
    console.log('Message: Bu bir test mesajıdır. Futbol Okulu Yönetim Sistemi SMS ayarları çalışıyor.');
    console.log('---');

    // In a real application, you would use the actual SMS service here
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      details: {
        recipient: '+90 555 123 4567',
        message: 'Bu bir test mesajıdır. Futbol Okulu Yönetim Sistemi SMS ayarları çalışıyor.',
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send test SMS' },
      { status: 500 }
    );
  }
}