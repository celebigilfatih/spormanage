'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Futbol Okulu Aidat Takip Sistemi</h1>
          <p className="text-lg text-gray-600">Yükleniyor...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Futbol Okulu Aidat Takip Sistemi
        </h1>
        <p className="text-center text-lg text-gray-600 mb-8">
          Öğrenci aidat ve devamsızlık takibinin yönetileceği web uygulaması
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">👥 Öğrenci Yönetimi</h3>
            <p className="text-gray-600">Öğrenci ve veli bilgileri, grup yönetimi</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">💰 Aidat Takibi</h3>
            <p className="text-gray-600">Toplu borçlandırma, tahsilat işlemleri</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📋 Devamsızlık</h3>
            <p className="text-gray-600">Antrenman takibi ve devamsızlık raporları</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📝 Notlar</h3>
            <p className="text-gray-600">Öğrenci bazlı notlar ve iletişim</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🔔 Bildirimler</h3>
            <p className="text-gray-600">E-posta, SMS ve uygulama içi bildirimler</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📊 Raporlama</h3>
            <p className="text-gray-600">Detaylı raporlar ve dışa aktarım</p>
          </div>
        </div>
      </div>
    </main>
  )
}