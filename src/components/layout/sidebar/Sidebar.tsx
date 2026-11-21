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
  Boxes,
  UserCog,
  Briefcase,
  Globe,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Hotel,
  X,
  PanelLeftClose,
  LucideIcon,
  ShieldCheck,
} from 'lucide-react'
import { navigationSections } from '@/constants/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  onToggle?: () => void
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
  Boxes,
  Package: Boxes,
  UserCog,
  Briefcase,
  Globe,
  BarChart3,
  Settings,
  ShieldCheck,
}

export default function Sidebar({ isOpen, mobileOpen, onMobileClose, onToggle }: SidebarProps) {
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
    <div className="flex h-full flex-col bg-white select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#5e2b9d] text-white shadow-sm">
            <Hotel className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-medium tracking-tight text-gray-900 leading-none">
              STAYNEXT
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#5e2b9d] mt-0.5">
              Hotel &amp; Resort SaaS
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {/* Desktop Collapse Button inside Sidebar */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="hidden md:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              type="button"
              onClick={onMobileClose}
              className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
              aria-label="Close Mobile Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4
              suppressHydrationWarning
              className="px-3 text-[11px] font-medium uppercase tracking-wider text-gray-400"
            >
              {section.title}
            </h4>
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
                        type="button"
                        onClick={() => toggleSubmenu(item.title)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                          isActive
                            ? "bg-[#f7f2fd] text-[#5e2b9d]"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#5e2b9d]" : "text-gray-500")} />
                          <span>{item.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="ml-7 pl-2 border-l border-gray-200 space-y-0.5 mt-0.5">
                          {item.children?.map((sub) => {
                            const isSubActive = pathname === sub.href
                            return (
                              <Link
                                key={sub.href || sub.title}
                                href={sub.href || '#'}
                                className={cn(
                                  "block px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                                  isSubActive
                                    ? "bg-[#f7f2fd] text-[#5e2b9d]"
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
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      isActive
                        ? "bg-[#f7f2fd] text-[#5e2b9d] border-l-2 border-[#5e2b9d]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#5e2b9d]" : "text-gray-500")} />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Property Status Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600 font-medium truncate">System Online &bull; Supabase</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar: Smoothly collapses to 0 width allowing page to occupy full width */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col shrink-0 transition-[width,opacity] duration-300 ease-in-out bg-white overflow-hidden",
          isOpen
            ? "w-64 border-r border-gray-200 opacity-100"
            : "w-0 border-r-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="w-64 h-full flex flex-col">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-xs cursor-pointer"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-200 ease-in-out border-r border-gray-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
