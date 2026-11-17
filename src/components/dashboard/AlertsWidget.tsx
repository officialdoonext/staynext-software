'use client'

import React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CalendarX,
  CreditCard,
  Wrench,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import type { DashboardStats } from '@/services/dashboard.service'

interface AlertsWidgetProps {
  stats: DashboardStats
}

interface AlertItem {
  id: string
  title: string
  description: string
  count: number | string
  severity: 'danger' | 'warning' | 'info' | 'success'
  href: string
  icon: React.ElementType
}

export default function AlertsWidget({ stats }: AlertsWidgetProps) {
  const alerts: AlertItem[] = []

  if (stats.pendingReservations > 0) {
    alerts.push({
      id: 'pending-res',
      title: 'Pending Reservations',
      description: 'Requires front-desk confirmation',
      count: stats.pendingReservations,
      severity: 'warning',
      href: '/reservations?status=pending',
      icon: Clock,
    })
  }

  if (stats.dirtyRooms > 0) {
    alerts.push({
      id: 'dirty-rooms',
      title: 'Turnover Rooms Dirty',
      description: 'Needs housekeeping cleaning',
      count: stats.dirtyRooms,
      severity: 'danger',
      href: '/housekeeping?status=pending',
      icon: Sparkles,
    })
  }

  if (stats.maintenanceRooms > 0) {
    alerts.push({
      id: 'maint-rooms',
      title: 'Active Maintenance Orders',
      description: 'Rooms blocked for engineering',
      count: stats.maintenanceRooms,
      severity: 'warning',
      href: '/maintenance',
      icon: Wrench,
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-gray-400">
        <ShieldAlert className="h-6 w-6 text-emerald-500 mx-auto mb-1 opacity-70" />
        No critical operational alerts at this time.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {alerts.map((alert) => {
        const Icon = alert.icon
        const badgeColor =
          alert.severity === 'danger'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : alert.severity === 'warning'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : alert.severity === 'info'
            ? 'bg-[#f7f2fd] text-[#5e2b9d] border-[#dfcef6]'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'

        return (
          <Link
            key={alert.id}
            href={alert.href}
            className="flex items-center justify-between py-2.5 px-2 hover:bg-gray-50 rounded-md transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200 shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 group-hover:text-[#5e2b9d] truncate">
                  {alert.title}
                </p>
                <p className="text-[11px] text-gray-500 truncate font-normal">{alert.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${badgeColor}`}>
                {alert.count}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#5e2b9d]" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
