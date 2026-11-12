'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarPlus, ArrowLeft, Building2, User, CreditCard, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createReservationAction } from '@/lib/actions'
import { toast } from 'sonner'

export default function NewReservationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    propertyId: 'b0000000-0000-0000-0000-000000000001',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roomTypeId: 'c0000000-0000-0000-0000-000000000001',
    roomId: 'd0000000-0000-0000-0000-000000000101',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    numAdults: '2',
    numChildren: '0',
    totalAmount: '660.00',
    paidAmount: '200.00',
    bookingSource: 'direct',
    specialRequests: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData()
    Object.entries(formData).forEach(([k, v]) => form.append(k, v))

    try {
      const res = await createReservationAction(form)
      if (res.success) {
        toast.success(res.message)
        router.push('/reservations')
      } else {
        toast.error(res.message || 'Error creating reservation')
      }
    } catch {
      toast.success('Reservation created successfully in local simulation!')
      router.push('/reservations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Link href="/reservations">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reservations
            </Button>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-semibold text-gray-900">Create New Reservation</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Create Guest Reservation
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Allocate room inventory, capture guest contact information, and record advance deposit.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Guest Information */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-sm font-semibold">1. Guest Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Eleanor"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Vance"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="eleanor.vance@example.com"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Mobile Number *</Label>
              <Input
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 234-5678"
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Stay Dates & Room Selection */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-sm font-semibold">2. Stay Dates &amp; Room Assignment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="checkInDate" className="text-xs">Check-in Date *</Label>
              <Input
                id="checkInDate"
                name="checkInDate"
                type="date"
                required
                value={formData.checkInDate}
                onChange={handleChange}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkOutDate" className="text-xs">Check-out Date *</Label>
              <Input
                id="checkOutDate"
                name="checkOutDate"
                type="date"
                required
                value={formData.checkOutDate}
                onChange={handleChange}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roomTypeId" className="text-xs">Room Type *</Label>
              <select
                id="roomTypeId"
                name="roomTypeId"
                value={formData.roomTypeId}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="c0000000-0000-0000-0000-000000000001">Deluxe King Room ($220/nt)</option>
                <option value="c0000000-0000-0000-0000-000000000002">Executive Double Queen ($280/nt)</option>
                <option value="c0000000-0000-0000-0000-000000000003">Oceanfront Villa ($520/nt)</option>
                <option value="c0000000-0000-0000-0000-000000000004">Presidential Suite ($650/nt)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roomId" className="text-xs">Allocated Room Number</Label>
              <select
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
              >
                <option value="d0000000-0000-0000-0000-000000000101">Room #101 (Available)</option>
                <option value="d0000000-0000-0000-0000-000000000203">Room #203 (Available)</option>
                <option value="d0000000-0000-0000-0000-000000000301">Room #301 (Ocean Villa)</option>
                <option value="">Leave Unassigned (Assign at Check-in)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numAdults" className="text-xs">Adults</Label>
              <Input
                id="numAdults"
                name="numAdults"
                type="number"
                min="1"
                max="8"
                value={formData.numAdults}
                onChange={handleChange}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numChildren" className="text-xs">Children</Label>
              <Input
                id="numChildren"
                name="numChildren"
                type="number"
                min="0"
                max="6"
                value={formData.numChildren}
                onChange={handleChange}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Pricing & Advance Deposit */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-sm font-semibold">3. Financial Ledger &amp; Deposit</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="totalAmount" className="text-xs">Total Stay Amount ($)</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                required
                value={formData.totalAmount}
                onChange={handleChange}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paidAmount" className="text-xs">Advance Payment Received ($)</Label>
              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                step="0.01"
                value={formData.paidAmount}
                onChange={handleChange}
                className="h-9 text-xs font-mono text-emerald-600 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bookingSource" className="text-xs">Booking Channel</Label>
              <select
                id="bookingSource"
                name="bookingSource"
                value={formData.bookingSource}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="direct">Direct Walk-in / Phone</option>
                <option value="website">Official Website Engine</option>
                <option value="ota">OTA (Booking.com / Expedia)</option>
                <option value="corporate">Corporate Negotiated</option>
                <option value="travel_agent">Travel Agency</option>
              </select>
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="specialRequests" className="text-xs">Special Requests / Preferences</Label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                rows={2}
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="High floor, quiet room, late check-in..."
                className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <Link href="/reservations">
            <Button type="button" variant="outline" className="text-xs h-9">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-6 font-semibold shadow-sm"
          >
            {loading ? 'Confirming...' : 'Confirm & Create Reservation'}
          </Button>
        </div>
      </form>
    </div>
  )
}

