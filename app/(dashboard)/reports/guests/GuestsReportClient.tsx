'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Users,
  Award,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GuestAnalyticsData } from '@/services/report.service'
import { toast } from 'sonner'

interface GuestsReportClientProps {
  analytics: GuestAnalyticsData
  propertyId: string
}

export function GuestsReportClient({ analytics, propertyId }: GuestsReportClientProps) {
  const handleExportCSV = () => {
    if (analytics.topGuests.length === 0) {
      toast.info('No guest data to export')
      return
    }
    const headers = ['Guest Name', 'Email', 'Phone', 'Total Stays', 'VIP Status']
    const rows = analytics.topGuests.map((g) => [
      `"${g.name}"`,
      `"${g.email || '-'}"`,
      `"${g.phone || '-'}"`,
      g.totalStays,
      g.isVip ? 'VIP' : 'Standard',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `guests_crm_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Guests CRM report exported')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Guest Profiles &amp; Loyalty Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Guest retention, VIP traveler recognition, stay frequencies, and contact profiles.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Guest CRM
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Registered Guest Profiles</span>
          <p className="text-2xl font-medium text-gray-900 mt-2 font-mono">
            {analytics.totalGuests}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">In CRM database</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">VIP Tier Guests</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2 font-mono">
            {analytics.vipCount}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">High-value travelers</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Repeat Guest Ratio</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2 font-mono">
            {analytics.totalGuests > 0
              ? `${Math.round(
                  (analytics.topGuests.filter((g) => g.totalStays > 1).length / analytics.totalGuests) * 100
                )}%`
              : '0%'}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Multiple hotel bookings</p>
        </div>
      </div>

      {analytics.topGuests.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Guest Profiles Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Guest profiles are automatically generated as guests book reservations or check into rooms.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Guest Name</TableHead>
                <TableHead className="text-xs font-medium">Email Address</TableHead>
                <TableHead className="text-xs font-medium">Phone</TableHead>
                <TableHead className="text-xs font-medium">Completed Stays</TableHead>
                <TableHead className="text-xs font-medium text-right">VIP Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topGuests.map((g) => (
                <TableRow key={g.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-xs text-gray-900">
                    {g.name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{g.email || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-500">{g.phone || '-'}</TableCell>
                  <TableCell className="text-xs font-mono font-medium text-gray-900">
                    {g.totalStays} {g.totalStays === 1 ? 'stay' : 'stays'}
                  </TableCell>
                  <TableCell className="text-right">
                    {g.isVip ? (
                      <Badge variant="success" className="text-[10px] rounded-sm">
                        VIP Guest
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] rounded-sm">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

