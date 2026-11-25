'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  ShieldCheck,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createProperty, updateProperty, PropertyItem, TenantPropertyStats } from '@/services/property.service'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomTimePicker } from '@/components/ui/custom-time-picker'

interface PropertyFormProps {
  initialData?: PropertyItem
  isEdit?: boolean
  propertyStats?: TenantPropertyStats
}

export default function PropertyForm({ initialData, isEdit = false, propertyStats }: PropertyFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'business' | 'policies'>('basic')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    property_type: initialData?.property_type || 'hotel',
    description: initialData?.description || '',
    star_rating: initialData?.star_rating || 3,
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'India',
    postal_code: initialData?.postal_code || '',
    gstin: initialData?.gstin || '',
    pan_number: initialData?.pan_number || '',
    business_reg_no: initialData?.business_reg_no || '',
    check_in_time: initialData?.check_in_time || '14:00',
    check_out_time: initialData?.check_out_time || '11:00',
    currency: initialData?.currency || 'INR',
    timezone: initialData?.timezone || 'Asia/Kolkata',
    invoice_prefix: initialData?.invoice_prefix || 'INV',
    receipt_prefix: initialData?.receipt_prefix || 'REC',
    cancellation_policy: initialData?.cancellation_policy || 'Free cancellation up to 24 hours prior to check-in. One night charge applies for late cancellations or no-shows.',
    terms_and_conditions: initialData?.terms_and_conditions || 'Government photo ID required at check-in. Full payment required prior to room keycard handover.',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.name.trim()) {
      setErrorMsg('Property Name is required.')
      setActiveTab('basic')
      return
    }

    if (!formData.city.trim() || !formData.address.trim()) {
      setErrorMsg('Street address and city are required.')
      setActiveTab('basic')
      return
    }

    setLoading(true)

    try {
      if (isEdit && initialData?.id) {
        const res = await updateProperty(initialData.id, formData as any)
        if (!res.success) {
          throw new Error(res.error || 'Failed to update property')
        }
        setSuccessMsg('Property successfully updated!')
        setTimeout(() => {
          router.push(`/properties/${initialData.id}`)
          router.refresh()
        }, 1200)
      } else {
        const res = await createProperty(formData as any)
        if (!res.success) {
          throw new Error(res.error || 'Failed to create property')
        }
        setSuccessMsg('Property registered successfully!')
        setTimeout(() => {
          router.push('/properties')
          router.refresh()
        }, 1200)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              {isEdit ? `Edit Property: ${initialData?.name}` : 'Register New Hotel Property'}
            </h1>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Update details, taxation, operating hours and guest policies.' : 'Configure property branches, tax details, and operational rules.'}
            </p>
          </div>
        </div>
      </div>

      {/* Property Limit Banner */}
      {!isEdit && propertyStats && !propertyStats.canAdd && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-950">Property Limit Reached</p>
            <p className="mt-0.5 text-amber-800">
              Your organization plan allows up to <strong className="font-semibold">{propertyStats.allowedCount}</strong> property(ies). You currently have <strong className="font-semibold">{propertyStats.currentCount}</strong> registered property(ies). Please contact your administrator or upgrade your subscription plan to add more properties.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'basic'
              ? 'border-[#5e2b9d] text-[#5e2b9d]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          General &amp; Location
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'contact'
              ? 'border-[#5e2b9d] text-[#5e2b9d]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Contact &amp; Operations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'business'
              ? 'border-[#5e2b9d] text-[#5e2b9d]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Tax &amp; Business Registration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'policies'
              ? 'border-[#5e2b9d] text-[#5e2b9d]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Policies &amp; Invoicing
        </button>
      </div>

      {/* Notifications */}
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
        {/* TAB 1: BASIC & LOCATION */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#5e2b9d]" />
                  Basic Hotel Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Royal Orchid Resort &amp; Suites"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <SearchableSelect
                      value={formData.property_type}
                      onChange={(val) => setFormData((prev) => ({ ...prev, property_type: val }))}
                      options={[
                        { value: 'hotel', label: 'Boutique / Luxury Hotel' },
                        { value: 'resort', label: 'Resort & Spa' },
                        { value: 'lodge', label: 'Lodge / Guest House' },
                        { value: 'apartment', label: 'Serviced Apartments' },
                        { value: 'villa', label: 'Luxury Villa / Homestay' },
                        { value: 'motel', label: 'Motel / Highway Inn' },
                      ]}
                      allowAdd={true}
                      addNewLabel="Add Property Type"
                      placeholder="Select property type..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Star Rating
                    </label>
                    <SearchableSelect
                      value={String(formData.star_rating)}
                      onChange={(val) => setFormData((prev) => ({ ...prev, star_rating: parseInt(val) || 3 }))}
                      options={[
                        { value: '1', label: '1 Star' },
                        { value: '2', label: '2 Star' },
                        { value: '3', label: '3 Star (Standard)' },
                        { value: '4', label: '4 Star (Premium)' },
                        { value: '5', label: '5 Star (Luxury)' },
                      ]}
                      placeholder="Select rating..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Property Overview / Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Brief description of property amenities, location advantages and guest experience..."
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#5e2b9d]" />
                  Physical Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. 142 Lakeview Promenade, Near City Center"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Hyderabad"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Telangana"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="e.g. India"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="e.g. 500081"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: CONTACT & OPERATIONS */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#5e2b9d]" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="frontdesk@hotel.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.hotel.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#5e2b9d]" />
                  Operating Hours &amp; Timezone
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Standard Check-in Time
                    </label>
                    <CustomTimePicker
                      value={formData.check_in_time}
                      onChange={(t) => setFormData((prev) => ({ ...prev, check_in_time: t }))}
                      placeholder="14:00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Standard Check-out Time
                    </label>
                    <CustomTimePicker
                      value={formData.check_out_time}
                      onChange={(t) => setFormData((prev) => ({ ...prev, check_out_time: t }))}
                      placeholder="11:00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Billing Currency
                    </label>
                    <SearchableSelect
                      value={formData.currency}
                      onChange={(val) => setFormData((prev) => ({ ...prev, currency: val }))}
                      options={[
                        { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                        { value: 'USD', label: 'USD ($) - US Dollar' },
                        { value: 'EUR', label: 'EUR (€) - Euro' },
                        { value: 'GBP', label: 'GBP (£) - British Pound' },
                        { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
                      ]}
                      allowAdd={true}
                      addNewLabel="Add Currency"
                      placeholder="Select currency..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <SearchableSelect
                      value={formData.timezone}
                      onChange={(val) => setFormData((prev) => ({ ...prev, timezone: val }))}
                      options={[
                        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
                        { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
                        { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                        { value: 'America/New_York', label: 'America/New_York (EST)' },
                        { value: 'UTC', label: 'UTC (Universal Coordinated)' },
                      ]}
                      allowAdd={true}
                      addNewLabel="Add Timezone"
                      placeholder="Select timezone..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: TAX & BUSINESS REGISTRATION */}
        {activeTab === 'business' && (
          <Card className="border-gray-200 rounded-md">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#5e2b9d]" />
                Taxation &amp; Statutory Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    GSTIN / Tax Registration Number
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="36AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Printed on official guest tax invoices</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Business / Hotel License Number
                  </label>
                  <input
                    type="text"
                    name="business_reg_no"
                    value={formData.business_reg_no}
                    onChange={handleChange}
                    placeholder="MCH/HTL/2026/09"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: POLICIES & INVOICING */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#5e2b9d]" />
                  Invoice &amp; Receipt Prefixes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      name="invoice_prefix"
                      value={formData.invoice_prefix}
                      onChange={handleChange}
                      placeholder="INV"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. INV-2026-0001</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Receipt Prefix
                    </label>
                    <input
                      type="text"
                      name="receipt_prefix"
                      value={formData.receipt_prefix}
                      onChange={handleChange}
                      placeholder="REC"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. REC-2026-0001</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900">
                  Guest Cancellation &amp; Stay Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cancellation Policy
                  </label>
                  <textarea
                    name="cancellation_policy"
                    value={formData.cancellation_policy}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Terms &amp; Conditions (Included on registration cards and receipts)
                  </label>
                  <textarea
                    name="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Link href="/properties">
            <Button variant="outline" type="button" className="text-xs h-9 rounded-md cursor-pointer">
              Cancel
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            {activeTab !== 'basic' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (activeTab === 'policies') setActiveTab('business')
                  else if (activeTab === 'business') setActiveTab('contact')
                  else if (activeTab === 'contact') setActiveTab('basic')
                }}
                className="text-xs h-9 rounded-md cursor-pointer"
              >
                Previous Step
              </Button>
            )}

            {activeTab !== 'policies' ? (
              <Button
                type="button"
                onClick={() => {
                  if (activeTab === 'basic') setActiveTab('contact')
                  else if (activeTab === 'contact') setActiveTab('business')
                  else if (activeTab === 'business') setActiveTab('policies')
                }}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs h-9 rounded-md cursor-pointer"
              >
                Next Step &rarr;
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || (!isEdit && propertyStats && !propertyStats.canAdd)}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs h-9 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    {isEdit ? 'Update Property' : 'Save & Register Property'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

