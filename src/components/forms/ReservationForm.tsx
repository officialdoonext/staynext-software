'use client'

import React, { useState, useEffect } from 'react'
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
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createReservation } from '@/services/reservation.service'
import { RoomItem, RoomTypeItem } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatCurrency, formatTimeString } from '@/lib/utils'

interface ReservationFormProps {
  property: PropertyItem
  properties: PropertyItem[]
  roomTypes: RoomTypeItem[]
  availableRooms: RoomItem[]
}

export default function ReservationForm({
  property: initialProp,
  properties,
  roomTypes,
  availableRooms,
}: ReservationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const defaultEndStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]

  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(roomTypes[0]?.id || '')

  const currentRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId) || roomTypes[0]

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_type: 'passport',
    id_number: '',
    room_id: '',
    check_in_date: todayStr,
    check_in_time: initialProp.check_in_time || '14:00',
    check_out_date: defaultEndStr,
    check_out_time: initialProp.check_out_time || '11:00',
    num_adults: 2,
    num_children: 0,
    paid_amount: 0,
    payment_method: 'credit_card',
    booking_source: 'direct',
    special_requests: '',
  })

  // Calculate nights & charges
  const checkIn = new Date(formData.check_in_date)
  const checkOut = new Date(formData.check_out_date)
  const diffTime = Math.max(0, checkOut.getTime() - checkIn.getTime())
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const baseRate = currentRoomType?.base_rate || 2000
  const roomCharge = baseRate * nights
  const taxAmount = Math.round(roomCharge * 0.12 * 100) / 100
  const totalAmount = roomCharge + taxAmount

  const eligibleRooms = availableRooms.filter(
    (r) => r.room_type_id === selectedRoomTypeId && r.status === 'available'
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMsg('Guest first and last name are required.')
      return
    }

    if (!formData.phone.trim() && !formData.email.trim()) {
      setErrorMsg('Please provide at least a phone number or email address.')
      return
    }

    if (!selectedRoomTypeId) {
      setErrorMsg('Please select a room category.')
      return
    }

    setLoading(true)

    try {
      const res = await createReservation({
        property_id: selectedPropertyId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        id_type: formData.id_type,
        id_number: formData.id_number,
        room_type_id: selectedRoomTypeId,
        room_id: formData.room_id || undefined,
        check_in_date: formData.check_in_date,
        check_in_time: formData.check_in_time,
        check_out_date: formData.check_out_date,
        check_out_time: formData.check_out_time,
        num_adults: Number(formData.num_adults),
        num_children: Number(formData.num_children),
        total_amount: totalAmount,
        paid_amount: Number(formData.paid_amount),
        payment_method: formData.payment_method,
        booking_source: formData.booking_source,
        special_requests: formData.special_requests,
      })

      if (!res.success) throw new Error(res.error || 'Failed to create reservation')

      setSuccessMsg(`Reservation #${res.data?.reservation_number} confirmed successfully!`)
      setTimeout(() => {
        router.push('/reservations')
        router.refresh()
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving reservation to database.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reservations">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Create New Guest Reservation
            </h1>
            <p className="text-xs text-gray-500">
              Multi-step booking engine: guest profile, room category, dates, rate calculation and advance deposit.
            </p>
          </div>
        </div>

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
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Stay & Room Category */}
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#5e2b9d]" />
              1. Stay Dates &amp; Room Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Check-In Date & Time */}
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-medium text-gray-700">Check-In Schedule (Date &amp; Time) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      name="check_in_date"
                      value={formData.check_in_date}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      name="check_in_time"
                      value={formData.check_in_time}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-0.5">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, check_in_time: '12:00' }))}
                    className="text-[#5e2b9d] hover:underline cursor-pointer"
                  >
                    12:00 PM
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, check_in_time: '14:00' }))}
                    className="text-[#5e2b9d] hover:underline cursor-pointer font-medium"
                  >
                    02:00 PM (Std)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, check_in_time: '18:00' }))}
                    className="text-[#5e2b9d] hover:underline cursor-pointer"
                  >
                    06:00 PM
                  </button>
                </div>
              </div>

              {/* Check-Out Date & Time */}
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-medium text-gray-700">Check-Out Schedule (Date &amp; Time) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      name="check_out_date"
                      value={formData.check_out_date}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      name="check_out_time"
                      value={formData.check_out_time}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-0.5">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, check_out_time: '10:00' }))}
                    className="text-[#5e2b9d] hover:underline cursor-pointer"
                  >
                    10:00 AM
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, check_out_time: '11:00' }))}
                    className="text-[#5e2b9d] hover:underline cursor-pointer font-medium"
                  >
                    11:00 AM (Std)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, check_out_time: '14:00' }))}
                    className="text-[#5e2b9d] hover:underline cursor-pointer"
                  >
                    02:00 PM (Late)
                  </button>
                </div>
              </div>

              {/* Schedule Summary Banner */}
              <div className="sm:col-span-4 bg-[#f7f2fd]/60 p-2.5 rounded-md border border-[#5e2b9d]/20 flex flex-wrap items-center justify-between text-xs text-[#5e2b9d]">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Stay Duration:</strong> {nights} Night{nights > 1 ? 's' : ''} ({formatTimeString(formData.check_in_time)} on {formData.check_in_date} → {formatTimeString(formData.check_out_time)} on {formData.check_out_date})
                  </span>
                </div>
                <span className="text-[11px] font-medium opacity-90">
                  Daily turnover window: 11:00 AM - 02:00 PM
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adults</label>
                <input
                  type="number"
                  name="num_adults"
                  value={formData.num_adults}
                  min={1}
                  max={6}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Children</label>
                <input
                  type="number"
                  name="num_children"
                  value={formData.num_children}
                  min={0}
                  max={4}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Room Category *</label>
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => {
                    setSelectedRoomTypeId(e.target.value)
                    setFormData((prev) => ({ ...prev, room_id: '' }))
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} — ₹{rt.base_rate}/night ({rt.max_occupancy} Guests, {rt.bed_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Allocate Specific Room (Optional)
                </label>
                <select
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="">Assign at Check-in (Unallocated)</option>
                  {eligibleRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.floor_name}) - {r.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Guest Profile */}
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-[#5e2b9d]" />
              2. Guest Contact &amp; Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul.sharma@example.com"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID Type</label>
                <select
                  name="id_type"
                  value={formData.id_type}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder="ID Number"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Booking Source</label>
                <select
                  name="booking_source"
                  value={formData.booking_source}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="direct">Direct Walk-In / Reception</option>
                  <option value="website">Hotel Website Direct</option>
                  <option value="phone">Phone Reservation</option>
                  <option value="booking_com">Booking.com</option>
                  <option value="expedia">Expedia</option>
                  <option value="agoda">Agoda</option>
                  <option value="corporate">Corporate Contract</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Billing & Rates Summary */}
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#5e2b9d]" />
              3. Rate Breakdown &amp; Advance Deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="bg-gray-50 p-3.5 rounded-md border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Room Rate ({nights} nights x {formatCurrency(baseRate)}):</span>
                <span className="font-medium text-gray-900">{formatCurrency(roomCharge)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Hotel GST / Taxes (12%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Booking Amount:</span>
                <span className="text-[#5e2b9d]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Advance Deposit Paid (₹)
                </label>
                <input
                  type="number"
                  name="paid_amount"
                  value={formData.paid_amount}
                  onChange={handleChange}
                  min={0}
                  max={totalAmount}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit / Debit Card</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="pay_at_checkin">Pay at Check-In</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Special Requests / Guest Notes
                </label>
                <textarea
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Late check-in after 9 PM, quiet corner room, extra pillows."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/reservations">
            <Button variant="outline" type="button" className="text-xs h-9 rounded-md cursor-pointer">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs h-9 rounded-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Confirming Booking...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Confirm Reservation ({formatCurrency(totalAmount)})
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
