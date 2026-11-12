import React from 'react'
import { Settings, ShieldCheck, Hotel, Receipt, Bell, Key, Database, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = { title: 'System & Property Settings | StayNext' }

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            System &amp; Tenant Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure multi-property preferences, tax rules, staff roles, API keys, and audit logging.
          </p>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Hotel className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Property Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-gray-600">
            <p>Property name, legal address, contact numbers, official email, and brand logos.</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-emerald-600 font-semibold text-[11px]">&bull; Active &amp; Verified</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">Configure</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Receipt className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Taxes &amp; Invoicing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-gray-600">
            <p>State lodging tax, city hotel occupancy tax, VAT rates, and invoice sequential numbering.</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 font-medium text-[11px]">Default: 12% Combined</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">Manage Taxes</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Roles &amp; Permissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-gray-600">
            <p>Granular RBAC controls for Hotel Owners, Front Desk, Housekeeping, Accountants, and Staff.</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 font-medium text-[11px]">8 System Roles</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">Edit Permissions</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Database className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Supabase PostgreSQL</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-gray-600">
            <p>Connected database instance, migration version, connection pooling, and Row Level Security.</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <Badge variant="purple" className="text-[10px]">RLS Enforced</Badge>
              <Button size="sm" variant="outline" className="h-7 text-xs">DB Status</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Notifications &amp; Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-gray-600">
            <p>In-app alerts, email notifications for new reservations, VIP arrivals, and housekeeping milestones.</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-emerald-600 font-semibold text-[11px]">&bull; Realtime Enabled</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">Alert Rules</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Key className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Audit Logs &amp; Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-gray-600">
            <p>Immutable audit trail of reservation updates, room rate modifications, payment voiding, and logins.</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 font-medium text-[11px]">SOC2 Ready</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">View Audit Log</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

