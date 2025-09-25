import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

// In a real application, these would be stored in a database
// For demo purposes, we'll use in-memory storage
let systemSettings = {
  schoolName: 'Futbol Okulu',
  schoolAddress: 'İstanbul, Türkiye',
  schoolPhone: '+90 212 555 0000',
  schoolEmail: 'info@futbolokulu.com',
  currency: 'TRY',
  timeZone: 'Europe/Istanbul',
  language: 'tr',
  emailNotifications: true,
  smsNotifications: false,
  autoBackup: true,
  backupFrequency: 'daily',
  sessionTimeout: 24
};

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await AuthService.verifyToken(token || '');
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(systemSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await AuthService.verifyToken(token || '');
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate and update settings
    systemSettings = {
      ...systemSettings,
      ...body,
      // Ensure required fields are present
      schoolName: body.schoolName || systemSettings.schoolName,
      currency: body.currency || systemSettings.currency,
      language: body.language || systemSettings.language,
      timeZone: body.timeZone || systemSettings.timeZone,
    };

    // In a real application, you would save to database here
    console.log('Settings updated:', systemSettings);

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: systemSettings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}