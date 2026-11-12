import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react'
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

export const metadata = { title: 'Revenue & Yield Reports | StayNext' }

const revenueStreams = [
  { stream: 'Room Stays & Lodging', mtd: 48900.00, ytd: 512000.00, share: '71.5%', growth: '+14.2%' },
  { stream: 'Food & Beverage / Restaurant', mtd: 12400.00, ytd: 135000.00, share: '18.1%', growth: '+8.5%' },
  { stream: 'Spa & Wellness Services', mtd: 3800.00, ytd: 41000.00, share: '5.6%', growth: '+22.0%' },
  { stream: 'Valet Parking & Airport Transfers', mtd: 1950.00, ytd: 21500.00, share: '2.8%', growth: '+5.1%' },
  { stream: 'Minibar, Laundry & Incidentals', mtd: 1370.00, ytd: 14800.00, share: '2.0%', growth: '+3.4%' },
]

export default function RevenueReportsPage() {
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
              Revenue Breakdown &amp; Yield Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-department revenue streams, ancillary income contribution, and month-over-month yield pacing.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export Revenue Audit
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Month-to-Date Revenue</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(68420)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">↑ 12.4% vs same period last month</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Gross Operating Profit (GOP)</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">44.8%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Net margins healthy</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Ancillary RevPAR</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(54.20)}</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Non-room spend / guest</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">OTA Commission Expense</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(5350)}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">7.8% of gross bookings</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Revenue Stream Contribution Matrix</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Revenue Stream</TableHead>
              <TableHead>Month-to-Date (MTD)</TableHead>
              <TableHead>Year-to-Date (YTD)</TableHead>
              <TableHead>Portfolio Share</TableHead>
              <TableHead className="text-right">YoY Growth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueStreams.map((item) => (
              <TableRow key={item.stream}>
                <TableCell className="font-semibold text-gray-900 text-xs">{item.stream}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">{formatCurrency(item.mtd)}</TableCell>
                <TableCell className="font-mono text-xs text-gray-600">{formatCurrency(item.ytd)}</TableCell>
                <TableCell className="font-mono text-xs text-indigo-600 font-bold">{item.share}</TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">{item.growth}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
