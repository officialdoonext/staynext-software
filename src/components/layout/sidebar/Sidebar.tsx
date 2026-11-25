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
  PanelLeftOpen,
  LucideIcon,
  ShieldCheck,
  ExternalLink,
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

  // Requirement 3: By default, open ALL accordions across the sidebar
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
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

  // Full Expanded Sidebar Content
  const fullSidebarContent = (
    <div className="flex h-full flex-col bg-white select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#5e2b9d] text-white shadow-sm">
            <Hotel className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-gray-900 leading-none">
              STAYNEXT
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#5e2b9d] mt-0.5">
              Hotel &amp; Resort SaaS
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {/* Desktop Collapse Button */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="hidden md:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Collapse to icons"
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

      {/* Nav List with Open Accordions */}
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
                                    ? "bg-[#f7f2fd] text-[#5e2b9d] font-semibold"
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

  // Requirement 4 & 5: Collapsed Mini Sidebar Content (Icons Visible + Hover Flyout)
  const collapsedSidebarContent = (
    <div className="flex h-full flex-col bg-white select-none items-center">
      {/* Brand Header (Icon Only + Expand toggle) */}
      <div className="flex h-16 w-full items-center justify-center border-b border-gray-200 bg-white relative">
        <Link href="/dashboard" className="cursor-pointer" title="STAYNEXT Dashboard">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#5e2b9d] text-white shadow-sm hover:scale-105 transition-transform">
            <Hotel className="h-5 w-5" />
          </div>
        </Link>
      </div>

      {/* Expand Button under logo */}
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="my-2 p-1.5 text-gray-400 hover:text-[#5e2b9d] hover:bg-[#f7f2fd] rounded-md transition-colors cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Collapsed Icon Navigation Rail */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible w-full px-2 py-2 space-y-4 scrollbar-none">
        {navigationSections.map((section, sIdx) => (
          <div key={section.title} className="space-y-1 w-full">
            {sIdx > 0 && <div className="border-t border-gray-100 my-2 mx-1" />}
            <div className="space-y-1 w-full flex flex-col items-center">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon || 'LayoutDashboard'] || LayoutDashboard
                const hasChildren = item.children && item.children.length > 0
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <div key={item.title} className="relative group/flyout w-full flex justify-center">
                    {/* Collapsed Icon Button */}
                    <Link
                      href={item.href || (hasChildren && item.children?.[0]?.href) || '#'}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all cursor-pointer relative",
                        isActive
                          ? "bg-[#f7f2fd] text-[#5e2b9d] shadow-xs font-semibold ring-1 ring-[#5e2b9d]/20"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                      aria-label={item.title}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#5e2b9d]" : "text-gray-600")} />
                      {isActive && (
                        <span className="absolute -left-2 top-2 bottom-2 w-1 bg-[#5e2b9d] rounded-r-full" />
                      )}
                    </Link>

                    {/* Requirement 5: Hover Flyout with Menu Name and Accordion Child Links */}
                    <div className="absolute left-full top-0 ml-2 z-50 min-w-[220px] max-w-xs bg-white border border-gray-200 shadow-2xl rounded-lg py-2 px-1 text-left hidden group-hover/flyout:block animate-in fade-in-0 zoom-in-95 duration-150 pointer-events-auto">
                      {/* Invisible mouse bridge preventing accidental close */}
                      <div className="absolute -left-3 top-0 bottom-0 w-3" />

                      {/* Flyout Header */}
                      <div className="px-3 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-[#f7f2fd] text-[#5e2b9d]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-xs text-gray-900 tracking-tight">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                          {section.title}
                        </span>
                      </div>

                      {/* Flyout Menu Items */}
                      {hasChildren ? (
                        <div className="space-y-0.5 mt-1">
                          {item.children?.map((sub) => {
                            const isSubActive = pathname === sub.href
                            return (
                              <Link
                                key={sub.href || sub.title}
                                href={sub.href || '#'}
                                className={cn(
                                  "flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                                  isSubActive
                                    ? "bg-[#f7f2fd] text-[#5e2b9d] font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                              >
                                <span>{sub.title}</span>
                                {isSubActive && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#5e2b9d]" />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      ) : (
                        <Link
                          href={item.href || '#'}
                          className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-[#f7f2fd] hover:text-[#5e2b9d] rounded-md transition-colors mt-1"
                        >
                          <span>Open {item.title}</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapsed Footer indicator */}
      <div className="border-t border-gray-200 p-2 w-full flex justify-center bg-gray-50/50">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" title="System Online &bull; Supabase" />
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar: 
          When isOpen is TRUE: w-64 full expanded with all accordions open.
          When isOpen is FALSE: w-[68px] collapsed icon-rail with hover flyouts.
      */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col shrink-0 transition-[width] duration-300 ease-in-out bg-white border-r border-gray-200 z-30 relative",
          isOpen ? "w-64" : "w-[68px]"
        )}
      >
        <div className={cn("h-full flex flex-col", isOpen ? "w-64" : "w-[68px]")}>
          {isOpen ? fullSidebarContent : collapsedSidebarContent}
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
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {fullSidebarContent}
      </div>
    </>
  )
}
