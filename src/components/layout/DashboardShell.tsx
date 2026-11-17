'use client'

import { useState } from 'react'
import Sidebar from './sidebar/Sidebar'
import Header from './header/Header'

interface DashboardShellProps {
  children: React.ReactNode
  user: {
    id: string
    email?: string
    user_metadata?: Record<string, string>
  }
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 w-full">
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area: Expands smoothly to 100% full width when sidebar is collapsed */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full transition-all duration-300 ease-in-out">
        <Header
          user={user}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
