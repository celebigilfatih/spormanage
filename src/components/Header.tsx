'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import InAppNotifications from '@/components/InAppNotifications'
import { UserRole } from '@/types'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Yönetici'
      case UserRole.ACCOUNTING:
        return 'Muhasebe'
      case UserRole.TRAINER:
        return 'Antrenör'
      case UserRole.SECRETARY:
        return 'Sekreter'
      default:
        return role
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Page Title - can be customized per page */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hoş Geldiniz</h2>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <InAppNotifications />
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(user.role as UserRole)}</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
