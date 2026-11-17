'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Mail,
  Save,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  NotificationSettingsData,
  saveNotificationPreferences,
} from '@/services/settings.service'
import { toast } from 'sonner'

interface NotificationsClientProps {
  propertyId: string
  initialPreferences: NotificationSettingsData
}

export function NotificationsClient({
  propertyId,
  initialPreferences,
}: NotificationsClientProps) {
  const [prefs, setPrefs] = useState<NotificationSettingsData>(initialPreferences)
  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (key: keyof NotificationSettingsData) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) {
      toast.error('No property loaded')
      return
    }

    setIsSaving(true)
    const res = await saveNotificationPreferences(propertyId, prefs)
    setIsSaving(false)

    if (res.success) {
      toast.success('Notification preferences saved to Supabase')
    } else {
      toast.error(res.error || 'Failed to update preferences')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sora">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Notification Channels &amp; Automated Triggers
            </h1>
            <p className="text-xs text-gray-500">
              Configure automated guest email/WhatsApp receipts and staff operational alerts.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Guest Communications Card */}
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#5e2b9d]" />
              Automated Guest Communications (Email &amp; WhatsApp)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 divide-y divide-gray-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  Instant Booking Confirmation
                </p>
                <p className="text-[11px] text-gray-500">
                  Send guest an email with reservation details and calendar invite immediately upon booking.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.bookingConfirmation}
                onChange={() => handleToggle('bookingConfirmation')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  Pre-Arrival Welcome &amp; Digital Registration Pass
                </p>
                <p className="text-[11px] text-gray-500">
                  Dispatch digital self-service registration and contactless check-in link 24 hours prior.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.preArrivalWelcome}
                onChange={() => handleToggle('preArrivalWelcome')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  Digital Folio &amp; GST Tax Invoice on Checkout
                </p>
                <p className="text-[11px] text-gray-500">
                  Automatically attach SAC 9963 tax-compliant PDF invoice to departure thank-you email.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.checkoutFolioPdf}
                onChange={() => handleToggle('checkoutFolioPdf')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  Post-Stay CSAT Review &amp; Feedback Survey
                </p>
                <p className="text-[11px] text-gray-500">
                  Send Google Review / TripAdvisor feedback survey link 2 hours post room checkout.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.postStayReview}
                onChange={() => handleToggle('postStayReview')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Staff Operations Card */}
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#5e2b9d]" />
              Internal Operational &amp; Management Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 divide-y divide-gray-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  Urgent Maintenance Request Dispatch
                </p>
                <p className="text-[11px] text-gray-500">
                  Alert on-duty chief engineer immediately when a high-priority AC, plumbing, or electrical issue is logged.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.urgentMaintenanceAlert}
                onChange={() => handleToggle('urgentMaintenanceAlert')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  VIP Guest Arrival Notification
                </p>
                <p className="text-[11px] text-gray-500">
                  Notify General Manager and Concierge lead when a VIP profile checks in at the front desk.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.vipArrivalAlert}
                onChange={() => handleToggle('vipArrivalAlert')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">
                  Low Inventory Safety Stock Warning
                </p>
                <p className="text-[11px] text-gray-500">
                  Notify housekeeping and procurement when linens, toiletries, or minibar items fall below reorder level.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.lowInventoryAlert}
                onChange={() => handleToggle('lowInventoryAlert')}
                className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs h-9 px-5 cursor-pointer rounded-md shadow-2xs"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
        </div>
      </form>
    </div>
  )
}

