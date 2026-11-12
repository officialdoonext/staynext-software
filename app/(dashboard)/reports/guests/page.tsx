import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Users, Star, Globe, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Guest Demographics & Loyalty Reports | StayNext' }

const guestSegments = [
  { segment: 'Corporate Business Travelers', share: '38.5%', avgStay: '2.4 Nights', repeatRate: '46.0%', avgSpendPerStay: 920.00 },
  { segment: 'Leisure Couples & Romantic Escapes', share: '29.0%', avgStay: '3.6 Nights', repeatRate: '28.5%', avgSpendPerStay: 1350.00 },
  { segment: 'Families & Group Bookings', share: '18.2%', avgStay: '4.2 Nights', repeatRate: '19.0%', avgSpendPerStay: 2100.00 },
  { segment: 'Solo Travelers & Digital Nomads', share: '14.3%', avgStay: '6.8 Nights', repeatRate: '34.0%', avgSpendPerStay: 1480.00 },
]

export default function GuestReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Guest Demographics &amp; Loyalty Metrics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Guest retention rates, market segmentation, repeat customer lifetime value, and booking geography.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export Demographics
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Repeat Guest Ratio</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">34.2%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">High loyalty retention</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Guest Satisfaction (CSAT)</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">4.8 / 5.0</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Based on 148 reviews</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Average Length of Stay</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">3.1 Nights</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Across all room classes</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">VIP Club Profiles</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">82 Guests</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">&gt; $3,000 spend tier</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Guest Market Segment Performance</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Persona / Segment</TableHead>
              <TableHead>Portfolio Share</TableHead>
              <TableHead>Average Length of Stay</TableHead>
              <TableHead>Repeat Booking Rate</TableHead>
              <TableHead className="text-right">Average Spend / Stay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guestSegments.map((s) => (
              <TableRow key={s.segment}>
                <TableCell className="font-semibold text-gray-900 text-xs">{s.segment}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{s.share}</TableCell>
                <TableCell className="font-mono text-xs">{s.avgStay}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-emerald-600">{s.repeatRate}</TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(s.avgSpendPerStay)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
