import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjkwIiBmaWxsPSIjMWU0MGFmIi8+PHRleHQgeD0iMTAwIiB5PSIxMjAiIGZvbnQtc2l6ZT0iNjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIj5GPC90ZXh0Pjwvc3ZnPg==';

// Ensure a settings row exists and return it
async function getOrCreateSettings() {
  let row = await prisma.systemSetting.findFirst();
  if (!row) {
    row = await prisma.systemSetting.create({
      data: {
        schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Futbol Okulu',
        schoolAddress: process.env.NEXT_PUBLIC_SCHOOL_ADDRESS || 'İstanbul, Türkiye',
        schoolPhone: process.env.NEXT_PUBLIC_SCHOOL_PHONE || '+90 212 555 0000',
        schoolEmail: process.env.NEXT_PUBLIC_SCHOOL_EMAIL || 'info@futbolokulu.com',
        schoolLogo: DEFAULT_LOGO,
      },
    });
  }
  return row;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const user = AuthService.verifyToken(token || '');

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const row = await getOrCreateSettings();
    return NextResponse.json(row);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const user = AuthService.verifyToken(token || '');

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const existing = await getOrCreateSettings();

    const updated = await prisma.systemSetting.update({
      where: { id: existing.id },
      data: {
        schoolName: body.schoolName ?? existing.schoolName,
        schoolAddress: body.schoolAddress ?? existing.schoolAddress,
        schoolPhone: body.schoolPhone ?? existing.schoolPhone,
        schoolEmail: body.schoolEmail ?? existing.schoolEmail,
        schoolLogo: body.schoolLogo !== undefined ? body.schoolLogo : existing.schoolLogo,
        currency: body.currency ?? existing.currency,
        timeZone: body.timeZone ?? existing.timeZone,
        language: body.language ?? existing.language,
        emailNotifications: body.emailNotifications ?? existing.emailNotifications,
        smsNotifications: body.smsNotifications ?? existing.smsNotifications,
        autoBackup: body.autoBackup ?? existing.autoBackup,
        backupFrequency: body.backupFrequency ?? existing.backupFrequency,
        sessionTimeout: body.sessionTimeout ?? existing.sessionTimeout,
      },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}