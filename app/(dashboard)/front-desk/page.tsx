import React from 'react'
import { DoorOpen, DoorClosed, UserPlus, ArrowLeftRight, BellRing, Search, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Front Desk Operations | StayNext' }

export default async function FrontDeskPage() {
  const supabase = await createClient()

  let todayArrivals = 0
  let todayDepartures = 0

  try {
    const today = new Date().toISOString().split('T')[0]

    const { count: arrCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('check_in_date', today)
      .in('status', ['confirmed', 'checked_in'])

    const { count: depCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('check_out_date', today)
      .eq('status', 'checked_in')

    todayArrivals = arrCount || 0
    todayDepartures = depCount || 0
  } catch {}

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
              Express Check-in
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
          <p className="text-2xl font-bold text-gray-900 mt-2">{todayArrivals}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Scheduled for check-in today</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-600">
            <DoorClosed className="h-5 w-5" />
            <span className="text-xs font-semibold">Today&apos;s Departures</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{todayDepartures}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Scheduled for checkout today</p>
        </div>
      </div>

      {/* Quick Search & Front Desk Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Instant Guest Check-in Lookup
          </h2>
          <span className="text-xs text-gray-400">Search by booking number</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Booking confirmation number, guest surname, or phone..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6">
            Find Reservation
          </Button>
        </div>
      </div>

      {/* Active Guest Requests Board */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
        <BellRing className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-gray-800">No Pending Front-Desk Requests</h3>
        <p className="text-xs text-gray-400 mt-1">
          Special requests, amenities, and room services for in-house guests will appear here.
        </p>
      </div>
    </div>
  )
}
