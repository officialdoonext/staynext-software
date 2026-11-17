'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  BedDouble,
  Users,
  Clock,
  DoorOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoomItem } from '@/services/room.service'
import { ReservationDetail } from '@/services/reservation.service'
import { PropertyItem } from '@/services/property.service'
import { formatDate } from '@/lib/utils'

interface ReservationCalendarClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  rooms: RoomItem[]
  reservations: ReservationDetail[]
}

export default function ReservationCalendarClient({
  property: initialProp,
  properties,
  rooms,
  reservations,
}: ReservationCalendarClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [startDate, setStartDate] = useState<Date>(new Date())

  // Generate 7-day window
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    days.push(d)
  }

  const handlePrevWeek = () => {
    const prev = new Date(startDate)
    prev.setDate(prev.getDate() - 7)
    setStartDate(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(startDate)
    next.setDate(next.getDate() + 7)
    setStartDate(next)
  }

  const handleToday = () => {
    setStartDate(new Date())
  }

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()

  const isBetween = (date: Date, startStr: string, endStr: string) => {
    const d = new Date(date.toISOString().split('T')[0]).getTime()
    const s = new Date(startStr).getTime()
    const e = new Date(endStr).getTime()
    return d >= s && d < e
  }

  const weekTitle = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reservations">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Stay Matrix &amp; Timeline View
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Visual Gantt chart of room occupancy, check-in turnover, and active guest bookings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <Link href="/reservations/new">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Week Navigator Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevWeek}
            className="h-8 px-2 text-xs rounded-md cursor-pointer border-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 px-2.5 text-xs rounded-md cursor-pointer border-gray-200 font-medium"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="h-8 px-2 text-xs rounded-md cursor-pointer border-gray-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-xs font-semibold text-gray-900 ml-2">{weekTitle}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5e2b9d]" />
            <span>Checked In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Calendar Matrix */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 w-44 font-medium text-gray-600 text-[11px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                Room
              </th>
              {days.map((d, idx) => {
                const isToday = isSameDay(d, new Date())
                return (
                  <th
                    key={idx}
                    className={`p-3 text-center border-r border-gray-200 min-w-[120px] ${
                      isToday ? 'bg-[#f7f2fd] text-[#5e2b9d]' : 'text-gray-600'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-[#5e2b9d]' : 'text-gray-900'}`}>
                      {d.getDate()}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map((room) => {
              // Find reservations occupying this room
              const roomReservations = reservations.filter(
                (res) => res.room_id === room.id && res.status !== 'cancelled'
              )

              return (
                <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-semibold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                    <div>Room {room.room_number}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{room.room_type_name}</div>
                  </td>

                  {days.map((day, dIdx) => {
                    const match = roomReservations.find((res) =>
                      isBetween(day, res.check_in_date, res.check_out_date)
                    )
                    const isToday = isSameDay(day, new Date())

                    return (
                      <td
                        key={dIdx}
                        className={`p-1.5 border-r border-gray-100 text-center align-middle ${
                          isToday ? 'bg-[#f7f2fd]/20' : ''
                        }`}
                      >
                        {match ? (
                          <div
                            className={`p-1.5 rounded text-[10px] font-medium truncate shadow-2xs ${
                              match.status === 'checked_in'
                                ? 'bg-[#5e2b9d] text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                            title={`${match.guest_name} (#${match.reservation_number})`}
                          >
                            <span className="font-semibold block truncate">{match.guest_name}</span>
                            <span className="text-[9px] opacity-80 block truncate">#{match.reservation_number}</span>
                          </div>
                        ) : room.status === 'maintenance' || room.status === 'blocked' ? (
                          <div className="p-1 rounded text-[10px] bg-red-50 text-red-700 border border-red-200">
                            Blocked
                          </div>
                        ) : (
                          <div className="h-8 rounded hover:bg-gray-100/50 flex items-center justify-center text-gray-300 text-[10px]">
                            —
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

