'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  Trophy, 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  Settings,
  FileText,
  Bell,
  UsersRound,
  LayoutDashboard,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { name: 'Ana Sayfa', route: '/dashboard', icon: LayoutDashboard },
    { name: 'Öğrenciler', route: '/students', icon: Users },
    { name: 'Ödemeler', route: '/payments', icon: CreditCard },
    { name: 'Antrenmanlar', route: '/trainings', icon: Activity },
    { name: 'Yoklama', route: '/attendance', icon: UserCheck },
    { name: 'Gruplar', route: '/groups', icon: UsersRound },
    { name: 'Teknik Kadro', route: '/trainers', icon: Users },
    { name: 'Notlar', route: '/notes', icon: FileText },
    { name: 'Bildirimler', route: '/notifications', icon: Bell },
    { name: 'Raporlar', route: '/reports', icon: TrendingUp },
    { name: 'Ayarlar', route: '/settings', icon: Settings }
  ]

  const isActive = (route: string) => pathname === route

  return (
    <aside className={`bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div 
              className="flex items-center space-x-3 cursor-pointer flex-1"
              onClick={() => router.push('/dashboard')}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Futbol Okulu
                </h1>
                <p className="text-xs text-gray-500">Yönetim Sistemi</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div 
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg mx-auto cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              <Trophy className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.route)
              return (
                <li key={item.name}>
                  <button
                    onClick={() => router.push(item.route)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={collapsed ? item.name : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Daralt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
