'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  BedDouble,
  Users,
  Clock,
  DoorOpen,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  ExternalLink,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoomItem } from '@/services/room.service'
import { ReservationDetail, assignRoomToReservation } from '@/services/reservation.service'
import { PropertyItem } from '@/services/property.service'
import { formatDate, formatCurrency, formatTimeString } from '@/lib/utils'

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
  const router = useRouter()
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [windowDays, setWindowDays] = useState<number>(7)
  const [assigningRes, setAssigningRes] = useState<ReservationDetail | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [assignLoading, setAssignLoading] = useState<boolean>(false)
  const [assignError, setAssignError] = useState<string>('')
  const [assignSuccess, setAssignSuccess] = useState<string>('')
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<ReservationDetail | null>(null)
  const [searchFilter, setSearchFilter] = useState<string>('')

  // Format local Date object to YYYY-MM-DD string without UTC shift
  const toDateString = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Parse YYYY-MM-DD string safely into local midnight Date
  const fromDateString = (str: string) => {
    if (!str) return new Date()
    const parts = str.slice(0, 10).split('-').map(Number)
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  // Generate calendar days window
  const days: Date[] = []
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
    days.push(d)
  }

  const handlePrevWindow = () => {
    const prev = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - windowDays)
    setStartDate(prev)
  }

  const handleNextWindow = () => {
    const next = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + windowDays)
    setStartDate(next)
  }

  const handleToday = () => {
    setStartDate(new Date())
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setStartDate(fromDateString(e.target.value))
    }
  }

  const handleJumpToBooking = (checkInStr: string) => {
    if (checkInStr) {
      setStartDate(fromDateString(checkInStr))
    }
  }

  const handlePropertyChange = (newPropId: string) => {
    setSelectedPropertyId(newPropId)
    router.push(`/reservations/calendar?propertyId=${newPropId}`)
  }

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()

  // Determine date role & timing for a reservation on a given calendar day
  const getBookingDayInfo = (day: Date, res: ReservationDetail) => {
    const d = toDateString(day)
    const ci = (res.check_in_date || '').slice(0, 10)
    const co = (res.check_out_date || '').slice(0, 10)
    if (!ci || !co) return null

    const inTime = formatTimeString(res.check_in_time)
    const outTime = formatTimeString(res.check_out_time)

    // Same-day (day use)
    if (ci === co && d === ci) {
      return {
        type: 'day_use' as const,
        label: `${inTime} - ${outTime}`,
        shortLabel: `${inTime} → ${outTime}`,
        timingSummary: `${inTime} → ${outTime}`,
      }
    }

    // Check-in / Arrival Day
    if (d === ci) {
      return {
        type: 'arrival' as const,
        label: `In: ${inTime}`,
        shortLabel: inTime,
        timingSummary: `Arrives at ${inTime}`,
      }
    }

    // Check-out / Departure Day
    if (d === co) {
      return {
        type: 'departure' as const,
        label: `Out: ${outTime}`,
        shortLabel: outTime,
        timingSummary: `Departs at ${outTime}`,
      }
    }

    // In-between / Ongoing Stay
    if (d > ci && d < co) {
      return {
        type: 'stay' as const,
        label: `Stay (Full Day)`,
        shortLabel: `Stay`,
        timingSummary: `${inTime} → ${outTime}`,
      }
    }

    return null
  }

  const handleConfirmAssignment = async () => {
    if (!assigningRes || !selectedRoomId) return
    setAssignLoading(true)
    setAssignError('')
    setAssignSuccess('')

    const res = await assignRoomToReservation(assigningRes.id, selectedRoomId)
    setAssignLoading(false)

    if (!res.success) {
      setAssignError(res.error || 'Failed to assign room')
    } else {
      setAssignSuccess('Room assigned successfully!')
      setTimeout(() => {
        setAssigningRes(null)
        setSelectedRoomId('')
        setAssignSuccess('')
        router.refresh()
      }, 1000)
    }
  }

  // Filter reservations
  const unassignedReservations = reservations.filter(
    (res) => !res.room_id && res.status !== 'cancelled'
  )

  const filteredReservations = reservations.filter((r) => {
    if (!searchFilter) return true
    const term = searchFilter.toLowerCase()
    return (
      r.reservation_number?.toLowerCase().includes(term) ||
      r.guest_name?.toLowerCase().includes(term) ||
      r.guest_phone?.includes(term) ||
      r.room_number?.toLowerCase().includes(term) ||
      r.room_type_name?.toLowerCase().includes(term)
    )
  })

  const weekTitle = `${days[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[days.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
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
            <p className="text-xs text-gray-500 mt-0.5">
              Visual room occupancy, check-in &amp; check-out timetable, and guest stay tracking for {initialProp.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
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

      {/* Week & View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        {/* Left: Window Navigator */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevWindow}
            className="h-8 px-2 text-xs rounded-md cursor-pointer border-gray-200"
            title="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 px-2.5 text-xs rounded-md cursor-pointer border-gray-200 font-medium text-gray-700"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWindow}
            className="h-8 px-2 text-xs rounded-md cursor-pointer border-gray-200"
            title="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Jump to specific date */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-xs text-gray-500">Jump to:</span>
            <input
              type="date"
              value={toDateString(startDate)}
              onChange={handleDateChange}
              className="h-8 px-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            />
          </div>

          <span className="text-xs font-semibold text-gray-900 ml-2 hidden sm:inline-block">
            {weekTitle}
          </span>
        </div>

        {/* Right: View Span Switcher & Status Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200">
            <button
              onClick={() => setWindowDays(7)}
              className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                windowDays === 7 ? 'bg-white text-[#5e2b9d] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setWindowDays(14)}
              className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                windowDays === 14 ? 'bg-white text-[#5e2b9d] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setWindowDays(30)}
              className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                windowDays === 30 ? 'bg-white text-[#5e2b9d] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 Days
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-600 pl-2 border-l border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Arrival (In)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5e2b9d]" />
              <span>Stay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Departure (Out)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Unassigned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Matrix Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 w-48 font-medium text-gray-600 text-[11px] sticky left-0 bg-gray-50 z-20 border-r border-gray-200">
                  Room
                </th>
                {days.map((d, idx) => {
                  const isToday = isSameDay(d, new Date())
                  return (
                    <th
                      key={idx}
                      className={`p-2.5 text-center border-r border-gray-200 min-w-[110px] ${
                        isToday ? 'bg-[#f7f2fd] text-[#5e2b9d]' : 'text-gray-600'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider">
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
              {/* SECTION: Unassigned / Pending Room Allocation Row */}
              {unassignedReservations.length > 0 && (
                <tr className="bg-amber-50/40 hover:bg-amber-50/70 border-b border-amber-200 transition-colors">
                  <td className="p-3 font-medium text-amber-900 sticky left-0 bg-amber-50 z-10 border-r border-amber-200">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-xs">Unallocated ({unassignedReservations.length})</span>
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Assign room number</div>
                  </td>

                  {days.map((day, dIdx) => {
                    const matches = unassignedReservations
                      .map((res) => {
                        const info = getBookingDayInfo(day, res)
                        return info ? { res, info } : null
                      })
                      .filter(Boolean) as { res: ReservationDetail; info: NonNullable<ReturnType<typeof getBookingDayInfo>> }[]

                    const isToday = isSameDay(day, new Date())

                    return (
                      <td
                        key={dIdx}
                        className={`p-1 border-r border-amber-100 text-center align-middle ${
                          isToday ? 'bg-amber-100/40' : ''
                        }`}
                      >
                        {matches.length > 0 ? (
                          <div className="space-y-1">
                            {matches.map(({ res, info }) => (
                              <div
                                key={res.id}
                                onClick={() => setAssigningRes(res)}
                                className="p-1 rounded text-[10px] font-medium truncate shadow-2xs bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-all"
                                title={`Click to assign room: ${res.guest_name} (#${res.reservation_number}) | ${info.timingSummary}`}
                              >
                                <span className="font-bold block truncate">{res.guest_name}</span>
                                <div className="text-[9px] opacity-90 flex items-center justify-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{info.shortLabel}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-7 flex items-center justify-center text-amber-300 text-[10px]">
                            —
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )}

              {/* SECTION: Normal Room Rows */}
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} className="p-8 text-center text-gray-500">
                    No physical rooms found. Please add rooms in Property &gt; Rooms.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => {
                  // Find reservations occupying this room
                  const roomReservations = reservations.filter(
                    (res) => res.room_id === room.id && res.status !== 'cancelled'
                  )

                  return (
                    <tr key={room.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3 font-semibold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="h-3.5 w-3.5 text-[#5e2b9d] shrink-0" />
                          <span>Room {room.room_number}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal pl-5">
                          {room.room_type_name}
                        </div>
                      </td>

                      {days.map((day, dIdx) => {
                        const dayEvents = roomReservations
                          .map((res) => {
                            const info = getBookingDayInfo(day, res)
                            return info ? { res, info } : null
                          })
                          .filter(Boolean) as { res: ReservationDetail; info: NonNullable<ReturnType<typeof getBookingDayInfo>> }[]

                        const isToday = isSameDay(day, new Date())

                        return (
                          <td
                            key={dIdx}
                            className={`p-1 border-r border-gray-100 text-center align-middle ${
                              isToday ? 'bg-[#f7f2fd]/30' : ''
                            }`}
                          >
                            {dayEvents.length > 0 ? (
                              <div className="space-y-1">
                                {dayEvents.map(({ res, info }) => {
                                  // Color code by event type: Arrival (emerald), Departure (blue), Stay (purple), Day-Use (indigo)
                                  let bgClass = 'bg-[#5e2b9d] text-white'
                                  let icon = <Clock className="h-2.5 w-2.5 shrink-0" />

                                  if (info.type === 'arrival') {
                                    bgClass = 'bg-emerald-600 text-white'
                                    icon = <ArrowDownLeft className="h-2.5 w-2.5 shrink-0" />
                                  } else if (info.type === 'departure') {
                                    bgClass = 'bg-blue-600 text-white'
                                    icon = <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                                  } else if (info.type === 'day_use') {
                                    bgClass = 'bg-indigo-600 text-white'
                                  }

                                  return (
                                    <div
                                      key={res.id + info.type}
                                      onClick={() => setSelectedBookingDetails(res)}
                                      className={`p-1 rounded text-[10px] font-medium shadow-2xs cursor-pointer hover:opacity-90 transition-opacity ${bgClass}`}
                                      title={`${res.guest_name} (#${res.reservation_number}) | ${info.timingSummary}`}
                                    >
                                      <span className="font-semibold block truncate leading-tight">{res.guest_name}</span>
                                      <div className="text-[9px] opacity-90 flex items-center justify-center gap-1 mt-0.5">
                                        {icon}
                                        <span className="truncate">{info.label}</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : room.status === 'maintenance' || room.status === 'blocked' ? (
                              <div className="p-1 rounded text-[10px] bg-red-50 text-red-700 border border-red-200">
                                Blocked
                              </div>
                            ) : (
                              <div className="h-8 rounded hover:bg-gray-100/60 flex items-center justify-center text-gray-300 text-[10px]">
                                —
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ASSIGN ROOM MODAL */}
      {assigningRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-md border border-gray-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Assign Room to Reservation
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  #{assigningRes.reservation_number} — {assigningRes.guest_name}
                </p>
              </div>
              <button
                onClick={() => setAssigningRes(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested Room Type:</span>
                  <span className="font-semibold text-gray-900">{assigningRes.room_type_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stay Range &amp; Times:</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatDate(assigningRes.check_in_date)} {formatTimeString(assigningRes.check_in_time)} <br />
                    to {formatDate(assigningRes.check_out_date)} {formatTimeString(assigningRes.check_out_time)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Room to Assign:
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="">-- Choose an Available Room --</option>
                  {rooms
                    .filter((r) => !assigningRes.room_type_id || r.room_type_id === assigningRes.room_type_id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.room_type_name}) - Current: {r.status}
                      </option>
                    ))}
                </select>
              </div>

              {assignError && (
                <div className="p-2 bg-red-50 text-red-600 rounded text-xs border border-red-200">
                  {assignError}
                </div>
              )}

              {assignSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200">
                  {assignSuccess}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssigningRes(null)}
                className="text-xs rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!selectedRoomId || assignLoading}
                onClick={handleConfirmAssignment}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md cursor-pointer font-medium"
              >
                {assignLoading ? 'Assigning...' : 'Confirm Room'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW DETAILS MODAL */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-md border border-gray-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Reservation Details &amp; Timetable
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  #{selectedBookingDetails.reservation_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Guest Name:</span>
                <span className="font-semibold text-gray-900">{selectedBookingDetails.guest_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Phone:</span>
                <span className="text-gray-900">{selectedBookingDetails.guest_phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Assigned Room:</span>
                <span className="font-semibold text-[#5e2b9d]">
                  {selectedBookingDetails.room_number ? `Room ${selectedBookingDetails.room_number}` : 'Unallocated'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Room Category:</span>
                <span className="text-gray-900">{selectedBookingDetails.room_type_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Check-In Schedule:</span>
                <span className="text-gray-900 font-medium">
                  {formatDate(selectedBookingDetails.check_in_date)} at {formatTimeString(selectedBookingDetails.check_in_time)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Check-Out Schedule:</span>
                <span className="text-gray-900 font-medium">
                  {formatDate(selectedBookingDetails.check_out_date)} at {formatTimeString(selectedBookingDetails.check_out_time)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Stay Duration:</span>
                <span className="text-gray-900 font-medium">{selectedBookingDetails.nights} Night{selectedBookingDetails.nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Financial Total:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedBookingDetails.total_amount)} (Paid: {formatCurrency(selectedBookingDetails.paid_amount)})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Status:</span>
                <Badge
                  className={`text-[10px] font-medium rounded ${
                    selectedBookingDetails.status === 'checked_in'
                      ? 'bg-[#5e2b9d] text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {selectedBookingDetails.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAssigningRes(selectedBookingDetails)
                  setSelectedBookingDetails(null)
                }}
                className="text-xs rounded-md cursor-pointer"
              >
                Change Room
              </Button>
              <Link href="/reservations">
                <Button
                  size="sm"
                  className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md cursor-pointer font-medium"
                >
                  Open Reservations List
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Quick Jump & Bookings Summary */}
      <Card className="border-gray-200 rounded-md shadow-2xs">
        <CardHeader className="py-3 px-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-[#5e2b9d]" />
              All Bookings Directory ({filteredReservations.length})
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Click &quot;Jump to Dates&quot; on any booking to immediately focus the calendar on its stay dates.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reservation, guest..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-[11px]">
                <tr>
                  <th className="p-3 font-medium">Reservation #</th>
                  <th className="p-3 font-medium">Guest</th>
                  <th className="p-3 font-medium">Room</th>
                  <th className="p-3 font-medium">Stay Period &amp; Timing</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      No reservations found. Click &quot;New Booking&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.slice(0, 15).map((res) => {
                    return (
                      <tr key={res.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">
                          #{res.reservation_number}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{res.guest_name}</div>
                          <div className="text-[10px] text-gray-400">{res.guest_phone || res.guest_email || 'No contact'}</div>
                        </td>
                        <td className="p-3">
                          {res.room_number ? (
                            <span className="font-medium text-[#5e2b9d] bg-[#f7f2fd] px-2 py-0.5 rounded text-[11px]">
                              Room {res.room_number}
                            </span>
                          ) : (
                            <span className="font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
                              Pending Room
                            </span>
                          )}
                          <div className="text-[10px] text-gray-400 mt-0.5">{res.room_type_name}</div>
                        </td>
                        <td className="p-3 text-gray-700">
                          <div className="flex items-center gap-1 font-medium text-gray-900">
                            <Clock className="h-3 w-3 text-[#5e2b9d] shrink-0" />
                            <span>{formatDate(res.check_in_date)} {formatTimeString(res.check_in_time)}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 pl-4 mt-0.5">
                            → {formatDate(res.check_out_date)} {formatTimeString(res.check_out_time)} ({res.nights} Nights)
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] font-medium rounded ${
                              res.status === 'checked_in'
                                ? 'bg-[#5e2b9d] text-white'
                                : res.status === 'confirmed'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {res.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!res.room_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAssigningRes(res)}
                                className="h-7 px-2 text-[11px] text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 rounded cursor-pointer"
                              >
                                Assign Room
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJumpToBooking(res.check_in_date)}
                              className="h-7 px-2 text-[11px] text-[#5e2b9d] border-[#5e2b9d]/30 hover:bg-[#f7f2fd] rounded cursor-pointer"
                            >
                              Jump to Dates
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
