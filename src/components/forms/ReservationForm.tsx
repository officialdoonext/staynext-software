'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarPlus,
  ArrowLeft,
  Building2,
  User,
  CreditCard,
  Sparkles,
  Check,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BedDouble,
  Clock,
  ShieldCheck,
  Globe,
  FileText,
  Users,
  FileCheck,
  Plus,
  Trash2,
  DoorOpen,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Printer,
  PenTool,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createReservation, AccompanyingGuestItem } from '@/services/reservation.service'
import { RoomItem, RoomTypeItem } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatCurrency, formatDate, formatTimeString } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import { CustomTimePicker } from '@/components/ui/custom-time-picker'

interface ReservationFormProps {
  property: PropertyItem
  properties: PropertyItem[]
  roomTypes: RoomTypeItem[]
  availableRooms: RoomItem[]
}

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Australia',
  'Canada',
  'Singapore',
  'Germany',
  'France',
  'Japan',
  'Malaysia',
  'Saudi Arabia',
  'Russia',
  'China',
  'Sri Lanka',
  'Nepal',
  'Bangladesh',
  'Other'
]

const GUEST_TYPES = [
  'Individual',
  'Couple',
  'Family',
  'Corporate',
  'Group',
  'Walk-in Guest'
]

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say'
]

const ID_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Voter ID',
  'Driving Licence',
  'Passport',
  'Other Government ID'
]

const BOOKING_TYPES = [
  'Walk-in',
  'Online Booking',
  'Advance Booking',
  'Corporate Booking',
  'Group Booking'
]

const BOOKING_SOURCES = [
  'Direct',
  'Hotel Website',
  'Phone',
  'Walk-in',
  'MakeMyTrip',
  'Goibibo',
  'Booking.com',
  'Agoda',
  'Expedia',
  'Other'
]

const PURPOSE_OPTIONS = [
  'Business',
  'Tourism',
  'Family Visit',
  'Personal',
  'Medical',
  'Transit',
  'Other'
]

const VISA_TYPES = [
  'Tourist Visa',
  'Business Visa',
  'Employment Visa',
  'Student Visa',
  'Medical Visa',
  'Conference Visa',
  'Entry Visa',
  'Transit Visa',
  'Other'
]

const PAYMENT_MODES = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Online Payment',
  'Credit / Pay Later'
]

const RELATIONSHIPS = [
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Friend',
  'Colleague',
  'Other'
]

type TabKey = 'guest' | 'identity' | 'stay' | 'room' | 'billing' | 'accompanying' | 'review'

