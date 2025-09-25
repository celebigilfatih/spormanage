import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout']
  
  // API routes that don't require authentication
  const publicApiRoutes = ['/api/auth/login', '/api/auth/logout']

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // If accessing API route
  if (pathname.startsWith('/api/')) {
    if (publicApiRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // For pages, redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = AuthService.verifyToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}