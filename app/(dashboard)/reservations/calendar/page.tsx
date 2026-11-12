'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Users,
  BedDouble,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const roomsList = [
  { id: '101', name: 'Room 101', type: 'Deluxe King' },
  { id: '102', name: 'Room 102', type: 'Deluxe King' },
  { id: '103', name: 'Room 103', type: 'Executive Double' },
  { id: '104', name: 'Room 104', type: 'Executive Double' },
  { id: '201', name: 'Room 201', type: 'Presidential Suite' },
  { id: '202', name: 'Room 202', type: 'Junior Suite' },
  { id: '203', name: 'Room 203', type: 'Deluxe Twin' },
  { id: '204', name: 'Room 204', type: 'Deluxe Twin' },
  { id: '301', name: 'Room 301', type: 'Ocean Villa' },
  { id: '302', name: 'Room 302', type: 'Ocean Villa' },
]

// 7-day window starting today
const daysList = [
  { dayName: 'Mon', dateNum: 10, fullDate: '2026-11-10' },
  { dayName: 'Tue', dateNum: 11, fullDate: '2026-11-11', isToday: true },
  { dayName: 'Wed', dateNum: 12, fullDate: '2026-11-12' },
  { dayName: 'Thu', dateNum: 13, fullDate: '2026-11-13' },
  { dayName: 'Fri', dateNum: 14, fullDate: '2026-11-14' },
  { dayName: 'Sat', dateNum: 15, fullDate: '2026-11-15' },
  { dayName: 'Sun', dateNum: 16, fullDate: '2026-11-16' },
]

// Stay allocations: roomId, startDayIndex, durationDays, guestName, color
const allocations = [
  { roomId: '201', start: 0, duration: 6, guest: 'Sophia Montgomery (VIP)', color: 'bg-indigo-600 text-white' },
  { roomId: '102', start: 1, duration: 3, guest: 'Liam Gallagher', color: 'bg-indigo-600 text-white' },
  { roomId: '202', start: 1, duration: 4, guest: 'Elena Rostova', color: 'bg-purple-600 text-white' },
  { roomId: '103', start: 2, duration: 3, guest: 'Lucas Meyer', color: 'bg-amber-600 text-white' },
  { roomId: '301', start: 4, duration: 3, guest: 'Victoria Sterling', color: 'bg-indigo-600 text-white' },
  { roomId: '204', start: 0, duration: 7, guest: 'MAINTENANCE BLOCK', color: 'bg-rose-600 text-white font-mono' },
  { roomId: '302', start: 0, duration: 7, guest: 'OUT OF ORDER', color: 'bg-gray-600 text-white font-mono' },
]

export default function ReservationCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState('Nov 10 – Nov 16, 2026')

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Link href="/reservations">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reservations List
            </Button>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-semibold text-gray-900">Timeline Calendar View</span>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Room Stay Calendar &amp; Tape Chart
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Visual room rack allocations across dates. Prevent conflicts and view stay durations at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-2xs p-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </Button>
            <span className="text-xs font-semibold px-3 text-gray-900">{currentWeek}</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          <Link href="/reservations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
        <span className="font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-indigo-600" />
          <span className="text-gray-700">Checked In</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-purple-600" />
          <span className="text-gray-700">Confirmed Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-600" />
          <span className="text-gray-700">Pending Deposit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-rose-600" />
          <span className="text-gray-700">Maintenance Block</span>
        </div>
      </div>

      {/* Tape Chart Grid */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Calendar Header Row */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-600">
            <div className="p-3 border-r border-gray-200">Room Details</div>
            {daysList.map((d) => (
              <div
                key={d.fullDate}
                className={`p-3 text-center border-r border-gray-200 ${
                  d.isToday ? 'bg-indigo-50/70 text-indigo-700 font-bold' : ''
                }`}
              >
                <div>{d.dayName}</div>
                <div className="text-sm font-mono mt-0.5">{d.dateNum}</div>
                {d.isToday && <span className="text-[9px] uppercase tracking-wider block text-indigo-600">Today</span>}
              </div>
            ))}
          </div>

          {/* Rooms Rows */}
          <div className="divide-y divide-gray-100">
            {roomsList.map((room) => {
              const allocation = allocations.find((a) => a.roomId === room.id)
              return (
                <div key={room.id} className="grid grid-cols-8 items-center min-h-[52px] hover:bg-gray-50/50 transition-colors">
                  {/* Room Label */}
                  <div className="p-3 border-r border-gray-200 flex flex-col justify-center">
                    <span className="font-mono text-xs font-bold text-gray-900">{room.name}</span>
                    <span className="text-[10px] text-gray-400 truncate">{room.type}</span>
                  </div>

                  {/* 7 Days Columns */}
                  <div className="col-span-7 grid grid-cols-7 h-full relative">
                    {/* Background grid lines */}
                    {daysList.map((d, index) => (
                      <div
                        key={d.fullDate}
                        className={`border-r border-gray-100 h-full ${
                          d.isToday ? 'bg-indigo-50/20' : ''
                        }`}
                      />
                    ))}

                    {/* Stay Bar if allocated */}
                    {allocation && (
                      <div
                        className={`absolute top-1.5 bottom-1.5 rounded-md px-2 flex items-center text-xs font-semibold shadow-2xs truncate ${allocation.color}`}
                        style={{
                          left: `${(allocation.start / 7) * 100}%`,
                          width: `${(allocation.duration / 7) * 100}%`,
                        }}
                      >
                        <span className="truncate">{allocation.guest}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

