'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  DoorOpen,
  DoorClosed,
  Users,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  BedDouble,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Wrench,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  checkInReservation,
  checkOutReservation,
  getFrontDeskOperations
} from '@/services/reservation.service'
import { RoomItem } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FrontDeskClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  todayArrivals: any[]
  todayDepartures: any[]
  inHouseGuests: any[]
  availableRooms: RoomItem[]
}

export default function FrontDeskClient({
  property: initialProp,
  properties,
  todayArrivals: initialArrivals,
  todayDepartures: initialDepartures,
  inHouseGuests: initialInHouse,
  availableRooms,
}: FrontDeskClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [arrivals, setArrivals] = useState<any[]>(initialArrivals)
  const [departures, setDepartures] = useState<any[]>(initialDepartures)
  const [inHouse, setInHouse] = useState<any[]>(initialInHouse)
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'in_house'>('arrivals')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Room allocation modal
  const [modalGuest, setModalGuest] = useState<any | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')

  const handleCheckIn = async (item: any) => {
    if (!item.roomId) {
      setModalGuest(item)
      const eligible = availableRooms.find((r) => r.status === 'available')
      setSelectedRoomId(eligible?.id || availableRooms[0]?.id || '')
      return
    }

    setActionLoading(`checkin-${item.id}`)
    try {
      const res = await checkInReservation(item.id, item.roomId)
      if (res.success) {
        setArrivals((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: 'checked_in' } : a)))
        setInHouse((prev) => [...prev, { ...item, status: 'checked_in' }])
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmModalCheckIn = async () => {
    if (!modalGuest) return
    setActionLoading('modal-checkin')
    try {
      const res = await checkInReservation(modalGuest.id, selectedRoomId)
      if (res.success) {
        const roomObj = availableRooms.find((r) => r.id === selectedRoomId)
        const updated = {
          ...modalGuest,
          status: 'checked_in',
          roomId: selectedRoomId,
          roomNumber: roomObj?.room_number,
        }
        setArrivals((prev) => prev.map((a) => (a.id === modalGuest.id ? updated : a)))
        setInHouse((prev) => [...prev, updated])
        setModalGuest(null)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckOut = async (item: any) => {
    if (!confirm(`Process checkout for ${item.guestName} (Room ${item.roomNumber})?`)) return
    setActionLoading(`checkout-${item.id}`)
    try {
      const res = await checkOutReservation(item.id, item.roomId)
      if (res.success) {
        setDepartures((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: 'checked_out' } : d)))
        setInHouse((prev) => prev.filter((g) => g.id !== item.id))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filterList = (list: any[]) =>
    list.filter((it) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        it.resNumber.toLowerCase().includes(term) ||
        it.guestName.toLowerCase().includes(term) ||
        it.phone.toLowerCase().includes(term) ||
        (it.roomNumber && it.roomNumber.toLowerCase().includes(term))
      )
    })

  const currentList =
    activeTab === 'arrivals'
      ? filterList(arrivals)
      : activeTab === 'departures'
      ? filterList(departures)
      : filterList(inHouse)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Front Desk Operations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Today&apos;s check-ins, checkout turnovers, key assignments, and live in-house guest roster.
          </p>
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
              Walk-In Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setActiveTab('arrivals')}
          className={`border rounded-md cursor-pointer transition-all ${
            activeTab === 'arrivals' ? 'border-[#5e2b9d] bg-[#f7f2fd]/40 shadow-xs' : 'border-gray-200'
          }`}
        >
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <DoorOpen className="h-4 w-4" />
                Today&apos;s Arrivals
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{arrivals.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {arrivals.filter((a) => a.status === 'checked_in').length} already arrived
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] rounded-sm">
              View &rarr;
            </Badge>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('departures')}
          className={`border rounded-md cursor-pointer transition-all ${
            activeTab === 'departures' ? 'border-[#5e2b9d] bg-[#f7f2fd]/40 shadow-xs' : 'border-gray-200'
          }`}
        >
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5e2b9d]">
                <DoorClosed className="h-4 w-4" />
                Today&apos;s Departures
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{departures.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {departures.filter((d) => d.status === 'checked_out').length} checked out
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] rounded-sm">
              View &rarr;
            </Badge>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('in_house')}
          className={`border rounded-md cursor-pointer transition-all ${
            activeTab === 'in_house' ? 'border-[#5e2b9d] bg-[#f7f2fd]/40 shadow-xs' : 'border-gray-200'
          }`}
        >
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                <Users className="h-4 w-4" />
                In-House Occupants
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{inHouse.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Occupying rooms currently</div>
            </div>
            <Badge variant="outline" className="text-[10px] rounded-sm">
              View &rarr;
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking #, guest surname, mobile, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('arrivals')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'arrivals' ? 'bg-[#5e2b9d] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Arrivals ({arrivals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('departures')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'departures' ? 'bg-[#5e2b9d] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Departures ({departures.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('in_house')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'in_house' ? 'bg-[#5e2b9d] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            In-House ({inHouse.length})
          </button>
        </div>
      </div>

      {/* Main Front Desk Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Reservation</th>
              <th className="px-4 py-3">Guest Name &amp; Contact</th>
              <th className="px-4 py-3">Room Unit</th>
              <th className="px-4 py-3">Stay Window</th>
              <th className="px-4 py-3">Folio Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No records for this queue</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">All scheduled tasks completed or no matches found.</div>
                </td>
              </tr>
            ) : (
              currentList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900 block">{item.resNumber}</span>
                    <span className="text-[10px] text-gray-400">{item.roomType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.guestName}</div>
                    <div className="text-[10px] text-gray-500">{item.phone || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {item.roomNumber && item.roomNumber !== 'Unallocated' ? (
                      <span className="font-semibold text-[#5e2b9d] text-xs">Room {item.roomNumber}</span>
                    ) : (
                      <span className="text-amber-600 italic text-[11px]">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-[11px]">
                    {formatDate(item.checkInDate)} &rarr; {formatDate(item.checkOutDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{formatCurrency(item.total)}</div>
                    {item.balance > 0 ? (
                      <span className="text-[10px] text-red-600 font-medium">Due: {formatCurrency(item.balance)}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">Settled</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        item.status === 'checked_in'
                          ? 'purple'
                          : item.status === 'checked_out'
                          ? 'secondary'
                          : 'success'
                      }
                      className="text-[10px] rounded-xs capitalize"
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {activeTab === 'arrivals' && item.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(item)}
                        disabled={actionLoading === `checkin-${item.id}`}
                        className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer font-medium"
                      >
                        <DoorOpen className="h-3 w-3 mr-1" />
                        Check In
                      </Button>
                    )}

                    {(activeTab === 'departures' || activeTab === 'in_house') && item.status === 'checked_in' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckOut(item)}
                        disabled={actionLoading === `checkout-${item.id}`}
                        className="h-7 px-3 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] border-[#dfcef6] rounded-sm cursor-pointer font-medium"
                      >
                        <DoorClosed className="h-3 w-3 mr-1" />
                        Check Out
                      </Button>
                    )}

                    {item.status === 'checked_out' && (
                      <span className="text-[11px] text-gray-400">Checkout Completed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Room Allocation Modal */}
      {modalGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Assign Room for {modalGuest.guestName}
              </span>
              <button
                type="button"
                onClick={() => setModalGuest(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                <div>Booking: <strong>{modalGuest.resNumber}</strong></div>
                <div>Category: {modalGuest.roomType}</div>
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
                onClick={() => setModalGuest(null)}
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

