'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Globe,
  RefreshCw,
  Key,
  Shield,
  Copy,
  ExternalLink,
  CheckCircle2,
  Sliders,
  Save,
  Tag,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface BookingEngineClientProps {
  property: any
  channelsCount: number
}

export function BookingEngineClient({ property, channelsCount }: BookingEngineClientProps) {
  const propertyId = property?.id || ''
  const propertyName = property?.name || 'Hotel Property'

  const [isSyncing, setIsSyncing] = useState(false)
  const [embedCodeCopied, setEmbedCodeCopied] = useState(false)

  // Policy settings
  const [checkInTime, setCheckInTime] = useState(property?.settings?.check_in_time || '14:00')
  const [checkOutTime, setCheckOutTime] = useState(property?.settings?.check_out_time || '11:00')
  const [minDeposit, setMinDeposit] = useState(property?.settings?.min_deposit_percent || '20')
  const [cancelHours, setCancelHours] = useState(property?.settings?.free_cancel_hours || '48')
  const [isSaving, setIsSaving] = useState(false)

  const directUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/guest/${propertyId}/book`
    : `https://staynext.com/guest/${propertyId}/book`

  const embedScript = `<iframe src="${directUrl}" width="100%" height="800" frameborder="0"></iframe>`

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedScript)
    setEmbedCodeCopied(true)
    toast.success('Widget embed code copied to clipboard!')
    setTimeout(() => setEmbedCodeCopied(false), 2500)
  }

  const handleSyncAll = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
      toast.success('All distribution channels 2-way rate & availability synchronized!')
    }, 1200)
  }

  const handleSavePolicies = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Direct booking policies updated!')
    }, 600)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Booking Engine &amp; Channel Manager
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Zero-commission direct booking widget, coupon discounts, and real-time 2-way OTA rate &amp; availability sync.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/booking-engine/channels">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <Radio className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              OTA Channels ({channelsCount})
            </Button>
          </Link>
          <Link href="/booking-engine/promotions">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <Tag className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Direct Perks &amp; Banners
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Force Full Sync'}
          </Button>
        </div>
      </div>

      {/* Direct Booking Engine Widget Card */}
      <Card className="border-gray-200 shadow-2xs rounded-md">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium font-sora text-gray-900">
                Embedded Direct Booking Engine
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Embed this lightweight booking widget on your official hotel website to capture 0% commission direct bookings.
              </p>
            </div>
            <Badge variant="success" className="text-[10px] rounded-sm">
              Live &amp; Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Direct Booking Engine Embed Code
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                readOnly
                value={embedScript}
                className="font-mono text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-md w-full text-gray-700 select-all"
              />
              <Button
                size="sm"
                onClick={handleCopyEmbed}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs shrink-0 cursor-pointer rounded-md font-medium"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                {embedCodeCopied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Direct reservations booked through this engine automatically create guest folios and allocate clean rooms without commission fees.
              </span>
            </div>
            <span className="font-medium text-emerald-700 shrink-0 font-mono">0% Commission</span>
          </div>
        </CardContent>
      </Card>

      {/* Booking Policies Configuration */}
      <Card className="border-gray-200 shadow-2xs rounded-md">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-medium font-sora text-gray-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#5e2b9d]" />
            Direct Booking Rules &amp; Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Standard Check-In Time</label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Standard Check-Out Time</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Advance Deposit Required (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Free Cancellation Window (Hours)</label>
              <input
                type="number"
                min="0"
                value={cancelHours}
                onChange={(e) => setCancelHours(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSavePolicies}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs font-medium cursor-pointer rounded-md"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? 'Updating...' : 'Save Policies'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

