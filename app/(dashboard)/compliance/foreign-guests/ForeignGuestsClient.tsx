'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ForeignGuestRecord, submitFormIIIAcknowledgment } from '@/services/compliance.service'
import { formatDate } from '@/lib/utils'

interface ForeignGuestsClientProps {
  initialGuests: ForeignGuestRecord[]
}

export default function ForeignGuestsClient({ initialGuests }: ForeignGuestsClientProps) {
  const [guests, setGuests] = useState<ForeignGuestRecord[]>(initialGuests)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = guests.filter((g) => {
    const matchesStatus = statusFilter === 'all' || g.form_iii_status.toLowerCase() === statusFilter.toLowerCase()
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      g.guest_name.toLowerCase().includes(q) ||
      g.passport_number.toLowerCase().includes(q) ||
      g.passport_issue_country.toLowerCase().includes(q) ||
      (g.visa_number && g.visa_number.toLowerCase().includes(q)) ||
      (g.room_number && g.room_number.includes(q))
    return matchesStatus && matchesSearch
  })

  const exportCSV = () => {
    const headers = [
      'Guest Name',
      'Room #',
      'Passport Number',
      'Issue Country',
      'Visa Number',
      'Visa Type',
      'Arrival Date',
      'Arrived From',
      'Proceeding To',
      'Purpose of Visit',
      'Form III Status',
      'FRRO Ref #'
    ]
    const rows = filtered.map((g) => [
      `"${g.guest_name}"`,
      g.room_number || '',
      `"${g.passport_number}"`,
      `"${g.passport_issue_country}"`,
      `"${g.visa_number || ''}"`,
      `"${g.visa_type || ''}"`,
      g.arrival_date,
      `"${g.arrived_from}"`,
      `"${g.proceeding_to}"`,
      `"${g.purpose_of_visit}"`,
      g.form_iii_status,
      `"${g.form_iii_reference_number || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `foreign_guests_rule17_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/compliance">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
                Foreign Guest Register (Form III / Rule 17)
              </h1>
              <Badge variant="purple" className="text-[10px]">Statutory Register</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Statutory register under Rule 17 of Immigration and Foreigners Rules 2025. Mandatory 24-hr FRRO reporting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Register
          </Button>

          <Link href="/compliance/form-iii">
            <Button
              size="sm"
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              File Form III (24h)
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guest name, passport #, country, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Form III Status:</span>
          <div className="flex gap-1">
            {['all', 'pending', 'submitted', 'acknowledged'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-[#5e2b9d] text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Foreign Guest &amp; Room</th>
              <th className="px-4 py-3">Passport Details</th>
              <th className="px-4 py-3">Visa Details</th>
              <th className="px-4 py-3">Arrival &amp; Next Destination</th>
              <th className="px-4 py-3">Purpose of Visit</th>
              <th className="px-4 py-3">Form III Status</th>
              <th className="px-4 py-3">FRRO Reference #</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900 text-xs">No foreign guest records found</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">All foreign check-ins will automatically populate here.</div>
                </td>
              </tr>
            ) : (
              filtered.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{g.guest_name}</div>
                    <div className="text-[10px] text-purple-700 bg-purple-50 inline-block px-1 rounded-xs mt-0.5 font-medium">
                      Room #{g.room_number || '-'}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-gray-900 block">{g.passport_number}</span>
                    <span className="text-[10px] text-gray-500">{g.passport_issue_country}</span>
                    {g.passport_expiry_date && (
                      <div className="text-[9px] text-gray-400">Exp: {formatDate(g.passport_expiry_date)}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {g.visa_number ? (
                      <div>
                        <span className="font-mono text-xs text-gray-900 block">{g.visa_number}</span>
                        <span className="text-[10px] text-gray-500">{g.visa_type || 'e-Visa'}</span>
                      </div>
                    ) : g.is_oci ? (
                      <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">
                        OCI Cardholder
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-gray-400">Visa Exempt / On Arrival</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    <div>
                      <span className="text-gray-400">From:</span> {g.arrived_from}
                    </div>
                    <div>
                      <span className="text-gray-400">To:</span> {g.proceeding_to}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Arr: {formatDate(g.arrival_date)}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    <span className="font-medium text-gray-900">{g.purpose_of_visit}</span>
                  </td>

                  <td className="px-4 py-3">
                    {g.form_iii_status === 'Pending' ? (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 animate-pulse">
                        Pending (&lt; 24h)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                        {g.form_iii_status}
                      </Badge>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {g.form_iii_reference_number ? (
                      <span className="font-mono text-[11px] font-medium text-purple-700">
                        {g.form_iii_reference_number}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 italic">Not generated</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link href={`/compliance/form-iii?guestId=${g.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] border-[#dfcef6] rounded-sm cursor-pointer"
                      >
                        {g.form_iii_status === 'Pending' ? 'File Now' : 'View Slip'}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
