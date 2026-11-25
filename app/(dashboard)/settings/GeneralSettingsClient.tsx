'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Hotel,
  Receipt,
  ShieldCheck,
  Bell,
  Cpu,
  Users,
  Save,
  CheckCircle2,
  Calendar,
  Globe,
  Clock,
  Building,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomTimePicker } from '@/components/ui/custom-time-picker'
import { PropertySettingsData, updatePropertySettings, getPropertySettings } from '@/services/settings.service'
import { toast } from 'sonner'

interface GeneralSettingsClientProps {
  initialProperty: PropertySettingsData | null
  properties?: Array<{ id: string; name: string }>
}

export function GeneralSettingsClient({ initialProperty, properties = [] }: GeneralSettingsClientProps) {
  const [property, setProperty] = useState<PropertySettingsData | null>(initialProperty)
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProperty?.id || '')
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [name, setName] = useState(property?.name || '')
  const [propertyType, setPropertyType] = useState(property?.propertyType || 'hotel')
  const [phone, setPhone] = useState(property?.phone || '')
  const [email, setEmail] = useState(property?.email || '')
  const [website, setWebsite] = useState(property?.website || '')
  const [address, setAddress] = useState(property?.address || '')
  const [city, setCity] = useState(property?.city || '')
  const [state, setState] = useState(property?.state || '')
  const [country, setCountry] = useState(property?.country || 'India')
  const [postalCode, setPostalCode] = useState(property?.postalCode || '')
  const [currency, setCurrency] = useState(property?.currency || 'INR')
  const [timezone, setTimezone] = useState(property?.timezone || 'Asia/Kolkata')
  const [checkInTime, setCheckInTime] = useState(property?.checkInTime || '14:00')
  const [checkOutTime, setCheckOutTime] = useState(property?.checkOutTime || '11:00')
  const [description, setDescription] = useState(property?.description || '')

  // Indian Hospitality & Statutory Compliance fields
  const [gstin, setGstin] = useState(property?.settings?.gstin || '')
  const [panNumber, setPanNumber] = useState(property?.settings?.panNumber || '')
  const [fssaiNumber, setFssaiNumber] = useState(property?.settings?.fssaiNumber || '')
  const [frroCode, setFrroCode] = useState(property?.settings?.frroCode || '')
  const [nightAuditTime, setNightAuditTime] = useState(property?.settings?.nightAuditTime || '02:00')

  const handlePropertyChange = async (newPropId: string) => {
    setSelectedPropertyId(newPropId)
    try {
      const fresh = await getPropertySettings(newPropId)
      if (fresh) {
        setProperty(fresh)
        setName(fresh.name || '')
        setPropertyType(fresh.propertyType || 'hotel')
        setPhone(fresh.phone || '')
        setEmail(fresh.email || '')
        setWebsite(fresh.website || '')
        setAddress(fresh.address || '')
        setCity(fresh.city || '')
        setState(fresh.state || '')
        setCountry(fresh.country || 'India')
        setPostalCode(fresh.postalCode || '')
        setCurrency(fresh.currency || 'INR')
        setTimezone(fresh.timezone || 'Asia/Kolkata')
        setCheckInTime(fresh.checkInTime || '14:00')
        setCheckOutTime(fresh.checkOutTime || '11:00')
        setDescription(fresh.description || '')
        setGstin(fresh.settings?.gstin || '')
        setPanNumber(fresh.settings?.panNumber || '')
        setFssaiNumber(fresh.settings?.fssaiNumber || '')
        setFrroCode(fresh.settings?.frroCode || '')
        setNightAuditTime(fresh.settings?.nightAuditTime || '02:00')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = selectedPropertyId || property?.id
    if (!targetId) {
      toast.error('No active property loaded')
      return
    }

    setIsSaving(true)
    const res = await updatePropertySettings(targetId, {
      name,
      propertyType,
      phone,
      email,
      website,
      address,
      city,
      state,
      country,
      postalCode,
      currency,
      timezone,
      checkInTime,
      checkOutTime,
      description,
      settings: {
        ...(property?.settings || {}),
        gstin: gstin.toUpperCase(),
        panNumber: panNumber.toUpperCase(),
        fssaiNumber,
        frroCode,
        nightAuditTime,
      },
    })
    setIsSaving(false)

    if (res.success) {
      toast.success('Property settings saved successfully to Supabase')
    } else {
      toast.error(res.error || 'Failed to save settings')
    }
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sora">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">
            Property &amp; Tenant Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure multi-property legal profile, operating hours, local currency, tax rules, and team RBAC.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {properties && properties.length > 1 && (
            <div className="w-56">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={handlePropertyChange}
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
          {property?.tenant && (
            <>
              <Badge
                variant={property.tenant.isActive ? 'success' : 'outline'}
                className="text-[11px] rounded-sm px-2.5 py-0.5"
              >
                Tenant: {property.tenant.status.toUpperCase()}
              </Badge>
              <Badge className="bg-[#5e2b9d] text-white text-[11px] rounded-sm px-2.5 py-0.5">
                Plan: {property.tenant.subscriptionPlan.toUpperCase()}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Sub-Settings Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/settings/billing" className="block group">
          <Card className="border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all rounded-md cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
                  <Receipt className="h-4 w-4" />
                </div>
                <Badge variant="outline" className="text-[10px] rounded-sm">
                  SAC 9963
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium mt-2 group-hover:text-[#5e2b9d]">
                Taxes &amp; Statutory Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500">
              Configure room GST, restaurant GST, and sequential tax invoice numbering.
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/integrations" className="block group">
          <Card className="border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all rounded-md cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
                  <Cpu className="h-4 w-4" />
                </div>
                <Badge variant="purple" className="text-[10px] rounded-sm">
                  Active
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium mt-2 group-hover:text-[#5e2b9d]">
                Third-Party Gateways
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500">
              Manage Razorpay, Stripe, WhatsApp Cloud API, and RFID Door Locks.
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/notifications" className="block group">
          <Card className="border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all rounded-md cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
                  <Bell className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Realtime</span>
              </div>
              <CardTitle className="text-sm font-medium mt-2 group-hover:text-[#5e2b9d]">
                Notifications &amp; Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500">
              Automated booking confirmations, WhatsApp invoices, and emergency staff alerts.
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/users" className="block group">
          <Card className="border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all rounded-md cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
                  <Users className="h-4 w-4" />
                </div>
                <Badge variant="outline" className="text-[10px] rounded-sm">
                  RBAC
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium mt-2 group-hover:text-[#5e2b9d]">
                Team Users &amp; Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500">
              Role permissions for Front Desk, Housekeeping, Accountants, and GMs.
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-[#5e2b9d]" />
              <CardTitle className="text-sm font-medium text-gray-900">
                Property Profile &amp; Legal Entity Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Property Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-xs rounded-md"
                  placeholder="e.g. Grand Vista Resort &amp; Spa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Property Classification
                </label>
                <SearchableSelect
                  value={propertyType}
                  onChange={setPropertyType}
                  placeholder="Select classification..."
                >
                  <option value="hotel">Boutique / City Hotel</option>
                  <option value="resort">Luxury Beach / Mountain Resort</option>
                  <option value="villa">Private Villa / Luxury Homestay</option>
                  <option value="lodge">Eco Lodge / Safari Retreat</option>
                  <option value="service_apartment">Serviced Apartments</option>
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Official Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="reservations@hotel.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="124 Marina Beach Road"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  City
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="Goa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  State / Province
                </label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="Goa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="India"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Postal / ZIP Code
                </label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="text-xs rounded-md"
                  placeholder="403001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours & Localization */}
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#5e2b9d]" />
              <CardTitle className="text-sm font-medium text-gray-900">
                Operating Policies &amp; Localization
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Base Accounting Currency
                </label>
                <SearchableSelect
                  value={currency}
                  onChange={setCurrency}
                  placeholder="Select currency..."
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <SearchableSelect
                  value={timezone}
                  onChange={setTimezone}
                  placeholder="Select timezone..."
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="UTC">UTC (Universal Coordinated)</option>
                  <option value="America/New_York">America/New_York (EST -5:00)</option>
                  <option value="Europe/London">Europe/London (GMT +0:00)</option>
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Standard Check-in Time
                </label>
                <CustomTimePicker
                  value={checkInTime}
                  onChange={setCheckInTime}
                  placeholder="14:00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Standard Check-out Time
                </label>
                <CustomTimePicker
                  value={checkOutTime}
                  onChange={setCheckOutTime}
                  placeholder="11:00"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Property Overview / Description
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight property amenities, location advantages, and hospitality experience..."
                className="text-xs rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Indian Statutory & Regulatory Compliance */}
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="border-b border-gray-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#5e2b9d]" />
                <CardTitle className="text-sm font-medium text-gray-900">
                  Indian Statutory &amp; Regulatory Compliance
                </CardTitle>
              </div>
              <Badge variant="purple" className="text-[10px] rounded-sm font-mono">
                GST / FRRO / FSSAI
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hotel GSTIN (15 Digits)
                </label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  maxLength={15}
                  placeholder="36AABCS1429B1Z1"
                  className="text-xs rounded-md uppercase font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Printed on Rule 46 Tax Invoices</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Permanent Account Number (PAN)
                </label>
                <Input
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  maxLength={10}
                  placeholder="AABCS1429B"
                  className="text-xs rounded-md uppercase font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Entity Income Tax identifier</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  FSSAI Food Safety Licence #
                </label>
                <Input
                  value={fssaiNumber}
                  onChange={(e) => setFssaiNumber(e.target.value)}
                  maxLength={14}
                  placeholder="10020042000123"
                  className="text-xs rounded-md font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Required for dining / F&amp;B service</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  FRRO Accommodator Registration Code
                </label>
                <Input
                  value={frroCode}
                  onChange={(e) => setFrroCode(e.target.value)}
                  placeholder="HYD00249"
                  className="text-xs rounded-md uppercase font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Form III / Form C portal ID</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Night Audit Automated Closing Time
                </label>
                <CustomTimePicker
                  value={nightAuditTime}
                  onChange={setNightAuditTime}
                  placeholder="02:00"
                />
                <p className="text-[10px] text-gray-400 mt-1">Daily room charge posting &amp; day close</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action button */}
        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium px-6 cursor-pointer rounded-md shadow-2xs"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving to Supabase...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

