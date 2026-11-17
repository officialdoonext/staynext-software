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
        <Button className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white shadow-sm h-9 text-xs font-medium cursor-pointer rounded-md">
          <CalendarPlus className="h-4 w-4 mr-1.5" />
          <span>New Reservation</span>
        </Button>
      </Link>

      {/* Quick Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 text-xs font-medium border-gray-300 rounded-md cursor-pointer">
            <span>Quick Actions</span>
            <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-md">
          <DropdownMenuLabel className="font-medium">Front Desk Operations</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/front-desk" className="flex items-center gap-2 cursor-pointer">
              <DoorOpen className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium">Walk-in Check-in</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/front-desk" className="flex items-center gap-2 cursor-pointer">
              <DoorClosed className="h-4 w-4 text-[#7e3ec2]" />
              <span className="text-xs font-medium">Process Check-out</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/guests/new" className="flex items-center gap-2 cursor-pointer">
              <UserPlus className="h-4 w-4 text-[#5e2b9d]" />
              <span className="text-xs font-medium">Register New Guest</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-medium">Billing &amp; Maintenance</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/billing" className="flex items-center gap-2 cursor-pointer">
              <Receipt className="h-4 w-4 text-[#5e2b9d]" />
              <span className="text-xs font-medium">Generate Folio</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/maintenance/new" className="flex items-center gap-2 cursor-pointer">
              <Wrench className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium">Log Work Order</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
