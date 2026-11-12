'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarPlus,
  DoorOpen,
  DoorClosed,
  UserPlus,
  PlusCircle,
  Receipt,
  Wrench,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      {/* Primary Action Button */}
      <Link href="/reservations/new">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 text-xs font-semibold">
          <CalendarPlus className="h-4 w-4 mr-1.5" />
          <span>New Reservation</span>
        </Button>
      </Link>

      {/* Quick Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 text-xs font-medium border-gray-300">
            <span>Quick Actions</span>
            <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Front Desk Operations</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/front-desk" className="flex items-center gap-2 cursor-pointer">
              <DoorOpen className="h-4 w-4 text-emerald-600" />
              <span className="text-xs">Walk-in Check-in</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/front-desk" className="flex items-center gap-2 cursor-pointer">
              <DoorClosed className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Process Check-out</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/guests/new" className="flex items-center gap-2 cursor-pointer">
              <UserPlus className="h-4 w-4 text-indigo-600" />
              <span className="text-xs">Register New Guest</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Hotel Operations</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/expenses/new" className="flex items-center gap-2 cursor-pointer">
              <Receipt className="h-4 w-4 text-amber-600" />
              <span className="text-xs">Record Expense</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/maintenance/new" className="flex items-center gap-2 cursor-pointer">
              <Wrench className="h-4 w-4 text-rose-600" />
              <span className="text-xs">Log Maintenance Work Order</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

