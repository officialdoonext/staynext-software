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
  ArrowUpRight,
  Phone,
  Mail,
  Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoomItem } from '@/services/room.service'
import { ReservationDetail, assignRoomToReservation } from '@/services/reservation.service'
import { PropertyItem } from '@/services/property.service'
import { formatDate, formatCurrency, formatTimeString } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'

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
  const [hoveredBooking, setHoveredBooking] = useState<{
    res: ReservationDetail
    span: NonNullable<ReturnType<typeof getReservationSpan>>
    rect: DOMRect
  } | null>(null)

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

  // Calculate continuous span for Microsoft Teams-style single card
  const getReservationSpan = (res: ReservationDetail) => {
    const ciStr = (res.check_in_date || '').slice(0, 10)
    const coStr = (res.check_out_date || '').slice(0, 10)
    if (!ciStr || !coStr) return null

    const windowStart = days[0]
    const windowStartStr = toDateString(windowStart)
    const windowEndStr = toDateString(days[days.length - 1])

    // If completely outside the visible window, do not render
    if (coStr < windowStartStr || ciStr > windowEndStr) {
      return null
    }

    const totalDays = days.length
    const msPerDay = 1000 * 60 * 60 * 24
    const checkInDate = fromDateString(ciStr)
    const checkOutDate = fromDateString(coStr)

    // Calculate exact integer day difference relative to windowStart
    const startDiff = Math.round((checkInDate.getTime() - windowStart.getTime()) / msPerDay)
    const endDiff = Math.round((checkOutDate.getTime() - windowStart.getTime()) / msPerDay)

    if (endDiff < 0 || startDiff >= totalDays) {
      return null
    }

    const startsBefore = startDiff < 0
    const endsAfter = endDiff >= totalDays
    const isSameDayBooking = ciStr === coStr

    const clampedStart = Math.max(0, startDiff)
    const clampedEnd = Math.min(totalDays - 1, endDiff)

    // Check-in afternoon offset (~2:00 PM / 52% into check-in day)
    // Check-out morning offset (~11:00 AM / 48% into check-out day)
    // This allows back-to-back bookings on the same day without overlapping
    const startFraction = startsBefore ? 0.0 : isSameDayBooking ? 0.08 : 0.52
    const endFraction = endsAfter ? 1.0 : isSameDayBooking ? 0.92 : 0.48

    const startPos = clampedStart + startFraction
    const endPos = clampedEnd + endFraction

    const left = (startPos / totalDays) * 100
    const rawWidth = ((endPos - startPos) / totalDays) * 100
    // Guarantee minimum readable width
    const minWidth = isSameDayBooking ? (100 / totalDays) * 0.8 : (100 / totalDays) * 0.9
    const width = Math.max(minWidth, Math.min(100 - left, rawWidth))

    return {
      left,
      width,
      startsBefore,
      endsAfter,
      isSameDayBooking,
      inTime: formatTimeString(res.check_in_time),
      outTime: formatTimeString(res.check_out_time),
    }
  }

  // Assign visual lanes for overlapping unallocated bookings so they stack cleanly
  const assignUnallocatedLanes = (bookings: ReservationDetail[]) => {
    const activeInWindow = bookings
      .map((b) => ({ res: b, span: getReservationSpan(b) }))
      .filter((item): item is { res: ReservationDetail; span: NonNullable<ReturnType<typeof getReservationSpan>> } => item.span !== null)

    const sorted = activeInWindow.sort((a, b) => a.res.check_in_date.localeCompare(b.res.check_in_date))
    const lanes: { endStr: string }[] = []
    const positioned: { res: ReservationDetail; span: NonNullable<ReturnType<typeof getReservationSpan>>; lane: number }[] = []

    for (const item of sorted) {
      let placed = false
      for (let l = 0; l < lanes.length; l++) {
        if (item.res.check_in_date >= lanes[l].endStr) {
          lanes[l].endStr = item.res.check_out_date
          positioned.push({ ...item, lane: l })
          placed = true
          break
        }
      }
      if (!placed) {
        lanes.push({ endStr: item.res.check_out_date })
        positioned.push({ ...item, lane: lanes.length - 1 })
      }
    }

    return { positioned, totalLanes: Math.max(1, lanes.length) }
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

  const { positioned: unallocatedPositioned, totalLanes: unallocatedLanes } = assignUnallocatedLanes(unassignedReservations)

  // Group rooms by category for inventory header
  const categoryInventory = rooms.reduce((acc: Record<string, { total: number; available: number }>, r) => {
    const cat = r.room_type_name || 'Standard'
    if (!acc[cat]) acc[cat] = { total: 0, available: 0 }
    acc[cat].total += 1
    if (r.status === 'available') acc[cat].available += 1
    return acc
  }, {})

  const maintenanceRoomsCount = rooms.filter(
    (r) => r.status === 'maintenance' || r.status === 'out_of_order' || r.status === 'blocked'
  ).length

  const availableRoomsCount = rooms.filter((r) => r.status === 'available').length
  const isOverbooked = unassignedReservations.length > availableRoomsCount

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

  // Column min-width based on window days count
  const columnMinWidth = windowDays === 7 ? 'min-w-[130px]' : windowDays === 14 ? 'min-w-[100px]' : 'min-w-[80px]'

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
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
              Continuous Microsoft Teams-style booking cards, occupancy spans, and daily turnover schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <div className="w-52">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={handlePropertyChange}
                placeholder="Switch Property..."
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SearchableSelect>
            </div>
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
          <div className="flex items-center gap-1.5 ml-1 w-44">
            <span className="text-xs text-gray-500 shrink-0">Jump:</span>
            <CustomDatePicker
              value={toDateString(startDate)}
              onChange={(val) => {
                if (val) setStartDate(fromDateString(val))
              }}
              placeholder="Jump to date..."
              showShortcuts={false}
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
              <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#5e2b9d]" />
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span>Unassigned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Inventory & Operations Policy Ribbon */}
      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#5e2b9d]" /> Standard Times:
            </span>
            <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px]">Check-In: 2:00 PM</span>
            <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px]">Check-Out: 11:00 AM</span>
            <span className="text-gray-500 text-[11px]">Min Stay: 1 Night &bull; Max Stay: 30 Nights</span>
          </div>

          {isOverbooked && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-semibold animate-pulse">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Overbooking Notice: {unassignedReservations.length} unallocated bookings</span>
            </div>
          )}
        </div>

        {/* Category availability tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 font-medium">Room Inventory by Category:</span>
          {Object.entries(categoryInventory).map(([cat, count]) => (
            <span key={cat} className="text-[11px] px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium">
              {cat}: <strong className="text-[#5e2b9d]">{count.available}</strong>/{count.total} free
            </span>
          ))}
          {maintenanceRoomsCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-1">
              <Wrench className="h-3 w-3 text-rose-500" /> {maintenanceRoomsCount} in Maintenance / Blocked
            </span>
          )}
        </div>
      </div>

      {/* Main Calendar Matrix Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 w-48 font-medium text-gray-600 text-[11px] sticky left-0 bg-gray-50 z-30 border-r border-gray-200 shadow-xs">
                  Room
                </th>
                {days.map((d, idx) => {
                  const isToday = isSameDay(d, new Date())
                  return (
                    <th
                      key={idx}
                      className={`p-2.5 text-center border-r border-gray-200 ${columnMinWidth} ${
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
                <tr className="bg-amber-50/30 hover:bg-amber-50/50 border-b border-amber-200 transition-colors">
                  <td className="w-48 p-3 font-medium text-amber-900 sticky left-0 bg-amber-50 z-20 border-r border-amber-200 shadow-xs align-top">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-xs">Unallocated ({unassignedReservations.length})</span>
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Click card to assign room</div>
                  </td>

                  <td colSpan={days.length} className="p-0 relative" style={{ height: `${Math.max(54, unallocatedLanes * 46 + 10)}px` }}>
                    {/* Background Day Cells */}
                    <div
                      className="absolute inset-0 grid h-full"
                      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
                    >
                      {days.map((day, idx) => {
                        const isToday = isSameDay(day, new Date())
                        return (
                          <div
                            key={idx}
                            className={`h-full border-r border-amber-100 ${isToday ? 'bg-amber-100/30' : ''}`}
                          />
                        )
                      })}
                    </div>

                    {/* Continuous Single Spanned Cards for Unallocated Bookings */}
                    <div className="absolute inset-0 pointer-events-none">
                      {unallocatedPositioned.map(({ res, span, lane }) => (
                        <div
                          key={res.id}
                          style={{
                            left: `${span.left}%`,
                            width: `${span.width}%`,
                            top: `${lane * 46 + 6}px`,
                            height: '36px',
                          }}
                          onMouseEnter={(e) => {
                            setHoveredBooking({ res, span, rect: e.currentTarget.getBoundingClientRect() })
                          }}
                          onMouseLeave={() => setHoveredBooking(null)}
                          onClick={() => {
                            setHoveredBooking(null)
                            setAssigningRes(res)
                          }}
                          className="absolute pointer-events-auto rounded-md shadow-xs hover:shadow-md cursor-pointer transition-all border border-amber-600 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white z-10 flex items-center justify-center px-3 overflow-hidden hover:brightness-105"
                        >
                          <span className="font-medium text-xs truncate select-none tracking-tight">
                            {res.guest_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
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

                  // Active spans for this room
                  const activeSpans = roomReservations
                    .map((res) => ({ res, span: getReservationSpan(res) }))
                    .filter((item): item is { res: ReservationDetail; span: NonNullable<ReturnType<typeof getReservationSpan>> } => item.span !== null)

                  return (
                    <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Room Label (Sticky Left) */}
                      <td className="w-48 p-3 font-semibold text-gray-900 sticky left-0 bg-white z-20 border-r border-gray-200 shadow-xs align-middle">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="h-3.5 w-3.5 text-[#5e2b9d] shrink-0" />
                          <span className="font-semibold text-xs">Room {room.room_number}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal pl-5">
                          {room.room_type_name}
                        </div>
                        {(room.status === 'maintenance' || room.status === 'out_of_order' || room.status === 'blocked') && (
                          <div className="mt-1 pl-5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium inline-flex items-center gap-1">
                              <Wrench className="h-2.5 w-2.5" /> Maintenance
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Day Grid Area with Spanning Cards */}
                      <td colSpan={days.length} className="p-0 relative h-16">
                        {/* Background Day Cells */}
                        <div
                          className="absolute inset-0 grid h-full"
                          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
                        >
                          {days.map((day, idx) => {
                            const isToday = isSameDay(day, new Date())
                            return (
                              <div
                                key={idx}
                                className={`h-full border-r border-gray-100 flex items-center justify-center ${
                                  isToday ? 'bg-[#f7f2fd]/25' : ''
                                }`}
                              >
                                {room.status === 'maintenance' || room.status === 'blocked' ? (
                                  <span className="text-[10px] text-red-500 font-medium opacity-60">Blocked</span>
                                ) : (
                                  <span className="text-gray-200 text-[10px] select-none">—</span>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Continuous Microsoft Teams-Style Single Card per Booking */}
                        <div className="absolute inset-0 pointer-events-none">
                          {activeSpans.map(({ res, span }) => {
                            const isCheckedIn = res.status === 'checked_in'
                            const bgClasses = isCheckedIn
                              ? 'bg-gradient-to-r from-[#5e2b9d] via-[#6d32b5] to-[#793ebd] text-white border-[#4d2282]'
                              : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-500 text-white border-emerald-700'

                            return (
                              <div
                                key={res.id}
                                style={{
                                  left: `${span.left}%`,
                                  width: `${span.width}%`,
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredBooking({ res, span, rect: e.currentTarget.getBoundingClientRect() })
                                }}
                                onMouseLeave={() => setHoveredBooking(null)}
                                onClick={() => {
                                  setHoveredBooking(null)
                                  setSelectedBookingDetails(res)
                                }}
                                className={`absolute top-2.5 bottom-2.5 pointer-events-auto rounded-md shadow-xs hover:shadow-md cursor-pointer transition-all border ${bgClasses} z-10 flex items-center justify-center px-3 overflow-hidden hover:brightness-105`}
                              >
                                <span className="font-medium text-xs truncate select-none tracking-tight">
                                  {res.guest_name}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING HOVER POPOVER CARD */}
      {hoveredBooking && typeof window !== 'undefined' && (() => {
        const { res, span, rect } = hoveredBooking
        const popoverWidth = 320

        let left = rect.left + rect.width / 2 - popoverWidth / 2
        if (left < 12) left = 12
        if (left + popoverWidth > window.innerWidth - 12) {
          left = window.innerWidth - popoverWidth - 12
        }

        const spaceAbove = rect.top
        const placeBelow = spaceAbove < 300

        const isCheckedIn = res.status === 'checked_in'
        const isConfirmed = res.status === 'confirmed'
        const isUnassigned = !res.room_id

        return (
          <div
            style={{
              left: `${left}px`,
              ...(placeBelow
                ? { top: `${rect.bottom + 8}px` }
                : { bottom: `${window.innerHeight - rect.top + 8}px` }),
            }}
            className="fixed z-50 pointer-events-none w-[320px] bg-white rounded-md border border-gray-200 shadow-2xl p-4 space-y-3 text-xs text-gray-700 animate-in fade-in duration-150"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {res.guest_name}
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  #{res.reservation_number}
                </div>
              </div>
              <Badge
                className={`text-[10px] shrink-0 font-medium rounded capitalize ${
                  isUnassigned
                    ? 'bg-amber-500 text-white'
                    : isCheckedIn
                    ? 'bg-[#5e2b9d] text-white'
                    : isConfirmed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isUnassigned ? 'Unallocated' : res.status?.replace('_', ' ')}
              </Badge>
            </div>

            {/* Grid details */}
            <div className="space-y-2">
              {/* Room / Allocation */}
              <div className="flex items-center gap-2">
                <DoorOpen className="h-3.5 w-3.5 text-[#5e2b9d] shrink-0" />
                <div className="truncate flex-1">
                  {res.room_number ? (
                    <span className="font-semibold text-gray-900">
                      Room {res.room_number} <span className="text-gray-500 font-normal">({res.room_type_name})</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700">
                      Unallocated <span className="text-gray-500 font-normal">({res.room_type_name})</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Schedule & Timing */}
              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-In:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(res.check_in_date)} at {span.inTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-Out:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(res.check_out_date)} at {span.outTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>Duration:</span>
                    <span className="font-medium text-[#5e2b9d]">{res.nights} Night{res.nights > 1 ? 's' : ''} stay</span>
                  </div>
                </div>
              </div>

              {/* Guest Contact */}
              {(res.guest_phone || res.guest_email) && (
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100 text-[11px] text-gray-600">
                  {res.guest_phone && (
                    <div className="flex items-center gap-1 truncate">
                      <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                      <span>{res.guest_phone}</span>
                    </div>
                  )}
                  {res.guest_email && (
                    <div className="flex items-center gap-1 truncate ml-auto">
                      <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{res.guest_email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Financials */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 font-medium">
                <span className="text-gray-500">Total:</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(res.total_amount)}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">Paid:</span>
                <span className="text-emerald-600">{formatCurrency(res.paid_amount)}</span>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="pt-2 border-t border-gray-100 text-[10px] text-center text-gray-400 font-medium">
              {isUnassigned ? '⚡ Click card to assign room' : '💡 Click card to view details & actions'}
            </div>
          </div>
        )
      })()}

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
                  <span className="text-gray-500">Requested Category:</span>
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
                <SearchableSelect
                  value={selectedRoomId}
                  onChange={setSelectedRoomId}
                  placeholder="Choose an available room..."
                >
                  <option value="">-- Choose an Available Room --</option>
                  {rooms
                    .filter((r) => !assigningRes.room_type_id || r.room_type_id === assigningRes.room_type_id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.room_type_name}) - Current: {r.status}
                      </option>
                    ))}
                </SearchableSelect>
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
