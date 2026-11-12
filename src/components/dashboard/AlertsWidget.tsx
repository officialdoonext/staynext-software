'use client'

import React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Wrench,
  Package,
  FileCheck,
  ChevronRight,
} from 'lucide-react'
import type { DashboardStats } from '@/services/dashboard.service'
import { formatCurrency } from '@/lib/utils'

interface AlertsWidgetProps {
  stats: DashboardStats
}

export default function AlertsWidget({ stats }: AlertsWidgetProps) {
  const alerts = [
    {
      id: 'payments',
      title: 'Outstanding Guest Payments',
      count: stats.pendingPayments > 0 ? formatCurrency(stats.pendingPayments) : 'All settled',
      description: 'Folios with unpaid room charges or incidental balances',
      severity: stats.pendingPayments > 0 ? 'warning' : 'ok',
      icon: CreditCard,
      href: '/billing?filter=unpaid',
    },
    {
      id: 'reservations',
      title: 'Reservations Pending Confirmation',
      count: stats.pendingReservations > 0 ? `${stats.pendingReservations} bookings` : 'None pending',
      description: 'Online direct inquiries awaiting deposit confirmation',
      severity: stats.pendingReservations > 0 ? 'danger' : 'ok',
      icon: AlertCircle,
      href: '/reservations?status=pending',
    },
    {
      id: 'maintenance',
      title: 'Rooms Under Maintenance',
      count: stats.maintenanceRooms > 0 ? `${stats.maintenanceRooms} rooms` : '0 rooms down',
      description: 'Engineering work orders active, rooms out of inventory',
      severity: stats.maintenanceRooms > 0 ? 'warning' : 'ok',
      icon: Wrench,
      href: '/maintenance',
    },
    {
      id: 'inventory',
      title: 'Low Stock Item Alerts',
      count: '3 items',
      description: 'Toiletries & linen below reorder threshold',
      severity: 'warning',
      icon: Package,
      href: '/inventory?filter=low_stock',
    },
    {
      id: 'inspections',
      title: 'Pending Housekeeping Inspections',
      count: `${stats.cleaningRooms || 2} rooms`,
      description: 'Cleaned units ready for supervisor approval',
      severity: 'info',
      icon: FileCheck,
      href: '/housekeeping?status=inspected',
    },
  ]

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
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'

        return (
          <Link
            key={alert.id}
            href={alert.href}
            className="flex items-center justify-between py-2.5 px-2 hover:bg-gray-50 rounded-md transition-colors group"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200 shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 truncate">
                  {alert.title}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{alert.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badgeColor}`}>
                {alert.count}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

