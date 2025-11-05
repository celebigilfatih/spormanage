'use client'

import Header from './Header'
import Sidebar from './Sidebar'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setMobileOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
