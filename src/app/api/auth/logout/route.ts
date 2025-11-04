import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Başarıyla çıkış yapıldı' })
  
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: false, // Set to true only when using HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}