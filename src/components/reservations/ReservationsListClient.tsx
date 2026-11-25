'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CalendarPlus,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  DoorClosed,
  XCircle,
  Eye,
  BedDouble,
  User,
  CreditCard,
  Building2,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  ReservationDetail,
  checkInReservation,
  checkOutReservation,
  cancelReservation
} from '@/services/reservation.service'
import { RoomItem, RoomTypeItem } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatCurrency, formatDate, formatTimeString } from '@/lib/utils'

interface ReservationsListClientProps {
  initialReservations: ReservationDetail[]
  roomTypes: RoomTypeItem[]
  availableRooms: RoomItem[]
  property: PropertyItem
  properties: PropertyItem[]
}

export default function ReservationsListClient({
  initialReservations,
  roomTypes,
  availableRooms,
  property: initialProp,
  properties,
}: ReservationsListClientProps) {
  const [reservations, setReservations] = useState<ReservationDetail[]>(initialReservations)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Quick Check-in Room Modal
  const [checkInModalRes, setCheckInModalRes] = useState<ReservationDetail | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')

  const handleQuickCheckIn = async (res: ReservationDetail) => {
    if (!res.room_id) {
      // Need to assign a room first
      setCheckInModalRes(res)
      const eligible = availableRooms.find((r) => r.room_type_id === res.room_type_id && r.status === 'available')
      setSelectedRoomId(eligible?.id || availableRooms[0]?.id || '')
      return
    }

    setActionLoading(`checkin-${res.id}`)
    try {
      const result = await checkInReservation(res.id, res.room_id)
      if (result.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === res.id ? { ...r, status: 'checked_in' } : r))
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmModalCheckIn = async () => {
    if (!checkInModalRes) return
    setActionLoading(`modal-checkin`)
    try {
      const result = await checkInReservation(checkInModalRes.id, selectedRoomId || undefined)
      if (result.success) {
        const roomObj = availableRooms.find((r) => r.id === selectedRoomId)
        setReservations((prev) =>
          prev.map((r) =>
            r.id === checkInModalRes.id
              ? {
                  ...r,
                  status: 'checked_in',
                  room_id: selectedRoomId,
                  room_number: roomObj?.room_number,
                }
              : r
          )
        )
        setCheckInModalRes(null)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuickCheckOut = async (res: ReservationDetail) => {
    if (!confirm(`Confirm checkout for ${res.guest_name} (Room ${res.room_number || ''})? This will mark the room dirty for housekeeping turnover.`)) return

    setActionLoading(`checkout-${res.id}`)
    try {
      const result = await checkOutReservation(res.id, res.room_id)
      if (result.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === res.id ? { ...r, status: 'checked_out' } : r))
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuickCancel = async (res: ReservationDetail) => {
    const reason = prompt('Please enter cancellation reason:')
    if (reason === null) return

    setActionLoading(`cancel-${res.id}`)
    try {
      const result = await cancelReservation(res.id, reason)
      if (result.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === res.id ? { ...r, status: 'cancelled' } : r))
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = reservations.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.reservation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.room_number && r.room_number.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesSource = sourceFilter === 'all' || r.booking_source === sourceFilter
    const matchesType = roomTypeFilter === 'all' || r.room_type_id === roomTypeFilter

    return matchesSearch && matchesStatus && matchesSource && matchesType
  })

  const getStatusBadge = (status: ReservationDetail['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" className="text-[10px] rounded-sm">Confirmed</Badge>
      case 'checked_in':
        return <Badge variant="purple" className="text-[10px] rounded-sm">Checked In</Badge>
      case 'checked_out':
        return <Badge variant="secondary" className="text-[10px] rounded-sm">Checked Out</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="text-[10px] rounded-sm">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] rounded-sm">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: ReservationDetail['payment_status']) => {
    switch (status) {
      case 'paid':
        return <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Paid</span>
      case 'partial':
        return <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Partial</span>
      default:
        return <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Pending</span>
    }
  }

  const exportCSV = () => {
    const headers = ['Booking ID', 'Guest Name', 'Phone', 'Room Category', 'Allocated Room', 'Check In', 'Check Out', 'Nights', 'Total Amount', 'Paid Amount', 'Status', 'Source']
    const rows = filtered.map((r) => [
      `"${r.reservation_number}"`,
      `"${r.guest_name.replace(/"/g, '""')}"`,
      `"${r.guest_phone}"`,
      `"${r.room_type_name}"`,
      `"${r.room_number || 'Unassigned'}"`,
      r.check_in_date,
      r.check_out_date,
      r.nights,
      r.total_amount,
      r.paid_amount,
      r.status,
      r.booking_source,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reservations_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Bookings &amp; Reservations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete guest booking registry, room allocation, check-ins, and deposit settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/reservations/calendar">
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-md cursor-pointer border-gray-200">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Stay Calendar View
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="text-xs h-9 rounded-md cursor-pointer border-gray-200"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            Export CSV
          </Button>

          <Link href="/reservations/new">
            <Button className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Reservation
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reservation #, guest name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Room Types</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="direct">Direct Walk-In</option>
            <option value="website">Hotel Website</option>
            <option value="booking_com">Booking.com</option>
            <option value="expedia">Expedia</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[1150px]">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-3.5 py-3">Reservation #</th>
              <th className="px-3.5 py-3">Guest &amp; Nationality</th>
              <th className="px-3.5 py-3">Channel</th>
              <th className="px-3.5 py-3">Check-In / Out</th>
              <th className="px-3.5 py-3">Allocated Room</th>
              <th className="px-3.5 py-3">Financials (Tot / Adv / Bal)</th>
              <th className="px-3.5 py-3">GST Invoice</th>
              <th className="px-3.5 py-3">Form III Status</th>
              <th className="px-3.5 py-3">Status</th>
              <th className="px-3.5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No reservations found</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Try resetting filters or create a new reservation.</div>
                </td>
              </tr>
            ) : (
              filtered.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                  {/* 1. Reservation Number */}
                  <td className="px-3.5 py-3">
                    <span className="font-semibold text-gray-900 block">{res.reservation_number}</span>
                    <span className="text-[10px] text-gray-400">{res.nights} {res.nights === 1 ? 'night' : 'nights'}</span>
                  </td>

                  {/* 2. Guest, Mobile & Nationality */}
                  <td className="px-3.5 py-3">
                    <div className="font-medium text-gray-900 flex items-center gap-1.5">
                      <span>{res.guest_name}</span>
                      {res.is_foreign_guest ? (
                        <span className="px-1 py-0.2 text-[9px] font-semibold bg-blue-100 text-blue-800 rounded">
                          Foreign
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 text-[9px] font-medium bg-gray-100 text-gray-600 rounded">
                          {res.guest_nationality || 'Indian'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500">{res.guest_phone || res.guest_email || 'No phone'}</div>
                  </td>

                  {/* 3. Booking Channel */}
                  <td className="px-3.5 py-3">
                    <span className="px-2 py-0.5 text-[10px] rounded-sm bg-gray-100 text-gray-700 capitalize font-medium">
                      {res.booking_source?.replace(/_/g, ' ') || 'Direct'}
                    </span>
                  </td>

                  {/* 4. Check-in & Check-out */}
                  <td className="px-3.5 py-3 text-gray-700">
                    <div className="font-medium text-gray-900 text-[11px]">
                      {formatDate(res.check_in_date)} &bull; {formatTimeString(res.check_in_time)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      &rarr; {formatDate(res.check_out_date)} &bull; {formatTimeString(res.check_out_time)}
                    </div>
                  </td>

                  {/* 5. Room & Category */}
                  <td className="px-3.5 py-3 text-gray-700">
                    <div className="font-medium">
                      {res.room_number ? (
                        <span className="text-[#5e2b9d] font-semibold text-xs">Room {res.room_number}</span>
                      ) : (
                        <span className="text-amber-600 italic text-[11px]">Unassigned</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500">{res.room_type_name}</div>
                  </td>

                  {/* 6. Financials (Total / Adv / Bal) */}
                  <td className="px-3.5 py-3">
                    <div className="font-medium text-gray-900">{formatCurrency(res.total_amount)}</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                      <span>Adv: <strong className="text-emerald-700">{formatCurrency(res.paid_amount)}</strong></span>
                      {res.balance_amount > 0 ? (
                        <span className="text-rose-600 font-semibold">Bal: {formatCurrency(res.balance_amount)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Cleared</span>
                      )}
                    </div>
                  </td>

                  {/* 7. GST Invoice Status */}
                  <td className="px-3.5 py-3">
                    {res.gst_invoice_status === 'Generated' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                        Pending
                      </span>
                    )}
                  </td>

                  {/* 8. Form III Status */}
                  <td className="px-3.5 py-3">
                    {res.form_iii_status === 'Submitted' ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-100 text-emerald-800 rounded">
                        Submitted
                      </span>
                    ) : res.form_iii_status === 'Pending' ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-800 rounded">
                        Form III Due
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">N/A</span>
                    )}
                  </td>

                  {/* 9. Booking Status */}
                  <td className="px-3.5 py-3">{getStatusBadge(res.status)}</td>

                  {/* 10. Actions */}
                  <td className="px-3.5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {res.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickCheckIn(res)}
                          disabled={actionLoading === `checkin-${res.id}`}
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer font-medium"
                        >
                          <DoorOpen className="h-3 w-3 mr-1" />
                          Check In
                        </Button>
                      )}

                      {res.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCheckOut(res)}
                          disabled={actionLoading === `checkout-${res.id}`}
                          className="h-7 px-2.5 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] border-[#dfcef6] rounded-sm cursor-pointer font-medium"
                        >
                          <DoorClosed className="h-3 w-3 mr-1" />
                          Check Out
                        </Button>
                      )}

                      {res.status === 'confirmed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickCancel(res)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 rounded-sm cursor-pointer"
                          title="Cancel Reservation"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Room Allocation Check-In Modal */}
      {checkInModalRes && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Check In: {checkInModalRes.guest_name}
              </span>
              <button
                type="button"
                onClick={() => setCheckInModalRes(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                <div>Booking: <strong>{checkInModalRes.reservation_number}</strong></div>
                <div>Category: {checkInModalRes.room_type_name}</div>
                <div>Stay: {checkInModalRes.nights} Nights ({formatDate(checkInModalRes.check_in_date)} {formatTimeString(checkInModalRes.check_in_time)} &rarr; {formatDate(checkInModalRes.check_out_date)} {formatTimeString(checkInModalRes.check_out_time)})</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Room for Check-In *
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  {availableRooms
                    .filter((r) => r.status === 'available')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.floor_name}) - Available
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckInModalRes(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmModalCheckIn}
                disabled={actionLoading === 'modal-checkin'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                Complete Check-In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

