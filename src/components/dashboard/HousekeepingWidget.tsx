'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, Clock, CheckCircle2, Search, ArrowRight, UserCheck } from 'lucide-react'

interface HousekeepingData {
  requiresCleaning: number
  inProgress: number
  completed: number
  awaitingInspection: number
  assignedStaffCount?: number
}

interface HousekeepingWidgetProps {
  data: HousekeepingData
}

export default function HousekeepingWidget({ data }: HousekeepingWidgetProps) {
  const items = [
    {
      title: 'Requires Cleaning',
      value: data.requiresCleaning,
      icon: Sparkles,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      href: '/housekeeping?status=pending',
    },
    {
      title: 'Cleaning in Progress',
      value: data.inProgress,
      icon: Clock,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      href: '/housekeeping?status=in_progress',
    },
    {
      title: 'Cleaning Completed',
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
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
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
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-indigo-200 transition-all shadow-2xs group"
            >
              <div className={`p-2 rounded-md ${item.iconBg} shrink-0`}>
                <Icon className={`h-4 w-4 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-gray-500 font-medium truncate">{item.title}</p>
                <p className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 mt-0.5">
                  {item.value}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 font-medium">
          <UserCheck className="h-4 w-4 text-indigo-600" />
          <span>Active Housekeepers on Duty: <strong className="text-gray-900">{data.assignedStaffCount ?? 4}</strong></span>
        </div>
        <Link
          href="/housekeeping"
          className="flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800"
        >
          <span>Housekeeping Board</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

