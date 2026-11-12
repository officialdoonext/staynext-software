import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Mail, MessageSquare, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Notification Rules & Alerts | StayNext' }

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Notification Channels &amp; Automated Triggers
            </h1>
            <p className="text-xs text-gray-500">
              Manage system dispatch events, guest confirmation emails, and staff maintenance alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              Automated Guest Communications (Email &amp; SMS)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-gray-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">Instant Booking Confirmation</p>
                <p className="text-[11px] text-gray-500">Send guest an email with reservation details and calendar invite immediately upon booking.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">Pre-Arrival Welcome &amp; Digital Registration</p>
                <p className="text-[11px] text-gray-500">Dispatch digital check-in registration link 24 hours prior to guest arrival.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">Digital Folio &amp; Tax Receipt on Checkout</p>
                <p className="text-[11px] text-gray-500">Automatically attach itemized PDF invoice to departure thank-you email.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">Post-Stay CSAT Review Request</p>
                <p className="text-[11px] text-gray-500">Send Google Review or TripAdvisor feedback request 2 hours after checkout.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              Internal Operational &amp; Management Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-gray-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">Urgent Maintenance Request Dispatch</p>
                <p className="text-[11px] text-gray-500">Alert on-duty chief engineer immediately when a room AC, plumbing, or lock failure is logged.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">VIP Guest Arrival Notice</p>
                <p className="text-[11px] text-gray-500">Notify General Manager and Concierge when a VIP profile checks in at front desk.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">Low Inventory Threshold Warning</p>
                <p className="text-[11px] text-gray-500">Notify procurement manager when linens or guest toiletries fall below safety stock.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
            <Save className="h-4 w-4 mr-1.5" />
            Save Notification Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}
