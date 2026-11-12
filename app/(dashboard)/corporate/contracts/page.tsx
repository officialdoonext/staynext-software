import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Download, Briefcase, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Corporate Rate Contracts | StayNext' }

const contracts = [
  { id: 'CTR-2026-01', company: 'Global Tech Consulting Inc.', roomRate: 195, baseType: 'Executive Double', minNightsYear: 250, nightsBooked: 284, contact: 'sarah.v@gtc.com', status: 'active', expires: '2026-12-31' },
  { id: 'CTR-2026-02', company: 'Apex BioPharma Logistics', roomRate: 210, baseType: 'Deluxe King', minNightsYear: 150, nightsBooked: 112, contact: 'travel@apexbiopharma.org', status: 'active', expires: '2027-03-31' },
  { id: 'CTR-2026-03', company: 'Metro Aviation Alliance', roomRate: 165, baseType: 'Standard Queen', minNightsYear: 400, nightsBooked: 390, contact: 'crewhotels@metroaviation.com', status: 'active', expires: '2026-12-31' },
  { id: 'CTR-2026-04', company: 'Vanguard Capital Partners', roomRate: 310, baseType: 'Junior Suite', minNightsYear: 80, nightsBooked: 45, contact: 'exec.travel@vanguardcap.com', status: 'under_review', expires: '2026-11-30' },
]

export default function CorporateContractsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/corporate">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Corporate Negotiated Rate Agreements
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Fixed corporate room rates, guaranteed minimum room night quotas, and billing terms.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Draft New Agreement
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract ID</TableHead>
              <TableHead>Corporate Account</TableHead>
              <TableHead>Locked Rate</TableHead>
              <TableHead>Room Class</TableHead>
              <TableHead>Annual Quota Progress</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{c.id}</TableCell>
                <TableCell className="font-semibold text-gray-900 text-xs">
                  <div>{c.company}</div>
                  <div className="text-[11px] text-gray-400 font-normal">{c.contact}</div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">{formatCurrency(c.roomRate)} / night</TableCell>
                <TableCell className="text-xs text-gray-600">{c.baseType}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-800">{c.nightsBooked} / {c.minNightsYear} nights</span>
                    <span className="text-gray-400 font-mono">{Math.round((c.nightsBooked / c.minNightsYear) * 100)}%</span>
                  </div>
                  <div className="w-32 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min((c.nightsBooked / c.minNightsYear) * 100, 100)}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{c.expires}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                    {c.status === 'active' ? 'Active' : 'Expiring Soon'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
