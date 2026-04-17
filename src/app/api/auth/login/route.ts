import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { checkLicense } from '@/lib/license'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre gereklidir' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.error('[LOGIN-DEBUG] User lookup for:', email, 'Found:', !!user)

    if (!user) {
      console.error('[LOGIN-DEBUG] User not found:', email)
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre', debug: 'user_not_found' },
        { status: 401 }
      )
    }

    console.error('[LOGIN-DEBUG] User found. Hash preview:', user.password.substring(0, 20))

    // Verify password
    const isPasswordValid = await AuthService.verifyPassword(password, user.password)
    
    console.error('[LOGIN-DEBUG] Password verification for:', email, 'Valid:', isPasswordValid, 'Input:', password)

    if (!isPasswordValid) {
      console.error('[LOGIN-DEBUG] Password verification FAILED')
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre', debug: 'password_invalid' },
        { status: 401 }
      )
    }

    console.error('[LOGIN-DEBUG] Password valid! Checking isActive...')

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Hesabınız aktif değil' },
        { status: 401 }
      )
    }

    // ── License check ──
    const license = await checkLicense()
    if (!license.valid) {
      const msg = license.suspended
        ? 'Lisansınız askıya alınmıştır. Lütfen yöneticinizle iletişime geçin.'
        : 'Lisans süreniz dolmuştur. Lütfen yenileme için iletişime geçin.'
      return NextResponse.json(
        { error: msg, licenseExpired: true },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    })

    // Create response with token in httpOnly cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      // License warning info (if near expiry)
      ...(license.warning && {
        licenseWarning: true,
        licenseDaysLeft: license.daysLeft,
      }),
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('[LOGIN-ERROR] Exception:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası', debug: String(error) },
      { status: 500 }
    )
  }
}