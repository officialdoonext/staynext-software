'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  Download,
  Lock,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ComplianceAuditLog } from '@/services/compliance.service'
import { formatDate, formatDateTime } from '@/lib/utils'

interface ComplianceAuditLogsClientProps {
  initialLogs: ComplianceAuditLog[]
}

export default function ComplianceAuditLogsClient({ initialLogs }: ComplianceAuditLogsClientProps) {
  const [logs, setLogs] = useState<ComplianceAuditLog[]>(initialLogs)
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = logs.filter((l) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      l.user_name.toLowerCase().includes(q) ||
      l.action_type.toLowerCase().includes(q) ||
      l.resource_type.toLowerCase().includes(q) ||
      l.resource_id.toLowerCase().includes(q) ||
      (l.ip_address && l.ip_address.includes(q))
    )
  })

  const exportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Staff User', 'Action Type', 'Resource Type', 'Resource ID', 'IP Address']
    const rows = filtered.map((l) => [
      `"${l.id}"`,
      l.created_at,
      `"${l.user_name}"`,
      `"${l.action_type}"`,
      `"${l.resource_type}"`,
      `"${l.resource_id}"`,
      `"${l.ip_address || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dpdp_compliance_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
                DPDP Act 2023 / 2025 Privacy &amp; Access Audit Logs
              </h1>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                Data Fiduciary Logs
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Statutory audit trail of all staff access to guest identification records, Aadhaar numbers, and export operations.
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
            Export Audit Trail
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <span>
            <strong>Data Fiduciary Standard:</strong> In compliance with the Digital Personal Data Protection Act (DPDP), guest identity proofs are masked and all receptionist inspections are logged with immutable timestamps.
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search action type, staff user, resource ID, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="text-xs text-gray-500">
          Logged Events: <strong className="text-gray-900">{filtered.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Authorized Staff / System</th>
              <th className="px-4 py-3">Statutory Action Type</th>
              <th className="px-4 py-3">Resource Target</th>
              <th className="px-4 py-3">Resource ID</th>
              <th className="px-4 py-3">Terminal IP</th>
              <th className="px-4 py-3 text-right">Privacy Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Lock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No audit events logged</div>
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {log.user_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800 text-[11px] block">{log.action_type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.resource_type}
                  </td>
                  <td className="px-4 py-3 font-mono text-purple-700 font-medium">
                    {log.resource_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      DPDP Consented
                    </Badge>
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
