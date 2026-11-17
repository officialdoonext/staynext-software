'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertTriangle, Search, UserCheck, ArrowRight } from 'lucide-react'
import type { HousekeepingOverview } from '@/services/dashboard.service'

interface HousekeepingWidgetProps {
  data: HousekeepingOverview
}

export default function HousekeepingWidget({ data }: HousekeepingWidgetProps) {
  const items = [
    {
      title: 'Dirty Rooms',
      value: data.requiresCleaning,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      href: '/housekeeping?status=pending',
    },
    {
      title: 'In Progress Cleaning',
      value: data.inProgress,
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      href: '/housekeeping?status=in_progress',
    },
    {
      title: 'Clean & Inspected',
      value: data.completed,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      href: '/housekeeping?status=completed',
    },
    {
      title: 'Awaiting Inspection',
      value: data.awaitingInspection,
      icon: Search,
      iconBg: 'bg-[#f7f2fd]',
      iconColor: 'text-[#5e2b9d]',
      href: '/housekeeping?status=inspected',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-md border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-[#dfcef6] transition-all shadow-2xs group cursor-pointer"
            >
              <div className={`p-2 rounded-md ${item.iconBg} shrink-0`}>
                <Icon className={`h-4 w-4 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-gray-500 font-medium truncate">{item.title}</p>
                <p className="text-lg font-medium text-gray-900 group-hover:text-[#5e2b9d] mt-0.5">
                  {item.value}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 font-medium">
          <UserCheck className="h-4 w-4 text-[#5e2b9d]" />
          <span>Active Housekeepers on Duty: <strong className="text-gray-900">{data.assignedStaffCount ?? 4}</strong></span>
        </div>
        <Link
          href="/housekeeping"
          className="flex items-center gap-1 text-[#5e2b9d] font-medium hover:text-[#4d2282] cursor-pointer"
        >
          <span>Housekeeping Board</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
