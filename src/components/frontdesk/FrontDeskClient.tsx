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
  Receipt,
  Globe,
  ShieldCheck,
  FileText,
  Printer,
  Key,
  ArrowRightLeft,
  CalendarPlus,
  Wallet,
  QrCode,
  UserCheck,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  checkInReservation,
  checkOutReservation,
  changeRoomReservation,
  extendStayReservation,
  verifyGuestKyc,
  recordFrontDeskPayment,
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

  // Modals State
  const [modalGuest, setModalGuest] = useState<any | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [assignedKeyCard, setAssignedKeyCard] = useState<string>('')

  // Change Room Modal
  const [changeRoomGuest, setChangeRoomGuest] = useState<any | null>(null)
  const [newRoomId, setNewRoomId] = useState<string>('')

  // Extend Stay Modal
  const [extendStayGuest, setExtendStayGuest] = useState<any | null>(null)
  const [newCheckoutDate, setNewCheckoutDate] = useState<string>('')
  const [extraStayCharges, setExtraStayCharges] = useState<number>(0)

  // Payment Collection Modal
  const [paymentGuest, setPaymentGuest] = useState<any | null>(null)
  const [collectAmount, setCollectAmount] = useState<number>(0)
  const [collectMode, setCollectMode] = useState<string>('UPI')
  const [collectRef, setCollectRef] = useState<string>('')

  // Printable Registration Card Modal
  const [regCardGuest, setRegCardGuest] = useState<any | null>(null)

  // Handle Standard Check In
  const handleCheckIn = async (item: any) => {
    if (!item.roomId) {
      setModalGuest(item)
      const eligible = availableRooms.find((r) => r.status === 'available')
      setSelectedRoomId(eligible?.id || availableRooms[0]?.id || '')
      setAssignedKeyCard(item.keyCardNumber || `KEY-${item.roomNumber || '101'}`)
      return
    }

    setActionLoading(`checkin-${item.id}`)
    try {
      const res = await checkInReservation(item.id, item.roomId)
      if (res.success) {
        toast.success(`Check-in successful for ${item.guestName}!`)
        setArrivals((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: 'checked_in' } : a)))
        setInHouse((prev) => [...prev, { ...item, status: 'checked_in' }])
      } else {
        toast.error(res.error || 'Check-in failed')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Confirm Modal Check-in with Room & Key Card
  const handleConfirmModalCheckIn = async () => {
    if (!modalGuest || !selectedRoomId) return
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
          keyCardNumber: assignedKeyCard || `KEY-${roomObj?.room_number}`,
        }
        toast.success(`Allocated Room ${roomObj?.room_number} & Checked In!`)
        setArrivals((prev) => prev.map((a) => (a.id === modalGuest.id ? updated : a)))
        setInHouse((prev) => [...prev, updated])
        setModalGuest(null)
      } else {
        toast.error(res.error || 'Failed to check in')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Standard Check Out
  const handleCheckOut = async (item: any) => {
    if (item.balance > 0) {
      if (!confirm(`Warning: Outstanding balance of ${formatCurrency(item.balance)} is pending. Proceed with checkout?`)) {
        return
      }
    } else {
      if (!confirm(`Process checkout for ${item.guestName} (Room ${item.roomNumber})?`)) return
    }

    setActionLoading(`checkout-${item.id}`)
    try {
      const res = await checkOutReservation(item.id, item.roomId)
      if (res.success) {
        toast.success(`Checked out ${item.guestName}. Room marked for turnover cleaning.`)
        setDepartures((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: 'checked_out' } : d)))
        setInHouse((prev) => prev.filter((g) => g.id !== item.id))
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Confirm Room Change
  const handleConfirmChangeRoom = async () => {
    if (!changeRoomGuest || !newRoomId) return
    setActionLoading('change-room')
    try {
      const res = await changeRoomReservation(changeRoomGuest.id, changeRoomGuest.roomId, newRoomId)
      if (res.success) {
        const targetRoom = availableRooms.find((r) => r.id === newRoomId)
        toast.success(`Room changed to ${targetRoom?.room_number}!`)
        const updated = {
          ...changeRoomGuest,
          roomId: newRoomId,
          roomNumber: targetRoom?.room_number,
        }
        setInHouse((prev) => prev.map((g) => (g.id === changeRoomGuest.id ? updated : g)))
        setChangeRoomGuest(null)
      } else {
        toast.error(res.error || 'Error reassigning room')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Confirm Extend Stay
  const handleConfirmExtendStay = async () => {
    if (!extendStayGuest || !newCheckoutDate) return
    setActionLoading('extend-stay')
    try {
      const res = await extendStayReservation(extendStayGuest.id, newCheckoutDate, extraStayCharges)
      if (res.success) {
        toast.success(`Stay extended to ${formatDate(newCheckoutDate)}!`)
        const updated = {
          ...extendStayGuest,
          checkOutDate: newCheckoutDate,
          total: extendStayGuest.total + extraStayCharges,
          balance: extendStayGuest.balance + extraStayCharges,
        }
        setInHouse((prev) => prev.map((g) => (g.id === extendStayGuest.id ? updated : g)))
        setExtendStayGuest(null)
      } else {
        toast.error(res.error || 'Error extending stay')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Handle KYC Document Verification
  const handleVerifyKyc = async (item: any) => {
    if (!item.guestId) return
    setActionLoading(`kyc-${item.id}`)
    try {
      const res = await verifyGuestKyc(item.guestId)
      if (res.success) {
        toast.success(`KYC documents verified for ${item.guestName}!`)
        const updateFn = (list: any[]) =>
          list.map((g) => (g.id === item.id ? { ...g, idVerificationStatus: 'Verified' } : g))
        setArrivals(updateFn)
        setDepartures(updateFn)
        setInHouse(updateFn)
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Confirm Front Desk Payment
  const handleConfirmPayment = async () => {
    if (!paymentGuest || collectAmount <= 0) return
    setActionLoading('collect-payment')
    try {
      const res = await recordFrontDeskPayment(
        paymentGuest.id,
        collectAmount,
        collectMode,
        collectRef || `RCPT-${Date.now().toString().slice(-6)}`
      )
      if (res.success) {
        toast.success(`Recorded ₹${collectAmount} payment via ${collectMode}!`)
        const updated = {
          ...paymentGuest,
          paid: paymentGuest.paid + collectAmount,
          balance: Math.max(0, paymentGuest.balance - collectAmount),
        }
        setInHouse((prev) => prev.map((g) => (g.id === paymentGuest.id ? updated : g)))
        setArrivals((prev) => prev.map((g) => (g.id === paymentGuest.id ? updated : g)))
        setPaymentGuest(null)
      } else {
        toast.error(res.error || 'Payment recording failed')
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
        it.resNumber?.toLowerCase().includes(term) ||
        it.guestName?.toLowerCase().includes(term) ||
        it.phone?.toLowerCase().includes(term) ||
        it.arrivedFrom?.toLowerCase().includes(term) ||
        it.keyCardNumber?.toLowerCase().includes(term) ||
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
            Check-in workflows, key management, room assignments, KYC compliance, and live in-house guest roster.
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

          <Link href="/reservations/new?type=walkin">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              Walk-in Check-in
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Highlights Cards */}
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
                {arrivals.filter((a) => a.status === 'checked_in').length} already arrived &bull; {arrivals.filter((a) => a.isForeignGuest).length} Foreign (Form III)
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
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                <DoorClosed className="h-4 w-4" />
                Today&apos;s Departures
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{departures.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {departures.filter((d) => d.status === 'checked_out').length} checked out &bull; {departures.filter((d) => d.balance > 0).length} with due balance
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
              <div className="text-[10px] text-gray-400 mt-0.5">Active rooms currently in stay</div>
            </div>
            <Badge variant="outline" className="text-[10px] rounded-sm">
              View &rarr;
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reg #, guest name, mobile, room, key card, or origin..."
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
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-3.5 py-3">Reg # / Booking</th>
              <th className="px-3.5 py-3">Guest &amp; KYC Verification</th>
              <th className="px-3.5 py-3">Room &amp; Key Card</th>
              <th className="px-3.5 py-3">Travel Logistics</th>
              <th className="px-3.5 py-3">Occupants</th>
              <th className="px-3.5 py-3">Folio &amp; Balance</th>
              <th className="px-3.5 py-3">Status</th>
              <th className="px-3.5 py-3 text-right">Desk Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No records for this queue</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">All scheduled tasks completed or no matches found.</div>
                </td>
              </tr>
            ) : (
              currentList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  {/* 1. Reg # & Booking */}
                  <td className="px-3.5 py-3">
                    <span className="font-semibold text-gray-900 block">{item.resNumber}</span>
                    <span className="text-[10px] text-gray-400 block">{item.roomType}</span>
                    <span className="text-[9px] text-[#5e2b9d] font-mono">Reg: {item.guestRegNumber}</span>
                  </td>

                  {/* 2. Guest, Category & KYC */}
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900">{item.guestName}</span>
                      {item.isForeignGuest ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-blue-100 text-blue-800 rounded">
                          Foreign
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-gray-100 text-gray-700 rounded">
                          Indian
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500">{item.phone || 'No phone'}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {item.idVerificationStatus === 'Verified' ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-medium">
                          <CheckCircle2 className="h-2.5 w-2.5" /> ID Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifyKyc(item)}
                          disabled={actionLoading === `kyc-${item.id}`}
                          className="inline-flex items-center gap-0.5 text-[9px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded font-medium border border-amber-200 cursor-pointer"
                          title="Click to mark ID verified"
                        >
                          <ShieldCheck className="h-2.5 w-2.5" /> Verify ID
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 3. Room Unit & Key Card */}
                  <td className="px-3.5 py-3">
                    {item.roomNumber && item.roomNumber !== 'Unallocated' ? (
                      <span className="font-semibold text-[#5e2b9d] text-xs block">Room {item.roomNumber}</span>
                    ) : (
                      <span className="text-amber-600 italic text-[11px] block">Unallocated</span>
                    )}
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Key className="h-3 w-3 text-gray-400" />
                      <span>{item.keyCardNumber ? item.keyCardNumber : 'No Key Assigned'}</span>
                    </div>
                  </td>

                  {/* 4. Travel Logistics */}
                  <td className="px-3.5 py-3 text-gray-600 text-[11px]">
                    <div className="font-medium text-gray-800">
                      {item.arrivedFrom} &rarr; {item.nextDestination}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Purpose: <span className="text-gray-600">{item.purposeOfStay}</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Stay: {formatDate(item.checkInDate)} to {formatDate(item.checkOutDate)}
                    </div>
                  </td>

                  {/* 5. Occupants */}
                  <td className="px-3.5 py-3 text-[11px] text-gray-700">
                    <div><strong>{item.occupants}</strong> total</div>
                    <div className="text-[10px] text-gray-400">
                      {item.numAdults} Ad &bull; {item.numChildren} Ch
                    </div>
                  </td>

                  {/* 6. Folio & Balance */}
                  <td className="px-3.5 py-3">
                    <div className="font-medium text-gray-900">{formatCurrency(item.total)}</div>
                    {item.balance > 0 ? (
                      <span className="text-[10px] text-rose-600 font-semibold block">
                        Due: {formatCurrency(item.balance)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium block">Fully Paid</span>
                    )}
                    <span className="text-[9px] text-gray-400">Mode: {item.paymentMode}</span>
                  </td>

                  {/* 7. Status */}
                  <td className="px-3.5 py-3">
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

                  {/* 8. Desk Quick Actions */}
                  <td className="px-3.5 py-3 text-right space-x-1">
                    {/* Check In Action */}
                    {activeTab === 'arrivals' && item.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(item)}
                        disabled={actionLoading === `checkin-${item.id}`}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer font-medium"
                      >
                        <DoorOpen className="h-3 w-3 mr-1" />
                        Check In
                      </Button>
                    )}

                    {/* Registration Card button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRegCardGuest(item)}
                      className="h-7 px-2 text-xs text-gray-700 border-gray-200 hover:bg-gray-100 rounded-sm cursor-pointer"
                      title="Print Guest Registration Card"
                    >
                      <Printer className="h-3 w-3" />
                    </Button>

                    {/* In-House Operations */}
                    {item.status === 'checked_in' && (
                      <>
                        {/* Collect Payment */}
                        {item.balance > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPaymentGuest(item)
                              setCollectAmount(item.balance)
                              setCollectMode('UPI')
                              setCollectRef('')
                            }}
                            className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-sm cursor-pointer font-medium"
                            title="Collect Pending Balance"
                          >
                            <Wallet className="h-3 w-3 mr-0.5" />
                            ₹ Collect
                          </Button>
                        )}

                        {/* Change Room */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setChangeRoomGuest(item)
                            const eligible = availableRooms.find((r) => r.status === 'available' && r.id !== item.roomId)
                            setNewRoomId(eligible?.id || availableRooms[0]?.id || '')
                          }}
                          className="h-7 px-2 text-xs text-gray-700 border-gray-200 hover:bg-gray-100 rounded-sm cursor-pointer"
                          title="Reassign / Change Room"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                        </Button>

                        {/* Extend Stay */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExtendStayGuest(item)
                            const currentOut = new Date(item.checkOutDate)
                            currentOut.setDate(currentOut.getDate() + 1)
                            setNewCheckoutDate(currentOut.toISOString().split('T')[0])
                            setExtraStayCharges(Math.round(item.total / 1))
                          }}
                          className="h-7 px-2 text-xs text-gray-700 border-gray-200 hover:bg-gray-100 rounded-sm cursor-pointer"
                          title="Extend Guest Stay"
                        >
                          <CalendarPlus className="h-3 w-3" />
                        </Button>

                        {/* Check Out */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(item)}
                          disabled={actionLoading === `checkout-${item.id}`}
                          className="h-7 px-2.5 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] border-[#dfcef6] rounded-sm cursor-pointer font-medium"
                        >
                          <DoorClosed className="h-3 w-3 mr-1" />
                          Check Out
                        </Button>
                      </>
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

      {/* ======================================================== */}
      {/* MODAL 1: ROOM ALLOCATION & KEY CARD ASSIGNMENT */}
      {/* ======================================================== */}
      {modalGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Check-in Allocation: {modalGuest.guestName}
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
                <div>Category: {modalGuest.roomType} &bull; {modalGuest.occupants} Occupant(s)</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Assign Room Unit *
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Physical Key / Key Card Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. CARD-101, KEY-A"
                  value={assignedKeyCard}
                  onChange={(e) => setAssignedKeyCard(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
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

      {/* ======================================================== */}
      {/* MODAL 2: CHANGE ROOM REASSIGNMENT */}
      {/* ======================================================== */}
      {changeRoomGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Change Room: {changeRoomGuest.guestName}
              </span>
              <button
                type="button"
                onClick={() => setChangeRoomGuest(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
                Current: <strong>Room {changeRoomGuest.roomNumber}</strong>. Reassigning will mark current room as &ldquo;Dirty&rdquo; for turnover inspection.
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select New Available Room *
                </label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  {availableRooms
                    .filter((r) => r.status === 'available' && r.id !== changeRoomGuest.roomId)
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
                onClick={() => setChangeRoomGuest(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmChangeRoom}
                disabled={actionLoading === 'change-room'}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                Reassign Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EXTEND GUEST STAY */}
      {/* ======================================================== */}
      {extendStayGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Extend Stay: {extendStayGuest.guestName}
              </span>
              <button
                type="button"
                onClick={() => setExtendStayGuest(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                Current Check-out: <strong>{formatDate(extendStayGuest.checkOutDate)}</strong>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Check-out Date *
                </label>
                <input
                  type="date"
                  value={newCheckoutDate}
                  min={extendStayGuest.checkOutDate}
                  onChange={(e) => setNewCheckoutDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Additional Tariff Charges (₹)
                </label>
                <input
                  type="number"
                  value={extraStayCharges}
                  onChange={(e) => setExtraStayCharges(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtendStayGuest(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmExtendStay}
                disabled={actionLoading === 'extend-stay'}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                Confirm Extension
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: COLLECT FRONT DESK PAYMENT */}
      {/* ======================================================== */}
      {paymentGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Collect Payment: {paymentGuest.guestName}
              </span>
              <button
                type="button"
                onClick={() => setPaymentGuest(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 flex justify-between items-center">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-rose-600 text-sm">{formatCurrency(paymentGuest.balance)}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  value={collectAmount}
                  max={paymentGuest.balance}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] font-semibold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={collectMode}
                  onChange={(e) => setCollectMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="UPI">UPI (QR / Google Pay / PhonePe)</option>
                  <option value="Cash">Cash (Front Desk Drawer)</option>
                  <option value="Credit Card">Credit Card (POS Swipe)</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transaction / Receipt Reference
                </label>
                <input
                  type="text"
                  placeholder="UPI Ref # / UTR / Auth Code"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentGuest(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPayment}
                disabled={actionLoading === 'collect-payment'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: PRINTABLE GUEST REGISTRATION CARD (FORM C/REG CARD) */}
      {/* ======================================================== */}
      {regCardGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Guest Registration Card
                </h3>
                <p className="text-[10px] text-gray-500">Stay Next PMS &bull; Official Registration Record</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-[#5e2b9d] text-white text-xs h-8 rounded-sm cursor-pointer"
                >
                  <Printer className="h-3 w-3 mr-1" /> Print
                </Button>
                <button
                  type="button"
                  onClick={() => setRegCardGuest(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Registration Card Body */}
            <div className="border border-gray-300 rounded p-4 text-xs space-y-3 bg-white">
              <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{initialProp.name}</h4>
                  <p className="text-[10px] text-gray-500">{initialProp.address}, {initialProp.city}</p>
                </div>
                <div className="text-right text-[10px]">
                  <div>Reg No: <strong>{regCardGuest.guestRegNumber}</strong></div>
                  <div>Booking: {regCardGuest.resNumber}</div>
                  <div>Date: {formatDate(regCardGuest.checkInDate)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Guest Name: <strong>{regCardGuest.guestName}</strong></div>
                <div>Category: <strong>{regCardGuest.guestCategory}</strong></div>
                <div>Mobile: {regCardGuest.phone || 'N/A'}</div>
                <div>Email: {regCardGuest.email || 'N/A'}</div>
                <div>Arrived From: {regCardGuest.arrivedFrom}</div>
                <div>Proceeding To: {regCardGuest.nextDestination}</div>
                <div>ID Type: {regCardGuest.idType}</div>
                <div>ID Number: {regCardGuest.idNumber || 'Verified'}</div>
                <div>Allocated Room: <strong>Room {regCardGuest.roomNumber}</strong></div>
                <div>Key Card: <strong>{regCardGuest.keyCardNumber || 'Key #1'}</strong></div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                <p className="font-semibold text-gray-700">Guest Declaration:</p>
                <p className="italic mt-0.5">
                  I hereby declare that the particulars given above are true and correct. I agree to abide by the hotel rules and policies, and acknowledge that my luggage and belongings are kept at my own risk.
                </p>
              </div>

              <div className="pt-6 flex justify-between items-end text-[10px] text-gray-600">
                <div className="border-t border-gray-400 pt-1 w-40 text-center">
                  Receptionist Signature
                </div>
                <div className="border-t border-gray-400 pt-1 w-40 text-center">
                  Guest Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
