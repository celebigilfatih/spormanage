'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle } from 'lucide-react'

export default function LicenseBanner() {
  const { licenseWarning, licenseDaysLeft } = useAuth()

  if (!licenseWarning || licenseDaysLeft === null) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 shrink-0">
      <AlertTriangle className="w-4 h-4" />
      <span>
        Lisans sürenizin dolmasına <strong>{licenseDaysLeft} gün</strong> kaldı.
        Lütfen yenileme için yöneticinizle iletişime geçin.
      </span>
    </div>
  )
}
