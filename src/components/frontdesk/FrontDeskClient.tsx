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
  Building,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  Layers,
  AlertCircle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import { CustomTimePicker } from '@/components/ui/custom-time-picker'
import { toast } from 'sonner'
import {
  checkInReservation,
  checkOutReservation,
  changeRoomReservation,
  extendStayReservation,
  verifyGuestKyc,
  recordFrontDeskPayment,
} from '@/services/reservation.service'
import {
  FrontDeskMatrixResult,
  FrontDeskRoomItem,
  RoomTypeGroup,
  updateFrontDeskRoomStatus,
} from '@/services/frontdesk.service'
import { RoomItem } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FrontDeskClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  matrix: FrontDeskMatrixResult
  todayArrivals: any[]
  todayDepartures: any[]
  inHouseGuests: any[]
  availableRooms: RoomItem[]
}

export default function FrontDeskClient({
  property: initialProp,
  properties,
  matrix: initialMatrix,
  todayArrivals: initialArrivals,
  todayDepartures: initialDepartures,
  inHouseGuests: initialInHouse,
  availableRooms,
}: FrontDeskClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [viewMode, setViewMode] = useState<'matrix' | 'queues'>('matrix')
  const [matrixData, setMatrixData] = useState<FrontDeskMatrixResult>(initialMatrix)

  // Status Filter for Room Matrix
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'available' | 'occupied' | 'overdue_checkout' | 'housekeeping' | 'maintenance'
  >('all')

  // Search Filter
  const [matrixSearch, setMatrixSearch] = useState('')

  // Collapsible Room Types
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({})

  // Operations Queue States
  const [arrivals, setArrivals] = useState<any[]>(initialArrivals)
  const [departures, setDepartures] = useState<any[]>(initialDepartures)
  const [inHouse, setInHouse] = useState<any[]>(initialInHouse)
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'in_house'>('arrivals')
  const [queueSearchTerm, setQueueSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modals State
  const [modalGuest, setModalGuest] = useState<any | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [assignedKeyCard, setAssignedKeyCard] = useState<string>('')

  // Change Room Modal
  const [changeRoomGuest, setChangeRoomGuest] = useState<any | null>(null)
  const [newRoomId, setNewRoomId] = useState<string>('')

  // Extend Stay Modal
  const [extendStayItem, setExtendStayItem] = useState<{
    reservationId: string
    roomId?: string
    guestName: string
    roomNumber?: string
    currentCheckOutDate: string
    currentCheckOutTime: string
    totalAmount: number
    baseRate?: number
  } | null>(null)
  const [newCheckoutDate, setNewCheckoutDate] = useState<string>('')
  const [newCheckoutTime, setNewCheckoutTime] = useState<string>('11:00')
  const [extraStayCharges, setExtraStayCharges] = useState<number | string>('')

  // Check-Out Confirmation Modal
  const [checkOutItem, setCheckOutItem] = useState<{
    reservationId: string
    roomId?: string
    guestName: string
    roomNumber?: string
    balance: number
  } | null>(null)

  // Payment Collection Modal
  const [paymentGuest, setPaymentGuest] = useState<any | null>(null)
  const [collectAmount, setCollectAmount] = useState<number | string>('')
  const [collectMode, setCollectMode] = useState<string>('UPI')
  const [collectRef, setCollectRef] = useState<string>('')

  // Printable Registration Card Modal
  const [regCardGuest, setRegCardGuest] = useState<any | null>(null)

  const toggleCollapseType = (typeId: string) => {
    setCollapsedTypes((prev) => ({ ...prev, [typeId]: !prev[typeId] }))
  }

  // --------------------------------------------------------------------------
  // ACTIONS ON ROOM MATRIX
  // --------------------------------------------------------------------------

  // 1. Mark Room Clean (Housekeeping -> Available)
  const handleMarkClean = async (room: FrontDeskRoomItem) => {
    setActionLoading(`clean-${room.id}`)
    try {
      const res = await updateFrontDeskRoomStatus(room.id, 'available')
      if (res.success) {
        toast.success(`Room ${room.room_number} is now Clean & Available!`)
        // Update matrix state locally
        setMatrixData((prev) => {
          const updatedAll = prev.allRooms.map((r) =>
            r.id === room.id
              ? { ...r, computed_status: 'available' as const, db_status: 'available' }
              : r
          )
          const updatedGroups = prev.groups.map((g) => {
            if (g.room_type_id !== room.room_type_id) return g
            const gRooms = g.rooms.map((r) =>
              r.id === room.id
                ? { ...r, computed_status: 'available' as const, db_status: 'available' }
                : r
            )
            return {
              ...g,
              available_count: g.available_count + 1,
              housekeeping_count: Math.max(0, g.housekeeping_count - 1),
              rooms: gRooms,
            }
          })
          return {
            ...prev,
            allRooms: updatedAll,
            groups: updatedGroups,
            stats: {
              ...prev.stats,
              availableCount: prev.stats.availableCount + 1,
              housekeepingCount: Math.max(0, prev.stats.housekeepingCount - 1),
            },
          }
        })
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // 2. Mark Room Dirty (Available -> Housekeeping Dirty)
  const handleMarkDirty = async (room: FrontDeskRoomItem) => {
    setActionLoading(`dirty-${room.id}`)
    try {
      const res = await updateFrontDeskRoomStatus(room.id, 'dirty')
      if (res.success) {
        toast.success(`Room ${room.room_number} marked Dirty for housekeeping.`)
        setMatrixData((prev) => {
          const updatedAll = prev.allRooms.map((r) =>
            r.id === room.id
              ? { ...r, computed_status: 'housekeeping' as const, db_status: 'dirty' }
              : r
          )
          const updatedGroups = prev.groups.map((g) => {
            if (g.room_type_id !== room.room_type_id) return g
            const gRooms = g.rooms.map((r) =>
              r.id === room.id
                ? { ...r, computed_status: 'housekeeping' as const, db_status: 'dirty' }
                : r
            )
            return {
              ...g,
              available_count: Math.max(0, g.available_count - 1),
              housekeeping_count: g.housekeeping_count + 1,
              rooms: gRooms,
            }
          })
          return {
            ...prev,
            allRooms: updatedAll,
            groups: updatedGroups,
            stats: {
              ...prev.stats,
              availableCount: Math.max(0, prev.stats.availableCount - 1),
              housekeepingCount: prev.stats.housekeepingCount + 1,
            },
          }
        })
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // 3. Mark Maintenance Resolved -> Turn to Dirty for turnover cleaning
  const handleMarkMaintenanceResolved = async (room: FrontDeskRoomItem) => {
    setActionLoading(`maint-resolve-${room.id}`)
    try {
      const res = await updateFrontDeskRoomStatus(room.id, 'dirty')
      if (res.success) {
        toast.success(`Maintenance resolved for Room ${room.room_number}. Sent to housekeeping.`)
        setMatrixData((prev) => {
          const updatedAll = prev.allRooms.map((r) =>
            r.id === room.id
              ? { ...r, computed_status: 'housekeeping' as const, db_status: 'dirty' }
              : r
          )
          const updatedGroups = prev.groups.map((g) => {
            if (g.room_type_id !== room.room_type_id) return g
            const gRooms = g.rooms.map((r) =>
              r.id === room.id
                ? { ...r, computed_status: 'housekeeping' as const, db_status: 'dirty' }
                : r
            )
            return {
              ...g,
              maintenance_count: Math.max(0, g.maintenance_count - 1),
              housekeeping_count: g.housekeeping_count + 1,
              rooms: gRooms,
            }
          })
          return {
            ...prev,
            allRooms: updatedAll,
            groups: updatedGroups,
            stats: {
              ...prev.stats,
              maintenanceCount: Math.max(0, prev.stats.maintenanceCount - 1),
              housekeepingCount: prev.stats.housekeepingCount + 1,
            },
          }
        })
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // 4. Open Check-Out Confirmation Modal
  const openCheckOutModal = (
    reservationId: string,
    roomId?: string,
    guestName?: string,
    roomNumber?: string,
    balance?: number
  ) => {
    setCheckOutItem({
      reservationId,
      roomId,
      guestName: guestName || 'Guest',
      roomNumber,
      balance: balance || 0,
    })
  }

  // 5. Execute Check-Out
  const handleConfirmCheckOut = async () => {
    if (!checkOutItem) return
    setActionLoading(`checkout-${checkOutItem.reservationId}`)
    try {
      const res = await checkOutReservation(checkOutItem.reservationId, checkOutItem.roomId)
      if (res.success) {
        toast.success(`Checked out ${checkOutItem.guestName}. Room marked for turnover cleaning.`)

        // Update Queues
        setDepartures((prev) =>
          prev.map((d) => (d.id === checkOutItem.reservationId ? { ...d, status: 'checked_out' } : d))
        )
        setInHouse((prev) => prev.filter((g) => g.id !== checkOutItem.reservationId))

        // Update Matrix: room becomes housekeeping dirty
        if (checkOutItem.roomId) {
          const targetRoomId = checkOutItem.roomId
          setMatrixData((prev) => {
            const updatedAll = prev.allRooms.map((r) =>
              r.id === targetRoomId
                ? {
                    ...r,
                    computed_status: 'housekeeping' as const,
                    db_status: 'dirty',
                    current_reservation: undefined,
                  }
                : r
            )
            const updatedGroups = prev.groups.map((g) => {
              const matchedRoom = g.rooms.find((r) => r.id === targetRoomId)
              if (!matchedRoom) return g
              const wasOverdue = matchedRoom.computed_status === 'overdue_checkout'
              const gRooms = g.rooms.map((r) =>
                r.id === targetRoomId
                  ? {
                      ...r,
                      computed_status: 'housekeeping' as const,
                      db_status: 'dirty',
                      current_reservation: undefined,
                    }
                  : r
              )
              return {
                ...g,
                occupied_count: wasOverdue ? g.occupied_count : Math.max(0, g.occupied_count - 1),
                overdue_count: wasOverdue ? Math.max(0, g.overdue_count - 1) : g.overdue_count,
                housekeeping_count: g.housekeeping_count + 1,
                rooms: gRooms,
              }
            })

            const roomObj = prev.allRooms.find((r) => r.id === targetRoomId)
            const wasOverdue = roomObj?.computed_status === 'overdue_checkout'

            return {
              ...prev,
              allRooms: updatedAll,
              groups: updatedGroups,
              stats: {
                ...prev.stats,
                occupiedCount: wasOverdue ? prev.stats.occupiedCount : Math.max(0, prev.stats.occupiedCount - 1),
                overdueCount: wasOverdue ? Math.max(0, prev.stats.overdueCount - 1) : prev.stats.overdueCount,
                housekeepingCount: prev.stats.housekeepingCount + 1,
              },
            }
          })
        }

        setCheckOutItem(null)
      } else {
        toast.error(res.error || 'Check-out failed')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // 6. Open Extend Stay Modal
  const openExtendStayModal = (
    reservationId: string,
    roomId: string | undefined,
    guestName: string,
    roomNumber: string | undefined,
    currentCheckOutDate: string,
    currentCheckOutTime: string = '11:00',
    totalAmount: number = 0,
    baseRate: number = 0
  ) => {
    // Default to +1 day from current checkout date
    const current = new Date(currentCheckOutDate)
    const nextDay = new Date(current.getTime() + 24 * 60 * 60 * 1000)
    const nextDayStr = nextDay.toISOString().split('T')[0]

    setExtendStayItem({
      reservationId,
      roomId,
      guestName,
      roomNumber,
      currentCheckOutDate,
      currentCheckOutTime,
      totalAmount,
      baseRate,
    })
    setNewCheckoutDate(nextDayStr)
    setNewCheckoutTime(currentCheckOutTime || '11:00')
    setExtraStayCharges('')
  }

  // 7. Execute Extend Stay
  const handleConfirmExtendStay = async () => {
    if (!extendStayItem || !newCheckoutDate) return
    setActionLoading('extend-stay')
    try {
      const extraNum = Number(extraStayCharges) || 0
      const res = await extendStayReservation(
        extendStayItem.reservationId,
        newCheckoutDate,
        extraNum,
        newCheckoutTime
      )
      if (res.success) {
        toast.success(
          `Stay extended for ${extendStayItem.guestName} to ${formatDate(newCheckoutDate)} (${newCheckoutTime})!`
        )

        // Update Queues
        const updatedQueue = {
          checkOutDate: newCheckoutDate,
          checkOutTime: newCheckoutTime,
          total: extendStayItem.totalAmount + extraNum,
        }
        setInHouse((prev) =>
          prev.map((g) => (g.id === extendStayItem.reservationId ? { ...g, ...updatedQueue } : g))
        )

        // Update Matrix: room becomes active occupied (removes overdue alert if was overdue)
        if (extendStayItem.roomId) {
          const targetRoomId = extendStayItem.roomId
          setMatrixData((prev) => {
            const updatedAll = prev.allRooms.map((r) => {
              if (r.id !== targetRoomId) return r
              const updatedRes = r.current_reservation
                ? {
                    ...r.current_reservation,
                    check_out_date: newCheckoutDate,
                    check_out_time: newCheckoutTime,
                    total_amount: r.current_reservation.total_amount + extraNum,
                    balance_amount: r.current_reservation.balance_amount + extraNum,
                    is_overdue: false,
                    overdue_hours: 0,
                    overdue_text: undefined,
                  }
                : undefined

              return {
                ...r,
                computed_status: 'occupied' as const,
                current_reservation: updatedRes,
              }
            })

            const updatedGroups = prev.groups.map((g) => {
              const matchedRoom = g.rooms.find((r) => r.id === targetRoomId)
              if (!matchedRoom) return g
              const wasOverdue = matchedRoom.computed_status === 'overdue_checkout'

              const gRooms = g.rooms.map((r) => {
                if (r.id !== targetRoomId) return r
                const updatedRes = r.current_reservation
                  ? {
                      ...r.current_reservation,
                      check_out_date: newCheckoutDate,
                      check_out_time: newCheckoutTime,
                      total_amount: r.current_reservation.total_amount + extraNum,
                      balance_amount: r.current_reservation.balance_amount + extraNum,
                      is_overdue: false,
                      overdue_hours: 0,
                      overdue_text: undefined,
                    }
                  : undefined

                return {
                  ...r,
                  computed_status: 'occupied' as const,
                  current_reservation: updatedRes,
                }
              })

              return {
                ...g,
                occupied_count: wasOverdue ? g.occupied_count + 1 : g.occupied_count,
                overdue_count: wasOverdue ? Math.max(0, g.overdue_count - 1) : g.overdue_count,
                rooms: gRooms,
              }
            })

            const roomObj = prev.allRooms.find((r) => r.id === targetRoomId)
            const wasOverdue = roomObj?.computed_status === 'overdue_checkout'

            return {
              ...prev,
              allRooms: updatedAll,
              groups: updatedGroups,
              stats: {
                ...prev.stats,
                occupiedCount: wasOverdue ? prev.stats.occupiedCount + 1 : prev.stats.occupiedCount,
                overdueCount: wasOverdue ? Math.max(0, prev.stats.overdueCount - 1) : prev.stats.overdueCount,
              },
            }
          })
        }

        setExtendStayItem(null)
      } else {
        toast.error(res.error || 'Error extending stay')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // --------------------------------------------------------------------------
  // QUEUE OPERATIONS (Standard Front Desk Table Handlers)
  // --------------------------------------------------------------------------

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

        // Update Matrix
        if (item.roomId) {
          setMatrixData((prev) => {
            const updatedAll = prev.allRooms.map((r) =>
              r.id === item.roomId
                ? {
                    ...r,
                    computed_status: 'occupied' as const,
                    db_status: 'occupied',
                    current_reservation: {
                      id: item.id,
                      res_number: item.resNumber,
                      guest_id: item.guestId,
                      guest_name: item.guestName,
                      guest_phone: item.phone,
                      check_in_date: item.checkInDate,
                      check_in_time: item.checkInTime || '14:00',
                      check_out_date: item.checkOutDate,
                      check_out_time: item.checkOutTime || '11:00',
                      total_amount: item.total,
                      paid_amount: item.paid,
                      balance_amount: item.balance,
                      status: 'checked_in',
                      is_overdue: false,
                    },
                    today_arrival: undefined,
                  }
                : r
            )
            const updatedGroups = prev.groups.map((g) => {
              const matchedRoom = g.rooms.find((r) => r.id === item.roomId)
              if (!matchedRoom) return g
              const gRooms = g.rooms.map((r) =>
                r.id === item.roomId
                  ? {
                      ...r,
                      computed_status: 'occupied' as const,
                      db_status: 'occupied',
                    }
                  : r
              )
              return {
                ...g,
                available_count: Math.max(0, g.available_count - 1),
                occupied_count: g.occupied_count + 1,
                rooms: gRooms,
              }
            })
            return {
              ...prev,
              allRooms: updatedAll,
              groups: updatedGroups,
              stats: {
                ...prev.stats,
                availableCount: Math.max(0, prev.stats.availableCount - 1),
                occupiedCount: prev.stats.occupiedCount + 1,
              },
            }
          })
        }
      } else {
        toast.error(res.error || 'Check-in failed')
      }
    } finally {
      setActionLoading(null)
    }
  }

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

  const handleConfirmPayment = async () => {
    const colNum = Number(collectAmount) || 0
    if (!paymentGuest || colNum <= 0) return
    setActionLoading('collect-payment')
    try {
      const res = await recordFrontDeskPayment(
        paymentGuest.id,
        colNum,
        collectMode,
        collectRef || `RCPT-${Date.now().toString().slice(-6)}`
      )
      if (res.success) {
        toast.success(`Recorded ₹${colNum} payment via ${collectMode}!`)
        const updated = {
          ...paymentGuest,
          paid: paymentGuest.paid + colNum,
          balance: Math.max(0, paymentGuest.balance - colNum),
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

  // Filter queues
  const filterList = (list: any[]) =>
    list.filter((it) => {
      if (!queueSearchTerm) return true
      const term = queueSearchTerm.toLowerCase()
      return (
        it.resNumber?.toLowerCase().includes(term) ||
        it.guestName?.toLowerCase().includes(term) ||
        it.phone?.toLowerCase().includes(term) ||
        it.arrivedFrom?.toLowerCase().includes(term) ||
        it.keyCardNumber?.toLowerCase().includes(term) ||
        (it.roomNumber && it.roomNumber.toLowerCase().includes(term))
      )
    })

  const currentQueueList =
    activeTab === 'arrivals'
      ? filterList(arrivals)
      : activeTab === 'departures'
      ? filterList(departures)
      : filterList(inHouse)

  // Filter Room Matrix Groups
  const filteredGroups: RoomTypeGroup[] = matrixData.groups
    .map((group) => {
      const matchingRooms = group.rooms.filter((room) => {
        // Status filter
        if (statusFilter !== 'all' && room.computed_status !== statusFilter) {
          return false
        }
        // Search filter
        if (matrixSearch) {
          const q = matrixSearch.toLowerCase()
          const matchNo = room.room_number.toLowerCase().includes(q)
          const matchType = room.room_type_name.toLowerCase().includes(q)
          const matchGuest = room.current_reservation?.guest_name.toLowerCase().includes(q)
          const matchArrival = room.today_arrival?.guest_name.toLowerCase().includes(q)
          return matchNo || matchType || matchGuest || matchArrival
        }
        return true
      })

      return {
        ...group,
        rooms: matchingRooms,
      }
    })
    .filter((g) => g.rooms.length > 0 || !matrixSearch)

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900 flex items-center gap-2">
            Front Desk Operations
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time PMS room matrix by room types, live occupancy, stay extensions, turnover, and guest logistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Selector */}
          {properties.length > 1 && (
            <div className="w-52">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={(val) => setSelectedPropertyId(val)}
                placeholder="Switch Property..."
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="inline-flex rounded-md p-0.5 bg-gray-100 border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-[#5e2b9d]" />
              Room Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewMode('queues')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                viewMode === 'queues'
                  ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Operations Queue ({arrivals.length + departures.length + inHouse.length})
            </button>
          </div>

          {/* Walk-in Check In Button */}
          <Link href="/reservations/new?type=walkin">
            <Button
              size="sm"
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8.5 font-medium rounded-md cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Walk-in Check-in
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY METRICS & STATUS FILTER TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {/* All Rooms */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-md border cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'border-[#5e2b9d] bg-[#f7f2fd]/60 ring-1 ring-[#5e2b9d]/30'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] font-medium text-gray-500">All Rooms</div>
          <div className="text-xl font-bold text-gray-900 mt-0.5">{matrixData.stats.totalRooms}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Total Inventory</div>
        </div>

        {/* Available (Green) */}
        <div
          onClick={() => setStatusFilter('available')}
          className={`p-3 rounded-md border cursor-pointer transition-all ${
            statusFilter === 'available'
              ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/40'
              : 'border-gray-200 bg-white hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Available
          </div>
          <div className="text-xl font-bold text-emerald-950 mt-0.5">
            {matrixData.stats.availableCount}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">Ready for check-in</div>
        </div>

        {/* Occupied (Blue) */}
        <div
          onClick={() => setStatusFilter('occupied')}
          className={`p-3 rounded-md border cursor-pointer transition-all ${
            statusFilter === 'occupied'
              ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500/40'
              : 'border-gray-200 bg-white hover:border-blue-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-800">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Occupied
          </div>
          <div className="text-xl font-bold text-blue-950 mt-0.5">
            {matrixData.stats.occupiedCount}
          </div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">In-house guests</div>
        </div>

        {/* Overdue Checkout (High Alert Orange/Red) */}
        <div
          onClick={() => setStatusFilter('overdue_checkout')}
          className={`p-3 rounded-md border cursor-pointer transition-all ${
            statusFilter === 'overdue_checkout'
              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/50'
              : matrixData.stats.overdueCount > 0
              ? 'border-orange-300 bg-orange-50/50 hover:border-orange-400'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-800">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Overdue Due-Out
          </div>
          <div className="text-xl font-bold text-orange-950 mt-0.5 flex items-center justify-between">
            {matrixData.stats.overdueCount}
            {matrixData.stats.overdueCount > 0 && (
              <span className="text-[10px] bg-orange-500 text-white font-semibold px-1.5 py-0.5 rounded-full animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <div className="text-[10px] text-orange-700/80 mt-0.5">Stay expired</div>
        </div>

        {/* Housekeeping (Amber) */}
        <div
          onClick={() => setStatusFilter('housekeeping')}
          className={`p-3 rounded-md border cursor-pointer transition-all ${
            statusFilter === 'housekeeping'
              ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-500/40'
              : 'border-gray-200 bg-white hover:border-amber-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Housekeeping
          </div>
          <div className="text-xl font-bold text-amber-950 mt-0.5">
            {matrixData.stats.housekeepingCount}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">Dirty / Turnover</div>
        </div>

        {/* Maintenance (Rose) */}
        <div
          onClick={() => setStatusFilter('maintenance')}
          className={`p-3 rounded-md border cursor-pointer transition-all ${
            statusFilter === 'maintenance'
              ? 'border-rose-500 bg-rose-50/80 ring-1 ring-rose-500/40'
              : 'border-gray-200 bg-white hover:border-rose-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-800">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Maintenance
          </div>
          <div className="text-xl font-bold text-rose-950 mt-0.5">
            {matrixData.stats.maintenanceCount}
          </div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">Under repair</div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW MODE 1: ROOM MATRIX GROUPED BY ROOM TYPES (USER SPECIFIED)      */}
      {/* ===================================================================== */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          {/* Matrix Search & Quick Status Pills */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search room number, room category, or in-house guest name..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
              <span className="text-[11px] text-gray-400 mr-1 hidden sm:inline">Color Legend:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Occupied
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-orange-100 text-orange-800 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> Expired Due
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Housekeeping
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-100 text-rose-800 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Maintenance
              </span>
            </div>
          </div>

          {/* ROOM TYPE GROUPS */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-md border border-gray-200 p-12 text-center">
              <BedDouble className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-800">No rooms match filter criteria</div>
              <p className="text-xs text-gray-400 mt-1">Try resetting the status filter or search query.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setMatrixSearch('')
                }}
                className="mt-3 text-xs h-8 cursor-pointer"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isCollapsed = collapsedTypes[group.room_type_id]

              return (
                <div
                  key={group.room_type_id}
                  className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden"
                >
                  {/* GROUP HEADER: Room Type Details & Summary */}
                  <div
                    onClick={() => toggleCollapseType(group.room_type_id)}
                    className="p-3.5 bg-gray-50/70 hover:bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-md bg-[#5e2b9d]/10 text-[#5e2b9d] flex items-center justify-center font-bold">
                        <BedDouble className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
                            {group.room_type_name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] rounded-xs font-medium text-gray-600 bg-white">
                            {group.bed_type || 'Double Bed'}
                          </Badge>
                          <span className="text-[11px] text-gray-500">
                            &bull; Tariff: <strong className="text-gray-900">{formatCurrency(group.base_rate)}</strong>/night
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Capacity: Up to {group.max_occupancy} Guests &bull; Total Inventory: {group.total_rooms} Rooms
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mini Breakdown Pills */}
                      <div className="flex items-center gap-1.5 text-[10px] font-medium">
                        {group.available_count > 0 && (
                          <span className="px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {group.available_count} Avail
                          </span>
                        )}
                        {group.occupied_count > 0 && (
                          <span className="px-2 py-0.5 rounded-xs bg-blue-50 text-blue-800 border border-blue-200">
                            {group.occupied_count} Occ
                          </span>
                        )}
                        {group.overdue_count > 0 && (
                          <span className="px-2 py-0.5 rounded-xs bg-orange-500 text-white font-bold animate-pulse">
                            {group.overdue_count} Overdue
                          </span>
                        )}
                        {group.housekeeping_count > 0 && (
                          <span className="px-2 py-0.5 rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
                            {group.housekeeping_count} Dirty
                          </span>
                        )}
                        {group.maintenance_count > 0 && (
                          <span className="px-2 py-0.5 rounded-xs bg-rose-50 text-rose-800 border border-rose-200">
                            {group.maintenance_count} Maint
                          </span>
                        )}
                      </div>

                      <div className="text-gray-400 p-1">
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* ROOM CARDS GRID */}
                  {!isCollapsed && (
                    <div className="p-3.5 bg-gray-50/30">
                      {group.rooms.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">
                          No rooms in this category match the &ldquo;{statusFilter}&rdquo; filter.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {group.rooms.map((room) => {
                            const isAvailable = room.computed_status === 'available'
                            const isOccupied = room.computed_status === 'occupied'
                            const isOverdue = room.computed_status === 'overdue_checkout'
                            const isHousekeeping = room.computed_status === 'housekeeping'
                            const isMaintenance = room.computed_status === 'maintenance'

                            // Determine Shade Styles
                            let cardBg = 'bg-white border-gray-200'
                            let badgeStyle = 'bg-gray-100 text-gray-700'
                            let badgeLabel = 'Unknown'

                            if (isAvailable) {
                              cardBg =
                                'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/90 hover:shadow-xs'
                              badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              badgeLabel = 'Available'
                            } else if (isOccupied) {
                              cardBg =
                                'bg-blue-50/70 border-blue-300 hover:border-blue-400 hover:bg-blue-50/90 hover:shadow-xs'
                              badgeStyle = 'bg-blue-100 text-blue-800 border border-blue-300'
                              badgeLabel = 'Occupied'
                            } else if (isOverdue) {
                              cardBg =
                                'bg-orange-50 border-orange-400 ring-2 ring-orange-400/50 hover:shadow-md'
                              badgeStyle = 'bg-orange-500 text-white font-bold animate-pulse'
                              badgeLabel = 'Due Out Overdue'
                            } else if (isHousekeeping) {
                              cardBg =
                                'bg-amber-50/70 border-amber-300 hover:border-amber-400 hover:bg-amber-50/90 hover:shadow-xs'
                              badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-300'
                              badgeLabel = 'Housekeeping'
                            } else if (isMaintenance) {
                              cardBg =
                                'bg-rose-50/70 border-rose-300 hover:border-rose-400 hover:bg-rose-50/90 hover:shadow-xs'
                              badgeStyle = 'bg-rose-100 text-rose-800 border border-rose-300'
                              badgeLabel = 'Maintenance'
                            }

                            return (
                              <div
                                key={room.id}
                                className={`rounded-md border p-3 flex flex-col justify-between transition-all ${cardBg}`}
                              >
                                <div>
                                  {/* Top Row: Room Number & Badge */}
                                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-black/5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-base font-bold text-gray-900 tracking-tight">
                                        Room {room.room_number}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold tracking-wider ${badgeStyle}`}
                                    >
                                      {badgeLabel}
                                    </span>
                                  </div>

                                  {/* Middle Content */}
                                  <div className="py-2 space-y-1.5 text-xs">
                                    {/* Sub-info: Floor & Rate */}
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                                      <span>{room.floor_name || 'Floor 1'}</span>
                                      <span>{formatCurrency(room.base_rate)}/nt</span>
                                    </div>

                                    {/* 1. OCCUPIED CARD CONTENT */}
                                    {isOccupied && room.current_reservation && (
                                      <div className="space-y-1 pt-1 border-t border-blue-200/60">
                                        <div className="font-semibold text-blue-950 flex items-center gap-1 truncate">
                                          <span>👤 {room.current_reservation.guest_name}</span>
                                        </div>
                                        <div className="text-[10px] text-blue-800 flex items-center justify-between">
                                          <span>Out: {formatDate(room.current_reservation.check_out_date)}</span>
                                          <span className="font-mono text-[9px] bg-blue-100 px-1 py-0.2 rounded">
                                            {room.current_reservation.check_out_time || '11:00'}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-blue-800 flex items-center justify-between pt-0.5">
                                          <span className="text-gray-500">{room.current_reservation.guest_phone || 'No phone'}</span>
                                          {room.current_reservation.balance_amount > 0 ? (
                                            <span className="text-rose-700 font-semibold text-[9px]">
                                              Due: {formatCurrency(room.current_reservation.balance_amount)}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-700 font-medium text-[9px]">
                                              Paid ✓
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* 2. OVERDUE CHECKOUT CARD CONTENT */}
                                    {isOverdue && room.current_reservation && (
                                      <div className="space-y-1 pt-1 border-t border-orange-200">
                                        <div className="font-bold text-orange-950 flex items-center justify-between">
                                          <span className="truncate">👤 {room.current_reservation.guest_name}</span>
                                        </div>
                                        <div className="bg-orange-100/90 text-orange-900 rounded p-1 text-[10px] font-medium flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3 text-orange-700 shrink-0" />
                                          <span>Expired {room.current_reservation.overdue_text || 'Past Due'}</span>
                                        </div>
                                        <div className="text-[10px] text-orange-800 flex items-center justify-between pt-0.5">
                                          <span>Checkout was {room.current_reservation.check_out_time || '11:00'}</span>
                                          {room.current_reservation.balance_amount > 0 && (
                                            <span className="text-rose-700 font-bold text-[9px]">
                                              Due: {formatCurrency(room.current_reservation.balance_amount)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* 3. AVAILABLE CARD CONTENT */}
                                    {isAvailable && (
                                      <div className="space-y-1 pt-1 border-t border-emerald-200/60 text-emerald-900">
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                                          <Sparkles className="h-3 w-3 text-emerald-600" />
                                          <span>Clean &amp; Inspected</span>
                                        </div>
                                        {room.today_arrival ? (
                                          <div className="bg-emerald-100/80 text-emerald-900 rounded px-1.5 py-0.5 text-[10px] font-medium">
                                            Arrival today: <strong>{room.today_arrival.guest_name}</strong>
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-emerald-700">
                                            Ready for instant walk-in
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* 4. HOUSEKEEPING CARD CONTENT */}
                                    {isHousekeeping && (
                                      <div className="space-y-1 pt-1 border-t border-amber-200/60 text-amber-900">
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800">
                                          <RotateCcw className="h-3 w-3 text-amber-600" />
                                          <span>Turnover Cleaning Required</span>
                                        </div>
                                        <div className="text-[10px] text-amber-700">
                                          {room.db_status === 'cleaning'
                                            ? 'Attendant currently cleaning'
                                            : 'Vacant Dirty - Awaiting turnover'}
                                        </div>
                                      </div>
                                    )}

                                    {/* 5. MAINTENANCE CARD CONTENT */}
                                    {isMaintenance && (
                                      <div className="space-y-1 pt-1 border-t border-rose-200/60 text-rose-900">
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-rose-800">
                                          <Wrench className="h-3 w-3 text-rose-600" />
                                          <span>Under Maintenance</span>
                                        </div>
                                        <div className="text-[10px] text-rose-700 truncate">
                                          {room.notes || 'Repair ticket in progress'}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* BOTTOM ACTION BUTTONS */}
                                <div className="pt-2 border-t border-black/5 mt-1">
                                  {/* Occupied Actions */}
                                  {isOccupied && room.current_reservation && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openExtendStayModal(
                                            room.current_reservation!.id,
                                            room.id,
                                            room.current_reservation!.guest_name,
                                            room.room_number,
                                            room.current_reservation!.check_out_date,
                                            room.current_reservation!.check_out_time,
                                            room.current_reservation!.total_amount,
                                            room.base_rate
                                          )
                                        }
                                        className="h-7 text-[10px] font-medium border-blue-300 text-blue-900 hover:bg-blue-100 rounded-sm cursor-pointer"
                                      >
                                        <CalendarPlus className="h-3 w-3 mr-0.5" /> Extend
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openCheckOutModal(
                                            room.current_reservation!.id,
                                            room.id,
                                            room.current_reservation!.guest_name,
                                            room.room_number,
                                            room.current_reservation!.balance_amount
                                          )
                                        }
                                        className="h-7 text-[10px] font-medium border-blue-300 text-blue-900 hover:bg-blue-100 rounded-sm cursor-pointer"
                                      >
                                        <DoorClosed className="h-3 w-3 mr-0.5" /> Check Out
                                      </Button>
                                    </div>
                                  )}

                                  {/* Overdue Checkout Actions (Prominent & Urgent) */}
                                  {isOverdue && room.current_reservation && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          openExtendStayModal(
                                            room.current_reservation!.id,
                                            room.id,
                                            room.current_reservation!.guest_name,
                                            room.room_number,
                                            room.current_reservation!.check_out_date,
                                            room.current_reservation!.check_out_time,
                                            room.current_reservation!.total_amount,
                                            room.base_rate
                                          )
                                        }
                                        className="h-7 text-[10px] font-medium bg-[#5e2b9d] hover:bg-[#4d2282] text-white rounded-sm cursor-pointer"
                                      >
                                        <CalendarPlus className="h-3 w-3 mr-0.5" /> Extend
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          openCheckOutModal(
                                            room.current_reservation!.id,
                                            room.id,
                                            room.current_reservation!.guest_name,
                                            room.room_number,
                                            room.current_reservation!.balance_amount
                                          )
                                        }
                                        className="h-7 text-[10px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-sm cursor-pointer shadow-2xs"
                                      >
                                        <DoorClosed className="h-3 w-3 mr-0.5" /> Check Out
                                      </Button>
                                    </div>
                                  )}

                                  {/* Available Actions */}
                                  {isAvailable && (
                                    <div className="flex items-center gap-1.5">
                                      {room.today_arrival ? (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const match = arrivals.find((a) => a.id === room.today_arrival?.id)
                                            if (match) handleCheckIn(match)
                                          }}
                                          disabled={actionLoading === `checkin-${room.today_arrival.id}`}
                                          className="h-7 w-full text-[10px] font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm cursor-pointer"
                                        >
                                          <DoorOpen className="h-3 w-3 mr-1" /> Check In Arrival
                                        </Button>
                                      ) : (
                                        <>
                                          <Link href={`/reservations/new?type=walkin&roomId=${room.id}`} className="flex-1">
                                            <Button
                                              size="sm"
                                              className="h-7 w-full text-[10px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer"
                                            >
                                              <Plus className="h-3 w-3 mr-0.5" /> Walk-in
                                            </Button>
                                          </Link>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleMarkDirty(room)}
                                            disabled={actionLoading === `dirty-${room.id}`}
                                            className="h-7 px-2 text-[10px] border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-sm cursor-pointer"
                                            title="Mark Dirty for Turnover"
                                          >
                                            <RotateCcw className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Housekeeping Action -> 1 Click Mark Clean */}
                                  {isHousekeeping && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkClean(room)}
                                      disabled={actionLoading === `clean-${room.id}`}
                                      className="h-7 w-full text-[10px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer shadow-2xs"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Mark Clean (Available)
                                    </Button>
                                  )}

                                  {/* Maintenance Action -> 1 Click Mark Resolved */}
                                  {isMaintenance && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkMaintenanceResolved(room)}
                                      disabled={actionLoading === `maint-resolve-${room.id}`}
                                      className="h-7 w-full text-[10px] font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-sm cursor-pointer shadow-2xs"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Mark Resolved (Turnover)
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 2: OPERATIONS QUEUE (ARRIVALS, DEPARTURES, IN-HOUSE TABLES) */}
      {/* ===================================================================== */}
      {viewMode === 'queues' && (
        <div className="space-y-4">
          {/* Queue Tab Buttons & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reg #, guest name, phone, room, or origin..."
                value={queueSearchTerm}
                onChange={(e) => setQueueSearchTerm(e.target.value)}
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

          {/* Operations Table */}
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
                {currentQueueList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <div className="font-medium text-gray-800 text-xs">No records for this queue</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        All scheduled tasks completed or no matches found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentQueueList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {/* 1. Reg # & Booking */}
                      <td className="px-3.5 py-3">
                        <span className="font-semibold text-gray-900 block">{item.resNumber}</span>
                        <span className="text-[10px] text-gray-400 block">{item.roomType}</span>
                        <span className="text-[9px] text-[#5e2b9d] font-mono">
                          Reg: {item.guestRegNumber}
                        </span>
                      </td>

                      {/* 2. Guest & KYC */}
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

                      {/* 3. Room & Key Card */}
                      <td className="px-3.5 py-3">
                        {item.roomNumber && item.roomNumber !== 'Unallocated' ? (
                          <span className="font-semibold text-[#5e2b9d] text-xs block">
                            Room {item.roomNumber}
                          </span>
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
                          Stay: {formatDate(item.checkInDate)} to {formatDate(item.checkOutDate)}
                        </div>
                      </td>

                      {/* 5. Occupants */}
                      <td className="px-3.5 py-3 text-[11px] text-gray-700">
                        <div>
                          <strong>{item.occupants}</strong> total
                        </div>
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

                      {/* 8. Quick Actions */}
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
                                  setCollectAmount('')
                                  setCollectMode('UPI')
                                  setCollectRef('')
                                }}
                                className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-sm cursor-pointer font-medium"
                                title="Collect Pending Balance"
                              >
                                <Wallet className="h-3 w-3 mr-0.5" />₹ Collect
                              </Button>
                            )}

                            {/* Change Room */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setChangeRoomGuest(item)
                                const eligible = availableRooms.find(
                                  (r) => r.status === 'available' && r.id !== item.roomId
                                )
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
                              onClick={() =>
                                openExtendStayModal(
                                  item.id,
                                  item.roomId,
                                  item.guestName,
                                  item.roomNumber,
                                  item.checkOutDate,
                                  item.checkOutTime || '11:00',
                                  item.total,
                                  2000
                                )
                              }
                              className="h-7 px-2 text-xs text-gray-700 border-gray-200 hover:bg-gray-100 rounded-sm cursor-pointer"
                              title="Extend Guest Stay"
                            >
                              <CalendarPlus className="h-3 w-3" />
                            </Button>

                            {/* Check Out */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openCheckOutModal(
                                  item.id,
                                  item.roomId,
                                  item.guestName,
                                  item.roomNumber,
                                  item.balance
                                )
                              }
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
        </div>
      )}

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
                <div>
                  Booking: <strong>{modalGuest.resNumber}</strong>
                </div>
                <div>Category: {modalGuest.roomType} &bull; {modalGuest.occupants} Occupant(s)</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Assign Room Unit *
                </label>
                <SearchableSelect
                  value={selectedRoomId}
                  onChange={setSelectedRoomId}
                  placeholder="Choose an available room..."
                >
                  {availableRooms
                    .filter((r) => r.status === 'available')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.floor_name || 'Standard'}) - Available
                      </option>
                    ))}
                </SearchableSelect>
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
      {/* MODAL 2: EXTEND GUEST STAY (DATE & TIME SYNCHRONIZED)    */}
      {/* ======================================================== */}
      {extendStayItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-xs font-semibold text-gray-900">
                  Extend Stay: {extendStayItem.guestName}
                </h3>
                {extendStayItem.roomNumber && (
                  <p className="text-[10px] text-[#5e2b9d] font-medium mt-0.5">
                    Room {extendStayItem.roomNumber}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setExtendStayItem(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                <div className="text-[11px] text-gray-500">Current Scheduled Departure:</div>
                <div className="font-semibold text-gray-800">
                  {formatDate(extendStayItem.currentCheckOutDate)} at{' '}
                  {extendStayItem.currentCheckOutTime || '11:00 AM'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Departure Date *
                </label>
                <CustomDatePicker
                  value={newCheckoutDate}
                  minDate={extendStayItem.currentCheckOutDate}
                  onChange={setNewCheckoutDate}
                  placeholder="Select new checkout date..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Departure Time *
                </label>
                <CustomTimePicker
                  value={newCheckoutTime}
                  onChange={setNewCheckoutTime}
                  placeholder="Select checkout time..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Additional Tariff Charges (₹)
                </label>
                <input
                  type="number"
                  placeholder={extendStayItem?.baseRate ? String(extendStayItem.baseRate) : '0.00'}
                  value={extraStayCharges}
                  onChange={(e) => setExtraStayCharges(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Added to reservation folio automatically.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtendStayItem(null)}
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
      {/* MODAL 3: CHECK-OUT CONFIRMATION MODAL                   */}
      {/* ======================================================== */}
      {checkOutItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Process Check-Out: {checkOutItem.guestName}
              </span>
              <button
                type="button"
                onClick={() => setCheckOutItem(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
                <div>
                  Room: <strong>Room {checkOutItem.roomNumber || 'N/A'}</strong>
                </div>
                <div>Guest: {checkOutItem.guestName}</div>
              </div>

              {checkOutItem.balance > 0 ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-rose-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>Pending Balance: {formatCurrency(checkOutItem.balance)}</span>
                  </div>
                  <p className="text-[10px] text-rose-700">
                    Guest has an outstanding bill. You can proceed with checkout or collect payment first.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Folio is fully settled. Zero outstanding balance.</span>
                </div>
              )}

              <p className="text-[11px] text-gray-500">
                Confirming checkout will release the guest and automatically mark the room as{' '}
                <strong className="text-amber-800 font-semibold">&ldquo;Dirty&rdquo;</strong> for housekeeping turnover.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckOutItem(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCheckOut}
                disabled={actionLoading === `checkout-${checkOutItem.reservationId}`}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                Confirm Check-Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CHANGE ROOM REASSIGNMENT */}
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
                Current: <strong>Room {changeRoomGuest.roomNumber}</strong>. Reassigning will mark current
                room as &ldquo;Dirty&rdquo; for turnover inspection.
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select New Available Room *
                </label>
                <SearchableSelect
                  value={newRoomId}
                  onChange={setNewRoomId}
                  placeholder="Select new available room..."
                >
                  {availableRooms
                    .filter((r) => r.status === 'available' && r.id !== changeRoomGuest.roomId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.floor_name || 'Standard'}) - Available
                      </option>
                    ))}
                </SearchableSelect>
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
      {/* MODAL 5: COLLECT FRONT DESK PAYMENT */}
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
                <span className="font-bold text-rose-600 text-sm">
                  {formatCurrency(paymentGuest.balance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  placeholder={paymentGuest ? String(paymentGuest.balance) : '0.00'}
                  value={collectAmount}
                  max={paymentGuest.balance}
                  onChange={(e) => setCollectAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] font-semibold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Mode *
                </label>
                <SearchableSelect
                  value={collectMode}
                  onChange={setCollectMode}
                  placeholder="Select payment mode..."
                >
                  <option value="UPI">UPI (QR / Google Pay / PhonePe)</option>
                  <option value="Cash">Cash (Front Desk Drawer)</option>
                  <option value="Credit Card">Credit Card (POS Swipe)</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                </SearchableSelect>
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
      {/* MODAL 6: PRINTABLE GUEST REGISTRATION CARD (FORM C/REG CARD) */}
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

            <div className="border border-gray-300 rounded p-4 text-xs space-y-3 bg-white">
              <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{initialProp.name}</h4>
                  <p className="text-[10px] text-gray-500">
                    {initialProp.address}, {initialProp.city}
                  </p>
                </div>
                <div className="text-right text-[10px]">
                  <div>
                    Reg No: <strong>{regCardGuest.guestRegNumber}</strong>
                  </div>
                  <div>Booking: {regCardGuest.resNumber}</div>
                  <div>Date: {formatDate(regCardGuest.checkInDate)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  Guest Name: <strong>{regCardGuest.guestName}</strong>
                </div>
                <div>
                  Category: <strong>{regCardGuest.guestCategory}</strong>
                </div>
                <div>Mobile: {regCardGuest.phone || 'N/A'}</div>
                <div>Email: {regCardGuest.email || 'N/A'}</div>
                <div>Arrived From: {regCardGuest.arrivedFrom}</div>
                <div>Proceeding To: {regCardGuest.nextDestination}</div>
                <div>ID Type: {regCardGuest.idType}</div>
                <div>ID Number: {regCardGuest.idNumber || 'Verified'}</div>
                <div>
                  Allocated Room: <strong>Room {regCardGuest.roomNumber}</strong>
                </div>
                <div>
                  Key Card: <strong>{regCardGuest.keyCardNumber || 'Key #1'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                <p className="font-semibold text-gray-700">Guest Declaration:</p>
                <p className="italic mt-0.5">
                  I hereby declare that the particulars given above are true and correct. I agree to abide by the
                  hotel rules and policies, and acknowledge that my luggage and belongings are kept at my own
                  risk.
                </p>
              </div>

              <div className="pt-6 flex justify-between items-end text-[10px] text-gray-600">
                <div className="border-t border-gray-400 pt-1 w-40 text-center">Receptionist Signature</div>
                <div className="border-t border-gray-400 pt-1 w-40 text-center">Guest Signature</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
