'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ConciergeBell,
  CalendarCheck,
  Users,
  Building2,
  BedDouble,
  Sparkles,
  Wrench,
  Tag,
  CreditCard,
  Receipt,
  UtensilsCrossed,
  Package,
  UserCog,
  Briefcase,
  Globe,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Hotel,
  X,
  LucideIcon,
} from 'lucide-react'
import { navigationSections } from '@/constants/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ConciergeBell,
  CalendarCheck,
  Users,
  Building2,
  BedDouble,
  Sparkles,
  Wrench,
  Tag,
  CreditCard,
  Receipt,
  UtensilsCrossed,
  Package,
  UserCog,
  Briefcase,
  Globe,
  BarChart3,
  Settings,
}

export default function Sidebar({ isOpen, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    // Auto-expand menu matching current pathname
    const initial: Record<string, boolean> = {}
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && (pathname === item.href || pathname.startsWith(item.href + '/'))) {
          initial[item.title] = true
        }
      })
    })
    return initial
  })

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-gray-200 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Hotel className="h-5 w-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-gray-900 leading-none">
                STAYNEXT
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-600 mt-0.5">
                Hotel & Resort SaaS
              </span>
            </div>
          )}
        </Link>
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {isOpen && (
              <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </h4>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon || 'LayoutDashboard'] || LayoutDashboard
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = !!expandedMenus[item.title]
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                if (hasChildren) {
                  return (
                    <div key={item.title} className="space-y-0.5">
                      <button
                        onClick={() => toggleSubmenu(item.title)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-indigo-50/70 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        title={!isOpen ? item.title : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-gray-500")} />
                          {isOpen && <span>{item.title}</span>}
                        </div>
                        {isOpen && (
                          isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                          )
                        )}
                      </button>

                      {isOpen && isExpanded && (
                        <div className="ml-7 pl-2 border-l border-gray-200 space-y-0.5 mt-0.5">
                          {item.children?.map((sub) => {
                            const isSubActive = pathname === sub.href
                            return (
                              <Link
                                key={sub.href || sub.title}
                                href={sub.href || '#'}
                                className={cn(
                                  "block px-2.5 py-1.5 text-xs rounded-md transition-colors",
                                  isSubActive
                                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                )}
                              >
                                {sub.title}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.href || item.title}
                    href={item.href || '#'}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    title={!isOpen ? item.title : undefined}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-gray-500")} />
                    {isOpen && <span>{item.title}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Property Status Footer */}
      {isOpen && (
        <div className="border-t border-gray-200 p-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-600 font-medium truncate">System Online &bull; Supabase</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col shrink-0 transition-all duration-200",
          isOpen ? "w-64" : "w-16"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-xs"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
