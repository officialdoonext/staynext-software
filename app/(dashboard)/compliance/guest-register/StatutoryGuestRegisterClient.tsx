'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Printer,
  Download,
  Search,
  ShieldCheck,
  Building,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatutoryRegisterRecord } from '@/services/compliance.service'
import { formatDate } from '@/lib/utils'

interface StatutoryGuestRegisterClientProps {
  initialRecords: StatutoryRegisterRecord[]
}

export default function StatutoryGuestRegisterClient({ initialRecords }: StatutoryGuestRegisterClientProps) {
  const [records, setRecords] = useState<StatutoryRegisterRecord[]>(initialRecords)
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = records.filter((r) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      r.guest_name.toLowerCase().includes(q) ||
      r.serial_number.toLowerCase().includes(q) ||
      r.mobile_number.includes(q) ||
      r.id_proof_number.toLowerCase().includes(q) ||
      r.room_number.includes(q) ||
      r.permanent_address.toLowerCase().includes(q)
    )
  })

  const handlePrint = () => {
    window.print()
  }

  const exportCSV = () => {
    const headers = [
      'Serial #',
      'Check-in Date & Time',
      'Guest Name',
      'Gender',
      'Age',
      'Room #',
      'Permanent Address',
      'Mobile Phone',
      'ID Proof Type',
      'ID Proof Number',
      'Arrived From',
      'Proceeding To',
      'Check-out Date',
      'Digital Acceptance'
    ]
    const rows = filtered.map((r) => [
      `"${r.serial_number}"`,
      `"${r.check_in_date} ${r.check_in_time || ''}"`,
      `"${r.guest_name}"`,
      r.gender,
      r.age || '',
      r.room_number,
      `"${r.permanent_address.replace(/"/g, '""')}"`,
      `"${r.mobile_number}"`,
      `"${r.id_proof_type}"`,
      `"${r.id_proof_number}"`,
      `"${r.arrived_from || ''}"`,
      `"${r.proceeding_to || ''}"`,
      r.check_out_date,
      r.signature_status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `police_guest_register_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/compliance">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
                Statutory Police Guest Register
              </h1>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                Official Law Enforcement Register
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Official guest register format required by local state police and municipal authorities for mandatory inspection.
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
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Statutory Register
          </Button>
        </div>
      </div>

      {/* Printable Heading (Only visible in Print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">
          STAYNEXT HOTEL &amp; SUITES &bull; OFFICIAL GUEST REGISTER
        </h2>
        <p className="text-xs text-gray-600">
          Maintained in Compliance with State Police Regulations &bull; Financial District, Hyderabad, Telangana
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Date of Generation: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Filter and Search Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs print:hidden">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by serial #, guest name, mobile, Aadhaar, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div className="text-xs text-gray-500">
          Showing <strong className="text-gray-900">{filtered.length}</strong> statutory entries
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto print:border-none print:shadow-none">
        <table className="w-full text-left text-xs min-w-[1000px] border-collapse">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase text-[10px] font-semibold tracking-wider print:bg-gray-100">
            <tr>
              <th className="px-3 py-2.5 border-r border-gray-200">S.No / Reg #</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Check-in Date &amp; Time</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Guest Name &amp; Category</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Age / Gender</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Room #</th>
              <th className="px-3 py-2.5 border-r border-gray-200 max-w-[200px]">Permanent Address</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Contact Number</th>
              <th className="px-3 py-2.5 border-r border-gray-200">ID Proof &amp; Number</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Origin &rarr; Destination</th>
              <th className="px-3 py-2.5 border-r border-gray-200">Expected Check-out</th>
              <th className="px-3 py-2.5 text-center">Digital Sig</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 print:divide-gray-300">
            {filtered.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                <td className="px-3 py-2.5 font-mono text-[11px] font-medium text-gray-900 border-r border-gray-100 print:border-gray-300">
                  {r.serial_number}
                </td>
                <td className="px-3 py-2.5 text-gray-700 border-r border-gray-100 print:border-gray-300">
                  <div>{formatDate(r.check_in_date)}</div>
                  <span className="text-[10px] text-gray-400">{r.check_in_time}</span>
                </td>
                <td className="px-3 py-2.5 border-r border-gray-100 print:border-gray-300">
                  <div className="font-semibold text-gray-900">{r.guest_name}</div>
                  <span className="text-[9px] text-gray-500">{r.guest_category}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-600 border-r border-gray-100 print:border-gray-300">
                  {r.age ? `${r.age} yrs` : 'Adult'} &bull; {r.gender}
                </td>
                <td className="px-3 py-2.5 font-semibold text-purple-700 border-r border-gray-100 print:border-gray-300">
                  Room {r.room_number}
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-[11px] max-w-[200px] truncate border-r border-gray-100 print:border-gray-300" title={r.permanent_address}>
                  {r.permanent_address}
                </td>
                <td className="px-3 py-2.5 font-mono text-gray-800 border-r border-gray-100 print:border-gray-300">
                  {r.mobile_number}
                </td>
                <td className="px-3 py-2.5 border-r border-gray-100 print:border-gray-300">
                  <span className="text-[10px] font-medium text-gray-800 block">{r.id_proof_type}</span>
                  <span className="font-mono text-[10px] text-gray-500">{r.id_proof_number}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-[11px] border-r border-gray-100 print:border-gray-300">
                  <div>{r.arrived_from || 'Direct'} &rarr;</div>
                  <div className="text-gray-400">{r.proceeding_to || 'Direct'}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-700 border-r border-gray-100 print:border-gray-300">
                  {formatDate(r.check_out_date)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    {r.signature_status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
