'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Search,
  Calendar,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import PropertySelector from './PropertySelector'
import NotificationPanel from './NotificationPanel'
import UserMenu from './UserMenu'
import SearchModal from './SearchModal'
import Link from 'next/link'

interface HeaderProps {
  user: any
  onMenuClick: () => void
  onMobileMenuClick: () => void
}

export default function Header({ user, onMenuClick, onMobileMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  // Generate breadcrumb path segments
  const pathSegments = pathname.split('/').filter(Boolean)
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <>
      <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
        {/* Left Section: Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onMenuClick}
            className="hidden md:flex p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            title="Toggle Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate">
            <Link href="/dashboard" className="hover:text-gray-900">
              StayNext
            </Link>
            {pathSegments.map((segment, index) => {
              const href = '/' + pathSegments.slice(0, index + 1).join('/')
              const isLast = index === pathSegments.length - 1
              const title = segment
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())

              return (
                <React.Fragment key={href}>
                  <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                  {isLast ? (
                    <span className="text-gray-900 font-semibold truncate">
                      {title}
                    </span>
                  ) : (
                    <Link href={href} className="hover:text-gray-900 truncate">
                      {title}
                    </Link>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Property, Date, Search, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none"
          >
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <span className="hidden lg:inline-block">Search everything...</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-400">
              ⌘K
            </kbd>
          </button>

          {/* Property Selector */}
          <div className="hidden sm:block">
            <PropertySelector />
          </div>

          {/* Date Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="font-medium">{todayFormatted}</span>
          </div>

          {/* Notification Bell */}
          <NotificationPanel />

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* User Profile Menu */}
          <UserMenu user={user} />
        </div>
      </header>

      {/* Global Search Dialog */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}

