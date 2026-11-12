'use client'

import React, { useState } from 'react'
import { Bell, Check, Calendar, Sparkles, CreditCard, Wrench, AlertTriangle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'reservation' | 'housekeeping' | 'payment' | 'maintenance' | 'inventory'
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'New Online Reservation',
    message: 'Booking #RES-8921 by Sarah Jenkins (Deluxe King, 3 nights)',
    time: '5m ago',
    read: false,
    type: 'reservation',
  },
  {
    id: '2',
    title: 'Room Cleaning Required',
    message: 'Room 304 marked dirty after guest checkout',
    time: '24m ago',
    read: false,
    type: 'housekeeping',
  },
  {
    id: '3',
    title: 'Payment Received',
    message: 'Received $850.00 via Stripe for Folio #FOL-1092',
    time: '1h ago',
    read: true,
    type: 'payment',
  },
  {
    id: '4',
    title: 'Urgent Maintenance',
    message: 'HVAC repair requested in Suite 501',
    time: '2h ago',
    read: true,
    type: 'maintenance',
  },
]

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'reservation':
        return <Calendar className="h-4 w-4 text-indigo-600" />
      case 'housekeeping':
        return <Sparkles className="h-4 w-4 text-cyan-600" />
      case 'payment':
        return <CreditCard className="h-4 w-4 text-emerald-600" />
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-amber-600" />
      case 'inventory':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between p-3.5 border-b border-gray-200">
          <DropdownMenuLabel className="p-0 font-semibold text-gray-900 text-sm">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 transition-colors ${
                item.read ? 'bg-white' : 'bg-indigo-50/40'
              }`}
            >
              <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-md shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                  {item.message}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {item.time}
                </span>
              </div>
              {!item.read && (
                <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 text-center bg-gray-50/50">
          <Link
            href="/settings/notifications"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Notification Settings &amp; History &rarr;
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

