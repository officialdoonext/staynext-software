import React from 'react'
import { DoorOpen, DoorClosed, UserPlus, ArrowLeftRight, BellRing, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Front Desk Operations | StayNext' }

export default function FrontDeskPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Front Desk Console
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Rapid guest check-in, departure processing, key assignment, room transfers, and concierge requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reservations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Walk-in Express Check-in
            </Button>
          </Link>
        </div>
      </div>

      {/* Front Desk Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <DoorOpen className="h-5 w-5" />
            <span className="text-xs font-semibold">Today&apos;s Arrivals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">14</p>
          <p className="text-[11px] text-gray-500 mt-0.5">8 checked-in, 6 expected</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-600">
            <DoorClosed className="h-5 w-5" />
            <span className="text-xs font-semibold">Today&apos;s Departures</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">9</p>
          <p className="text-[11px] text-gray-500 mt-0.5">5 checked-out, 4 remaining</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <ArrowLeftRight className="h-5 w-5" />
            <span className="text-xs font-semibold">Room Transfers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Upgrade requests approved</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <BellRing className="h-5 w-5" />
            <span className="text-xs font-semibold">Guest Service Requests</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Extra pillows, wake-up call, taxi</p>
        </div>
      </div>

      {/* Quick Search & Front Desk Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Instant Guest Check-in Lookup
          </h2>
          <span className="text-xs text-gray-400">Scan QR or enter reservation code</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Booking confirmation number, guest surname, or passport ID..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6">
            Find Reservation
          </Button>
        </div>
      </div>

      {/* Active Guest Requests Board */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Active Concierge &amp; Room Service Requests</h3>
          <Badge variant="purple">5 Active Requests</Badge>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900">Room #201</span>
                <span className="text-xs font-semibold text-gray-900">Late Check-out Request (2:00 PM)</span>
                <Badge variant="warning" className="text-[10px]">Pending Approval</Badge>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Requested by Sophia Montgomery (VIP Diamond guest)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200">Decline</Button>
              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Approve 2 PM</Button>
            </div>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900">Room #102</span>
                <span className="text-xs font-semibold text-gray-900">Airport Shuttle Transfer (6:30 AM Tomorrow)</span>
                <Badge variant="success" className="text-[10px]">Confirmed</Badge>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Driver assigned: Marcus Vance (Mercedes Van #3)</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600">Details</Button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900">Room #304</span>
                <span className="text-xs font-semibold text-gray-900">Extra Memory Foam Pillows &amp; Towels</span>
                <Badge variant="info" className="text-[10px]">Dispatched to Housekeeping</Badge>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Assigned to: Maria Santos</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600">Mark Completed</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

