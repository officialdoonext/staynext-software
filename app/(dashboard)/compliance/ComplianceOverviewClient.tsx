'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Users,
  Building,
  Clock,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ForeignGuestRecord, PropertyLicenseRecord } from '@/services/compliance.service'
import { formatDate } from '@/lib/utils'

interface ComplianceOverviewClientProps {
  overview: any
  foreignGuests: ForeignGuestRecord[]
  licenses: PropertyLicenseRecord[]
}

export default function ComplianceOverviewClient({
  overview,
  foreignGuests,
  licenses,
}: ComplianceOverviewClientProps) {
  const pendingFormIII = foreignGuests.filter((g) => g.form_iii_status === 'Pending')

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
              Indian Hospitality Regulatory &amp; Statutory Compliance
            </h1>
            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
              Rule 17 (2025) &bull; DPDP 2023
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Mandatory FRRO Form III foreign guest tracking, police guest register, municipal licenses, and data privacy records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://indianfrro.gov.in/frro/FormC/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 cursor-pointer rounded-md border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Official FRRO Portal
            </Button>
          </a>
          <Link href="/compliance/form-iii">
            <Button
              size="sm"
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              File Form III Report
            </Button>
          </Link>
        </div>
      </div>

      {/* FRRO Rule 17 Statutory Alert Banner */}
      {pendingFormIII.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-md shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-amber-950">
                Action Required: {pendingFormIII.length} Foreign Guest Form III Report Pending (&lt; 24h Statutory Window)
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5 max-w-3xl leading-relaxed">
                Under the Immigration and Foreigners Act 2025 and Rule 17 (Form III), hotel operators must transmit guest passport, visa, and arrival manifests to the Bureau of Immigration within 24 hours of arrival. Failure to submit attracts statutory penalties.
              </p>
            </div>
          </div>
          <Link href="/compliance/form-iii">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 rounded-sm cursor-pointer shrink-0">
              Complete Filing Now &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#5e2b9d]">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium text-gray-600">Foreign Guests</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{overview.totalForeign}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Currently registered in-house</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium text-gray-600">Form III Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{overview.formIIIPending}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Within 24h compliance clock</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-medium text-gray-600">Form III Submitted</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{overview.formIIISubmitted}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Acknowledged by FRRO</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#5e2b9d]">
              <Building className="h-4 w-4" />
              <span className="text-xs font-medium text-gray-600">Property Licenses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{licenses.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Trade, Fire NOC, FSSAI, Pollution</p>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Modules Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Foreign Guest Register (Rule 17)</span>
              <Badge variant="purple" className="text-[10px]">Statutory</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3">
            <p className="text-xs text-gray-600">
              Log foreign passports, visas, immigration arrival dates, port of entry, and preceding/proceeding travel destinations.
            </p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">{foreignGuests.length} Active Records</span>
              <Link href="/compliance/foreign-guests">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] p-0 font-medium">
                  View Register &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Form III 24h Filing Console</span>
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                24h Deadline
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3">
            <p className="text-xs text-gray-600">
              Interactive filing wizard: export XML / JSON payloads, attach guest photo, and record FRRO submission reference receipts.
            </p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-amber-700 font-medium">{pendingFormIII.length} Pending Actions</span>
              <Link href="/compliance/form-iii">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] p-0 font-medium">
                  Open Filing Wizard &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Local Police Guest Register</span>
              <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">
                Statutory Register
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3">
            <p className="text-xs text-gray-600">
              Standardized format for inspection by local law enforcement: serial numbers, photo ID records, addresses, and digital acceptance.
            </p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Printable A4 Logbook</span>
              <Link href="/compliance/guest-register">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] p-0 font-medium">
                  Open Police Register &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Property Licenses &amp; Permits</span>
              <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-600">
                {licenses.length} Permits
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3">
            <p className="text-xs text-gray-600">
              Monitor expiry and renewal dates for Trade License, Fire Safety NOC, FSSAI Food License, Lift Certificate, and Liquor Permit.
            </p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Expiry Alert Engine</span>
              <Link href="/compliance/licences">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] p-0 font-medium">
                  Manage Licenses &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>DPDP Act 2023 / 2025 Audit Logs</span>
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                Privacy Protected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3">
            <p className="text-xs text-gray-600">
              Maintain immutable audit logs of staff viewing guest ID documents, Aadhaar/Passport lookups, and export activities for DPDP compliance.
            </p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-medium">Consents Verified</span>
              <Link href="/compliance/audit-logs">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] p-0 font-medium">
                  View Audit Logs &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
