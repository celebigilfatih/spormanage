'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  CreditCard, 
  AlertTriangle, 
  Calendar,
  FileText,
  TrendingUp,
  Target,
  BookOpen,
  DollarSign,
  Activity
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    loading: true
  })

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/students?status=active&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalStudents: data.pagination.total,
          activeStudents: data.pagination.total,
          loading: false
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-gray-700">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const quickActions = [
    {
      title: 'Öğrenci Yönetimi',
      description: 'Öğrenci ekle ve bilgilerini yönet',
      icon: Users,
      color: 'bg-blue-500 hover:bg-blue-600',
      route: '/students'
    },
    {
      title: 'Ödeme İşlemleri',
      description: 'Aidatları takip et ve ödemeleri kaydet',
      icon: CreditCard,
      color: 'bg-green-500 hover:bg-green-600',
      route: '/payments'
    },
    {
      title: 'Öğrenci Notları',
      description: 'Öğrenci notları ve iletişim kayıtları',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
      route: '/notes'
    },
    {
      title: 'Antrenman Yönetimi',
      description: 'Antrenmanları planla ve yoklama al',
      icon: Activity,
      color: 'bg-orange-500 hover:bg-orange-600',
      route: '/trainings'
    },
    {
      title: 'Raporlar',
      description: 'Detaylı analiz ve raporları görüntüle',
      icon: TrendingUp,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      route: '/reports'
    },
    {
      title: 'Bildirimler',
      description: 'SMS ve e-posta bildirimleri yönet',
      icon: Target,
      color: 'bg-pink-500 hover:bg-pink-600',
      route: '/notifications'
    }
  ]

  return (
    <AppLayout>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Öğrenci
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.loading ? (
                  <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  stats.totalStudents
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Aktif kayıtlı öğrenci sayısı
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bu Ay Tahsilat
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">-</div>
              <p className="text-xs text-gray-500 mt-1">
                Aylık gelir toplamı
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bekleyen Ödemeler
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">-</div>
              <p className="text-xs text-gray-500 mt-1">
                Geciken ödeme sayısı
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bu Hafta Devamsızlık
              </CardTitle>
              <Calendar className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">-</div>
              <p className="text-xs text-gray-500 mt-1">
                Haftalık devamsızlık oranı
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Hızlı İşlemler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Card 
                  key={index} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(action.route)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${action.color} transition-colors`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span>Son Aktiviteler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Sistem başarıyla kuruldu</p>
                    <p className="text-xs text-gray-500">Tüm modüller aktif</p>
                  </div>
                </div>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Daha fazla aktivite için modülleri kullanmaya başlayın</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-500" />
                <span>Sistem Durumu</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Veritabanı</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Aktif</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Bildirim Sistemi</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Aktif</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Yedekleme</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Hazır</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}