export default function ReservationForm({
  property: initialProp,
  properties,
  roomTypes,
  availableRooms,
}: ReservationFormProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const [activeTab, setActiveTab] = useState<TabKey>('guest')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const defaultEndStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]

  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)

  // Form State
  const [formData, setFormData] = useState({
    // 1. Guest Information
    guest_type: 'Individual',
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    age: '',
    phone: '',
    alternate_phone: '',
    email: '',
    nationality: 'India',
    occupation: '',
    company_name: '',

    // 2. Identity & Documents
    id_type: 'Aadhaar Card',
    id_number: '',
    id_issue_date: '',
    id_expiry_date: '',
    id_verification_status: 'Verified',
    verified_by: 'Front Desk Reception',
    verification_date: todayStr,
    id_document_name: '',

    // Foreign Guest / Form III
    is_foreign_guest: false,
    passport_number: '',
    passport_issue_date: '',
    passport_expiry_date: '',
    passport_issue_country: '',
    passport_issue_place: '',
    visa_number: '',
    visa_type: 'Tourist Visa',
    visa_issue_date: '',
    visa_expiry_date: '',
    permanent_address_abroad: '',
    address_in_india: '',
    date_of_arrival_in_india: '',
    arrived_from: '',
    expected_duration_days: '3',
    guest_photo_name: '',

    // 3. Booking & Stay Details
    booking_type: 'Walk-in',
    booking_source: 'Walk-in',
    booking_date: todayStr,
    check_in_date: todayStr,
    check_in_time: initialProp.check_in_time || '14:00',
    check_out_date: defaultEndStr,
    check_out_time: initialProp.check_out_time || '11:00',
    num_adults: 2,
    num_children: 0,
    purpose_of_visit: 'Personal',
    special_requests: '',
    immediate_check_in: true,

    // 4. Room Allocation
    room_id: '',
    selected_room_type_id: roomTypes[0]?.id || '',
    room_tariff: roomTypes[0]?.base_rate || 2500,
    extra_bed: false,
    extra_bed_charges: 500,

    // 5. Payment & Billing Details
    food_charges: 0,
    other_charges: 0,
    discount_amount: 0,
    gst_rate: 12,
    paid_amount: 0,
    payment_mode: 'UPI',
    transaction_reference: '',

    // 7. Check-in & Signature
    key_card_number: '',
    checkin_handled_by: 'Front Desk Staff',
    guest_signature: '',
  })

  // Accompanying Guests List
  const [accompanyingGuests, setAccompanyingGuests] = useState<AccompanyingGuestItem[]>([])

  const setField = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  // Calculate age from date of birth
  const handleDobChange = (dobStr: string) => {
    if (!dobStr) {
      setFormData((prev) => ({ ...prev, date_of_birth: '', age: '' }))
      return
    }
    const dob = new Date(dobStr)
    const diffMs = Date.now() - dob.getTime()
    const ageYears = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
    setFormData((prev) => ({
      ...prev,
      date_of_birth: dobStr,
      age: isNaN(ageYears) || ageYears < 0 ? '' : String(ageYears)
    }))
  }

  // Calculate nights
  const checkIn = new Date(formData.check_in_date)
  const checkOut = new Date(formData.check_out_date)
  const diffTime = Math.max(0, checkOut.getTime() - checkIn.getTime())
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  // Selected room details lookup
  const selectedRoom = useMemo(() => {
    return availableRooms.find((r) => r.id === formData.room_id)
  }, [availableRooms, formData.room_id])

  const currentRoomType = useMemo(() => {
    if (selectedRoom?.room_type_id) {
      return roomTypes.find((rt) => rt.id === selectedRoom.room_type_id) || roomTypes[0]
    }
    return roomTypes.find((rt) => rt.id === formData.selected_room_type_id) || roomTypes[0]
  }, [roomTypes, selectedRoom, formData.selected_room_type_id])

  // When room is selected, auto-populate room type, floor, bed type, and room tariff
  const handleRoomSelect = (roomId: string) => {
    const room = availableRooms.find((r) => r.id === roomId)
    if (room) {
      const type = roomTypes.find((rt) => rt.id === room.room_type_id)
      setFormData((prev) => ({
        ...prev,
        room_id: room.id,
        selected_room_type_id: room.room_type_id,
        room_tariff: room.base_rate || type?.base_rate || prev.room_tariff,
      }))
    } else {
      setFormData((prev) => ({ ...prev, room_id: '' }))
    }
  }

  // Financial calculations
  const roomTariff = Number(formData.room_tariff) || 0
  const roomCharges = roomTariff * nights
  const extraBedTotal = formData.extra_bed ? Number(formData.extra_bed_charges) * nights : 0
  const foodCharges = Number(formData.food_charges) || 0
  const otherCharges = Number(formData.other_charges) || 0
  const discountAmount = Number(formData.discount_amount) || 0

  const subtotal = Math.max(0, roomCharges + extraBedTotal + foodCharges + otherCharges - discountAmount)
  const gstRate = Number(formData.gst_rate) || 0
  const taxAmount = Math.round(((subtotal * gstRate) / 100) * 100) / 100
  const cgstAmount = Math.round((taxAmount / 2) * 100) / 100
  const sgstAmount = Math.round((taxAmount / 2) * 100) / 100
  const totalAmount = subtotal + taxAmount
  const paidAmount = Number(formData.paid_amount) || 0
  const balanceAmount = Math.max(0, totalAmount - paidAmount)

  // Accompanying Guests Handlers
  const handleAddAccompanyingGuest = () => {
    setAccompanyingGuests((prev) => [
      ...prev,
      {
        id: `acc-${Date.now()}`,
        name: '',
        age: '',
        gender: 'Male',
        relationship: 'Spouse',
        phone: '',
        nationality: 'India',
        id_type: 'Aadhaar Card',
        id_number: '',
        verification_status: 'Verified',
      },
    ])
  }

  const handleUpdateAccompanyingGuest = (idx: number, field: keyof AccompanyingGuestItem, val: any) => {
    setAccompanyingGuests((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: val }
      return updated
    })
  }

  const handleRemoveAccompanyingGuest = (idx: number) => {
    setAccompanyingGuests((prev) => prev.filter((_, i) => i !== idx))
  }

  // Signature Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e1e1e'
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      if (canvasRef.current) {
        setFormData((prev) => ({ ...prev, guest_signature: canvasRef.current?.toDataURL() || '' }))
      }
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setFormData((prev) => ({ ...prev, guest_signature: '' }))
  }

  // Handle generic input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => {
        const next = { ...prev, [name]: value }
        if (name === 'nationality') {
          next.is_foreign_guest = value !== 'India'
        }
        return next
      })
    }
  }

  // Validation
  const validateForm = () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setActiveTab('guest')
      setErrorMsg('Guest First Name and Last Name are required.')
      return false
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      setActiveTab('guest')
      setErrorMsg('Please provide at least a primary mobile number or email address.')
      return false
    }
    if (!formData.id_type || !formData.id_number.trim()) {
      setActiveTab('identity')
      setErrorMsg('ID Proof Type and ID Number are required for hotel registration records.')
      return false
    }
    if (formData.is_foreign_guest && !formData.passport_number.trim()) {
      setActiveTab('identity')
      setErrorMsg('Passport Number is mandatory for foreign nationals under Form III compliance.')
      return false
    }
    if (!formData.check_in_date || !formData.check_out_date) {
      setActiveTab('stay')
      setErrorMsg('Check-in and Check-out dates are required.')
      return false
    }
    return true
  }

  // Final Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await createReservation({
        property_id: selectedPropertyId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        guest_type: formData.guest_type,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || undefined,
        age: formData.age || undefined,
        phone: formData.phone,
        alternate_phone: formData.alternate_phone || undefined,
        email: formData.email,
        nationality: formData.nationality,
        occupation: formData.occupation || undefined,
        company_name: formData.company_name || undefined,

        id_type: formData.id_type,
        id_number: formData.id_number,
        id_issue_date: formData.id_issue_date || undefined,
        id_expiry_date: formData.id_expiry_date || undefined,
        id_verification_status: formData.id_verification_status,
        verified_by: formData.verified_by,
        verification_date: formData.verification_date,
        id_document_url: formData.id_document_name || undefined,

        is_foreign_guest: formData.is_foreign_guest,
        passport_number: formData.passport_number || undefined,
        passport_issue_date: formData.passport_issue_date || undefined,
        passport_expiry_date: formData.passport_expiry_date || undefined,
        passport_issue_country: formData.passport_issue_country || undefined,
        passport_issue_place: formData.passport_issue_place || undefined,
        visa_number: formData.visa_number || undefined,
        visa_type: formData.visa_type || undefined,
        visa_issue_date: formData.visa_issue_date || undefined,
        visa_expiry_date: formData.visa_expiry_date || undefined,
        permanent_address_abroad: formData.permanent_address_abroad || undefined,
        address_in_india: formData.address_in_india || undefined,
        date_of_arrival_in_india: formData.date_of_arrival_in_india || undefined,
        arrived_from: formData.arrived_from || undefined,
        purpose_of_visit: formData.purpose_of_visit || undefined,
        expected_duration_days: formData.expected_duration_days || undefined,
        guest_photo_url: formData.guest_photo_name || undefined,

        booking_type: formData.booking_type,
        booking_source: formData.booking_source,
        booking_date: formData.booking_date,
        check_in_date: formData.check_in_date,
        check_in_time: formData.check_in_time,
        check_out_date: formData.check_out_date,
        check_out_time: formData.check_out_time,
        num_adults: Number(formData.num_adults),
        num_children: Number(formData.num_children),
        special_requests: formData.special_requests,
        immediate_check_in: formData.immediate_check_in,
        status: formData.immediate_check_in ? 'checked_in' : 'confirmed',

        room_type_id: currentRoomType?.id || roomTypes[0]?.id,
        room_id: formData.room_id || undefined,
        room_tariff: roomTariff,
        extra_bed: formData.extra_bed,
        extra_bed_charges: extraBedTotal,

        room_charges: roomCharges,
        food_charges: foodCharges,
        other_charges: otherCharges,
        discount_amount: discountAmount,
        subtotal_amount: subtotal,
        taxable_amount: subtotal,
        gst_rate: gstRate,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        payment_mode: formData.payment_mode,
        transaction_reference: formData.transaction_reference,

        accompanying_guests: accompanyingGuests,
        key_card_number: formData.key_card_number || undefined,
        guest_signature: formData.guest_signature || undefined,
        checkin_handled_by: formData.checkin_handled_by || undefined,
      })

      if (!res.success) throw new Error(res.error || 'Failed to register guest reservation')

      setSuccessMsg(
        formData.immediate_check_in
          ? `Guest ${formData.first_name} ${formData.last_name} checked in successfully to Room ${selectedRoom?.room_number || 'Reserved'}! (Booking #${res.data?.reservation_number})`
          : `Reservation #${res.data?.reservation_number} registered successfully for ${formData.first_name} ${formData.last_name}!`
      )

      setTimeout(() => {
        router.push(formData.immediate_check_in ? '/front-desk' : '/reservations')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving room registration to database.')
    } finally {
      setLoading(false)
    }
  }

  // Navigation tabs definition
  const TABS: { key: TabKey; label: string; icon: React.ReactNode; number: string }[] = [
    { key: 'guest', label: 'Guest Info', icon: <User className="h-4 w-4" />, number: '1' },
    { key: 'identity', label: 'ID & Verification', icon: <ShieldCheck className="h-4 w-4" />, number: '2' },
    { key: 'stay', label: 'Stay & Booking', icon: <Calendar className="h-4 w-4" />, number: '3' },
    { key: 'room', label: 'Room Allocation', icon: <DoorOpen className="h-4 w-4" />, number: '4' },
    { key: 'billing', label: 'Payment & Billing', icon: <CreditCard className="h-4 w-4" />, number: '5' },
    { key: 'accompanying', label: `Accompanying (${accompanyingGuests.length})`, icon: <Users className="h-4 w-4" />, number: '6' },
    { key: 'review', label: 'Check-in & Summary', icon: <FileCheck className="h-4 w-4" />, number: '7' },
  ]

  const currentTabIdx = TABS.findIndex((t) => t.key === activeTab)

  const handleNextTab = () => {
    if (currentTabIdx < TABS.length - 1) {
      setActiveTab(TABS[currentTabIdx + 1].key)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevTab = () => {
    if (currentTabIdx > 0) {
      setActiveTab(TABS[currentTabIdx - 1].key)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="w-full space-y-6 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reservations">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer border-gray-200">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900 flex items-center gap-2">
              <span>Room Registration &amp; Guest Check-in</span>
              <Badge className="bg-[#5e2b9d] text-white text-[10px] font-medium rounded">
                Form F &amp; FRRO Ready
              </Badge>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Comprehensive 6-section guest folio: verification, stay details, room assignment, GST billing &amp; signatures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <div className="w-52">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={setSelectedPropertyId}
                placeholder="Switch Property..."
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SearchableSelect>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#f7f2fd] border border-[#dfcef6] px-3 py-1 rounded-md text-xs text-[#5e2b9d]">
            <span className="font-semibold">New Reservation</span>
            <span className="text-gray-400">|</span>
            <span className="font-mono text-[11px]">Auto-Generated ID</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs flex items-start gap-2 shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs flex items-start gap-2 shadow-2xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">{successMsg}</div>
            <p className="text-emerald-700 mt-0.5">Redirecting to management dashboard...</p>
          </div>
        </div>
      )}

      {/* Tab Stepper Bar */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[720px]">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.key
            const isCompleted = idx < currentTabIdx

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#5e2b9d] text-white shadow-2xs'
                    : isCompleted
                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                    isActive
                      ? 'bg-white text-[#5e2b9d]'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : tab.number}
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Layout: Tab Form Content + Sticky Stay Summary on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Tab Form Panels (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-md border-gray-200 shadow-2xs">
            <CardHeader className="py-3 px-5 border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {TABS.find((t) => t.key === activeTab)?.icon}
                  <span>Section {currentTabIdx + 1}: {TABS.find((t) => t.key === activeTab)?.label}</span>
                </CardTitle>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Step {currentTabIdx + 1} of 7</span>
            </CardHeader>

            <CardContent className="p-5 text-xs">
              {/* ========================================================================= */}
              {/* 1. GUEST INFORMATION */}
              {/* ========================================================================= */}
              {activeTab === 'guest' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Guest ID</label>
                      <input
                        type="text"
                        readOnly
                        value="Auto-generated on save"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Guest Type *</label>
                      <select
                        name="guest_type"
                        value={formData.guest_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        {GUEST_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">First Name *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="e.g. Ramesh"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Last Name / Surname *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="e.g. Kumar"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={(e) => handleDobChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Age (Years)</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Auto-calculated"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Nationality *</label>
                      <select
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Mobile Number (+91) *</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-md font-medium text-xs">
                          +91
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="9876543210"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-r-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Alternate Contact Number</label>
                      <input
                        type="tel"
                        name="alternate_phone"
                        value={formData.alternate_phone}
                        onChange={handleChange}
                        placeholder="Optional secondary number"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="guest@example.com"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Occupation</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        placeholder="e.g. Software Consultant"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Company / Organization</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="e.g. Doonext Tech Pvt Ltd"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2. IDENTITY & DOCUMENT DETAILS (Including Form III / Form C) */}
              {/* ========================================================================= */}
              {activeTab === 'identity' && (
                <div className="space-y-5">
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-md text-amber-900 text-[11px] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      <span>Identity Verification &amp; Data Protection Compliance</span>
                    </div>
                    <p className="text-amber-800">
                      Do not make Aadhaar the only accepted document. Alternative identity credentials (Voter ID, Driving Licence, Passport) are fully accepted.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">ID Proof Type *</label>
                      <select
                        name="id_type"
                        value={formData.id_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        {ID_TYPES.map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">ID Proof Number *</label>
                      <input
                        type="text"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleChange}
                        placeholder="e.g. XXXX-XXXX-1234 or DL/Passport #"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">ID Verification Status *</label>
                      <select
                        name="id_verification_status"
                        value={formData.id_verification_status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        <option value="Verified">Verified (Original Inspected)</option>
                        <option value="Pending">Pending Physical Verification</option>
                        <option value="Rejected">Document Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">ID Document Upload / Attachment</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFormData((prev) => ({ ...prev, id_document_name: file.name }))
                          }
                        }}
                        className="w-full text-[11px] file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#f7f2fd] file:text-[#5e2b9d] hover:file:bg-[#dfcef6] cursor-pointer"
                      />
                      {formData.id_document_name && (
                        <span className="text-[10px] text-emerald-600 block mt-1">Attached: {formData.id_document_name}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">ID Issue Date</label>
                      <input
                        type="date"
                        name="id_issue_date"
                        value={formData.id_issue_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">ID Expiry Date</label>
                      <input
                        type="date"
                        name="id_expiry_date"
                        value={formData.id_expiry_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Foreign National / Form III (Form C) Reporting */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#5e2b9d]" />
                        <span className="font-semibold text-gray-900 text-xs">
                          Foreign National / Form III (earlier Form C) Reporting
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_foreign_guest"
                          checked={formData.is_foreign_guest}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-[#5e2b9d] focus:ring-[#5e2b9d] h-4 w-4 cursor-pointer"
                        />
                        <span>Is Foreign National / OCI Holder</span>
                      </label>
                    </div>

                    {formData.is_foreign_guest && (
                      <div className="space-y-4 bg-purple-50/40 p-4 rounded-md border border-purple-100 animate-in fade-in-50 duration-150">
                        <div className="text-[11px] text-purple-900 bg-white/70 p-2.5 rounded border border-purple-200">
                          <strong>FRRO Form III Rule:</strong> Under the Immigration and Foreigners Act, 2025, hotels must report all foreign guests (including OCI cardholders) to the FRRO portal within 24 hours of arrival and departure.
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Passport Number *</label>
                            <input
                              type="text"
                              name="passport_number"
                              value={formData.passport_number}
                              onChange={handleChange}
                              placeholder="e.g. A12345678"
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Passport Issue Country</label>
                            <select
                              name="passport_issue_country"
                              value={formData.passport_issue_country || formData.nationality}
                              onChange={handleChange}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                            >
                              {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Passport Issue Place</label>
                            <input
                              type="text"
                              name="passport_issue_place"
                              value={formData.passport_issue_place}
                              onChange={handleChange}
                              placeholder="City / Authority"
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Passport Issue Date</label>
                            <input
                              type="date"
                              name="passport_issue_date"
                              value={formData.passport_issue_date}
                              onChange={handleChange}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Passport Expiry Date</label>
                            <input
                              type="date"
                              name="passport_expiry_date"
                              value={formData.passport_expiry_date}
                              onChange={handleChange}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Visa Number</label>
                            <input
                              type="text"
                              name="visa_number"
                              value={formData.visa_number}
                              onChange={handleChange}
                              placeholder="e.g. V98765432"
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Visa Type</label>
                            <select
                              name="visa_type"
                              value={formData.visa_type}
                              onChange={handleChange}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                            >
                              {VISA_TYPES.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Date of Arrival in India</label>
                            <input
                              type="date"
                              name="date_of_arrival_in_india"
                              value={formData.date_of_arrival_in_india}
                              onChange={handleChange}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Permanent Address Abroad</label>
                            <textarea
                              rows={2}
                              name="permanent_address_abroad"
                              value={formData.permanent_address_abroad}
                              onChange={handleChange}
                              placeholder="Home country address..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Contact Address in India</label>
                            <textarea
                              rows={2}
                              name="address_in_india"
                              value={formData.address_in_india}
                              onChange={handleChange}
                              placeholder="Local reference or hotel address..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 3. BOOKING & STAY DETAILS */}
              {/* ========================================================================= */}
              {activeTab === 'stay' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Booking Type *</label>
                      <SearchableSelect
                        value={formData.booking_type}
                        onChange={(val) => setField('booking_type', val)}
                        placeholder="Select booking type..."
                      >
                        {BOOKING_TYPES.map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </SearchableSelect>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Booking Source *</label>
                      <SearchableSelect
                        value={formData.booking_source}
                        onChange={(val) => setField('booking_source', val)}
                        placeholder="Select booking source..."
                      >
                        {BOOKING_SOURCES.map((bs) => (
                          <option key={bs} value={bs}>{bs}</option>
                        ))}
                      </SearchableSelect>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Purpose of Visit</label>
                      <SearchableSelect
                        value={formData.purpose_of_visit}
                        onChange={(val) => setField('purpose_of_visit', val)}
                        placeholder="Select purpose..."
                      >
                        {PURPOSE_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </SearchableSelect>
                    </div>
                  </div>

                  {/* Dates & Timings */}
                  <div className="p-4 bg-gray-50/80 rounded-md border border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Check-In */}
                      <div className="space-y-2">
                        <label className="block text-gray-900 font-semibold text-xs flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#5e2b9d]" />
                          <span>Check-in Date &amp; Timing *</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <CustomDatePicker
                            value={formData.check_in_date}
                            onChange={(val) => setField('check_in_date', val)}
                            placeholder="Check-in Date"
                          />
                          <CustomTimePicker
                            value={formData.check_in_time}
                            onChange={(val) => setField('check_in_time', val)}
                            placeholder="Check-in Time"
                          />
                        </div>
                      </div>

                      {/* Check-Out */}
                      <div className="space-y-2">
                        <label className="block text-gray-900 font-semibold text-xs flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#5e2b9d]" />
                          <span>Check-out Date &amp; Timing *</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <CustomDatePicker
                            value={formData.check_out_date}
                            minDate={formData.check_in_date}
                            onChange={(val) => setField('check_out_date', val)}
                            placeholder="Check-out Date"
                          />
                          <CustomTimePicker
                            value={formData.check_out_time}
                            onChange={(val) => setField('check_out_time', val)}
                            placeholder="Check-out Time"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                      <span className="text-gray-600">Calculated Stay Duration:</span>
                      <span className="font-bold text-[#5e2b9d] bg-[#f7f2fd] px-3 py-1 rounded">
                        {nights} Night{nights > 1 ? 's' : ''} Stay ({formatDate(formData.check_in_date)} {formatTimeString(formData.check_in_time)} &rarr; {formatDate(formData.check_out_date)} {formatTimeString(formData.check_out_time)})
                      </span>
                    </div>
                  </div>

                  {/* Occupancy counts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Number of Adults *</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        name="num_adults"
                        value={formData.num_adults}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Number of Children</label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        name="num_children"
                        value={formData.num_children}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Special Requests &amp; Guest Preferences</label>
                    <textarea
                      rows={2}
                      name="special_requests"
                      value={formData.special_requests}
                      onChange={handleChange}
                      placeholder="e.g. Quiet room away from elevator, extra pillows, airport pickup request..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>

                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-md flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 block">Immediate Walk-in Check-in</span>
                      <span className="text-[11px] text-gray-500">
                        Check-in guest immediately upon submission (assigns key card &amp; marks room as occupied).
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="immediate_check_in"
                        checked={formData.immediate_check_in}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-[#5e2b9d] focus:ring-[#5e2b9d] h-4 w-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 4. ROOM ALLOCATION */}
              {/* ========================================================================= */}
              {activeTab === 'room' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Automatic Auto-Fill:</strong> Selecting a Room Number will automatically populate the Room Category, Floor Number, Wing/Building, Bed Type, and Tariff.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Room Selector */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Select Room Number *</label>
                      <SearchableSelect
                        value={formData.room_id}
                        onChange={handleRoomSelect}
                        placeholder="-- Choose an Available Room --"
                      >
                        <option value="">-- Choose an Available Room --</option>
                        {availableRooms
                          .filter((r) => r.status === 'available')
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              Room {r.room_number} — {r.room_type_name} ({r.floor_name || 'Ground'} · {r.building_name || 'Main'})
                            </option>
                          ))}
                      </SearchableSelect>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        Only available rooms without date conflicts are shown.
                      </span>
                    </div>

                    {/* Room Category */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Room Category / Type</label>
                      <input
                        type="text"
                        readOnly
                        value={selectedRoom?.room_type_name || currentRoomType?.name || 'Standard Room'}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md font-semibold text-[#5e2b9d] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Auto-filled Attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Floor Number:</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {selectedRoom?.floor_name || 'Floor 1'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">Building / Wing:</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {selectedRoom?.building_name || 'Main Building'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">Bed Type:</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {currentRoomType?.bed_type || 'King Bed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">Operational State:</span>
                      <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {selectedRoom?.status || 'available'}
                      </Badge>
                    </div>
                  </div>

                  {/* Tariff & Extra Bed */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Room Tariff per Night (₹) *
                      </label>
                      <input
                        type="number"
                        name="room_tariff"
                        value={formData.room_tariff}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] font-semibold text-gray-900"
                      />
                      <span className="text-[10px] text-gray-400 block mt-1">
                        Auto-filled from rate plan. Editable for special discounts or seasonal adjustments.
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-700 font-medium">Extra Bed Requirement</label>
                        <input
                          type="checkbox"
                          name="extra_bed"
                          checked={formData.extra_bed}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-[#5e2b9d] focus:ring-[#5e2b9d] h-4 w-4 cursor-pointer"
                        />
                      </div>

                      {formData.extra_bed && (
                        <div>
                          <label className="block text-gray-500 text-[11px] mb-1">Extra Bed Charge per Night (₹)</label>
                          <input
                            type="number"
                            name="extra_bed_charges"
                            value={formData.extra_bed_charges}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 5. PAYMENT & BILLING DETAILS */}
              {/* ========================================================================= */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Room Charges:</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {formatCurrency(roomCharges)} ({nights}N &times; {formatCurrency(roomTariff)})
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">Extra Bed Total:</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {formatCurrency(extraBedTotal)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">Subtotal (Pre-tax):</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">Grand Total (Inc. GST):</span>
                      <span className="font-bold text-[#5e2b9d] text-sm">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Add-ons & Discounts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Food &amp; Beverage Charges (₹)</label>
                      <input
                        type="number"
                        min="0"
                        name="food_charges"
                        value={formData.food_charges}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Other Incidental Charges (₹)</label>
                      <input
                        type="number"
                        min="0"
                        name="other_charges"
                        value={formData.other_charges}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Discount Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        name="discount_amount"
                        value={formData.discount_amount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  {/* GST Configuration */}
                  <div className="p-3 bg-purple-50/50 rounded-md border border-purple-100 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <label className="block text-gray-800 font-semibold text-xs">GST Rate (Indian Hospitality Standard) *</label>
                        <span className="text-[10px] text-gray-500">Avoid hardcoding; configurable based on tariff threshold.</span>
                      </div>
                      <select
                        name="gst_rate"
                        value={formData.gst_rate}
                        onChange={handleChange}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer font-semibold text-xs text-[#5e2b9d]"
                      >
                        <option value="0">0% (Exempt)</option>
                        <option value="5">5% (Economy)</option>
                        <option value="12">12% (Standard Room &lt; ₹7,500)</option>
                        <option value="18">18% (Luxury Room &ge; ₹7,500)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-gray-700">
                      <div>CGST ({gstRate / 2}%): <strong>{formatCurrency(cgstAmount)}</strong></div>
                      <div>SGST ({gstRate / 2}%): <strong>{formatCurrency(sgstAmount)}</strong></div>
                      <div>Total Tax: <strong className="text-[#5e2b9d]">{formatCurrency(taxAmount)}</strong></div>
                    </div>
                  </div>

                  {/* Payment execution */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Payment Mode *</label>
                      <select
                        name="payment_mode"
                        value={formData.payment_mode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        {PAYMENT_MODES.map((pm) => (
                          <option key={pm} value={pm}>{pm}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Advance / Paid Amount (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        name="paid_amount"
                        value={formData.paid_amount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] font-semibold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Transaction Ref / UPI UTR</label>
                      <input
                        type="text"
                        name="transaction_reference"
                        value={formData.transaction_reference}
                        onChange={handleChange}
                        placeholder="e.g. UPI Ref # or Card Last 4"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Remaining Balance Due:</span>
                      <span className={`text-base font-bold ${balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {formatCurrency(balanceAmount)}
                      </span>
                    </div>
                    <Badge
                      className={`text-[10px] font-medium rounded ${
                        balanceAmount === 0 ? 'bg-emerald-600 text-white' : paidAmount > 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {balanceAmount === 0 ? 'Paid in Full' : paidAmount > 0 ? 'Partially Paid' : 'Pending Settlement'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 6. ADDITIONAL GUEST INFORMATION (Accompanying Guests) */}
              {/* ========================================================================= */}
              {activeTab === 'accompanying' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <span className="font-semibold text-gray-900 block text-xs">Accompanying Room Guests</span>
                      <p className="text-[11px] text-gray-500">
                        Primary guest: <strong>{formData.first_name || 'Primary'} {formData.last_name || 'Guest'}</strong>. Add family members or group guests staying in this room.
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddAccompanyingGuest}
                      className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Accompanying Guest
                    </Button>
                  </div>

                  {accompanyingGuests.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-md text-gray-400">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">No additional accompanying guests added yet.</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Click &quot;Add Accompanying Guest&quot; above to add family or group members.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accompanyingGuests.map((guest, idx) => (
                        <div key={guest.id || idx} className="p-3 bg-white rounded-md border border-gray-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="font-semibold text-gray-900 text-xs">
                              Guest #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAccompanyingGuest(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">Full Name *</label>
                              <input
                                type="text"
                                value={guest.name}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'name', e.target.value)}
                                placeholder="Guest Name"
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">Age</label>
                              <input
                                type="number"
                                value={guest.age}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'age', e.target.value)}
                                placeholder="Age"
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">Gender</label>
                              <select
                                value={guest.gender}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'gender', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                              >
                                {GENDER_OPTIONS.map((g) => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">Relationship</label>
                              <select
                                value={guest.relationship}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'relationship', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                              >
                                {RELATIONSHIPS.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">Mobile Number</label>
                              <input
                                type="tel"
                                value={guest.phone}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'phone', e.target.value)}
                                placeholder="Optional Phone"
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">ID Type</label>
                              <select
                                value={guest.id_type}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'id_type', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                              >
                                {ID_TYPES.map((id) => (
                                  <option key={id} value={id}>{id}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-gray-600 text-[11px] mb-1">ID Number</label>
                              <input
                                type="text"
                                value={guest.id_number}
                                onChange={(e) => handleUpdateAccompanyingGuest(idx, 'id_number', e.target.value)}
                                placeholder="ID Document #"
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] uppercase"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* 7. CHECK-IN, SIGNATURE & SUMMARY */}
              {/* ========================================================================= */}
              {activeTab === 'review' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Key Card / Room Key Assigned</label>
                      <input
                        type="text"
                        name="key_card_number"
                        value={formData.key_card_number}
                        onChange={handleChange}
                        placeholder="e.g. CARD-102"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Check-in Handled By</label>
                      <input
                        type="text"
                        name="checkin_handled_by"
                        value={formData.checkin_handled_by}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  {/* Digital Guest Signature Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-gray-700 font-medium text-xs flex items-center gap-1.5">
                        <PenTool className="h-3.5 w-3.5 text-[#5e2b9d]" />
                        <span>Digital Guest Signature (Registration Card Agreement)</span>
                      </label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[11px] text-gray-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Clear Signature
                      </button>
                    </div>

                    <div className="border border-gray-300 rounded-md bg-white overflow-hidden touch-none relative">
                      <canvas
                        ref={canvasRef}
                        width={640}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 cursor-crosshair bg-white"
                      />
                      {!hasSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-xs italic">
                          Sign with mouse, stylus or finger here...
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      Signing acknowledges hotel house rules, check-in terms &amp; GST billing consent.
                    </span>
                  </div>

                  {/* Complete Form F Registration Card Preview */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-xs">Guest Registration Summary Card</span>
                        <span className="text-[10px] text-gray-500 block">Form F Hotel Register Extract</span>
                      </div>
                      <Badge className="bg-[#5e2b9d] text-white text-[10px]">
                        {formData.immediate_check_in ? 'Checked In' : 'Confirmed'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 block text-[10px]">Primary Guest:</span>
                        <strong className="text-gray-900">{formData.first_name || '—'} {formData.last_name}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Contact:</span>
                        <strong className="text-gray-900">+91 {formData.phone || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Allocated Room:</span>
                        <strong className="text-[#5e2b9d]">{selectedRoom ? `Room ${selectedRoom.room_number}` : 'Pending Room'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Category:</span>
                        <strong className="text-gray-900">{selectedRoom?.room_type_name || currentRoomType?.name}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-gray-200">
                      <div>
                        <span className="text-gray-500 block text-[10px]">ID Credential:</span>
                        <span className="text-gray-900">{formData.id_type} ({formData.id_number || '—'})</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Stay Period:</span>
                        <span className="text-gray-900">{nights} Night(s)</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Total Amount:</span>
                        <strong className="text-gray-900">{formatCurrency(totalAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Balance Due:</span>
                        <strong className={balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                          {formatCurrency(balanceAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevTab}
                  disabled={currentTabIdx === 0}
                  className="text-xs rounded-md cursor-pointer border-gray-200 text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous Step
                </Button>

                <div className="flex items-center gap-2">
                  {currentTabIdx < TABS.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNextTab}
                      className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md cursor-pointer font-medium px-4 h-9"
                    >
                      <span>Continue to {TABS[currentTabIdx + 1].label}</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleSubmit()}
                      className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md cursor-pointer font-medium px-5 h-9 shadow-2xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registering Guest...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          {formData.immediate_check_in ? 'Complete Check-in & Register' : 'Confirm & Save Reservation'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Real-time Stay & Folio Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <Card className="rounded-md border-gray-200 shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gradient-to-r from-[#5e2b9d] to-[#7134bc] text-white">
              <CardTitle className="text-xs font-semibold flex items-center justify-between">
                <span>Guest Folio Summary</span>
                <span className="font-mono text-[10px] opacity-90">Auto-Generated</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              {/* Primary Guest Snapshot */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#f7f2fd] text-[#5e2b9d] flex items-center justify-center font-bold text-xs shrink-0">
                  {formData.first_name ? formData.first_name[0].toUpperCase() : 'G'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">
                    {formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'New Guest'}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {formData.phone ? `+91 ${formData.phone}` : 'No mobile entered'} · {formData.nationality}
                  </div>
                </div>
              </div>

              {/* Room Snapshot */}
              <div className="p-2.5 bg-gray-50 rounded-md border border-gray-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[11px]">Allocated Room:</span>
                  <span className="font-semibold text-[#5e2b9d]">
                    {selectedRoom ? `Room ${selectedRoom.room_number}` : 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-gray-900 font-medium">
                    {selectedRoom?.room_type_name || currentRoomType?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Guests in Room:</span>
                  <span className="text-gray-900">
                    {formData.num_adults} Adult(s), {formData.num_children} Child(ren)
                  </span>
                </div>
                {accompanyingGuests.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-purple-700">
                    <span>Accompanying:</span>
                    <span>+{accompanyingGuests.length} Guest(s)</span>
                  </div>
                )}
              </div>

              {/* Schedule Snapshot */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-in:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(formData.check_in_date)} ({formatTimeString(formData.check_in_time)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-out:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(formData.check_out_date)} ({formatTimeString(formData.check_out_time)})
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-[#5e2b9d] pt-0.5">
                  <span>Stay Duration:</span>
                  <span>{nights} Night{nights > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Financial Breakdown Snapshot */}
              <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>Room Charges ({nights}N):</span>
                  <span>{formatCurrency(roomCharges)}</span>
                </div>
                {extraBedTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Extra Bed Charges:</span>
                    <span>{formatCurrency(extraBedTotal)}</span>
                  </div>
                )}
                {foodCharges > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>F&amp;B Charges:</span>
                    <span>{formatCurrency(foodCharges)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST ({gstRate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-xs pt-1 border-t border-gray-100">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-xs pt-1 border-t border-gray-100">
                  <span className="text-gray-700">Balance Due:</span>
                  <span className={balanceAmount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {formatCurrency(balanceAmount)}
                  </span>
                </div>
              </div>

              {/* Fast submit action */}
              <div className="pt-2">
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit()}
                  className="w-full bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer shadow-2xs"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : formData.immediate_check_in ? (
                    'Check-in Guest Now'
                  ) : (
                    'Save Reservation'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
