'use client'

import React from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Download,
  TrendingUp,
  Calendar,
  FileText,
  DollarSign,
  PieChart,
  Users,
  Building,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ExecutiveReportData } from '@/services/report.service'
import { toast } from 'sonner'

interface ReportsClientProps {
  report: ExecutiveReportData
  propertyId: string
}

export function ReportsClient({ report, propertyId }: ReportsClientProps) {
  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Sellable Rooms', report.totalRooms],
      ['Occupied Rooms', report.occupiedRooms],
      ['Occupancy Percentage', `${report.occupancyPercent}%`],
      ['Total Revenue', report.totalRevenue],
      ['Room Revenue', report.roomRevenue],
      ['F&B Revenue', report.fbRevenue],
      ['Operating Expenses', report.totalExpenses],
      ['Net Operating Profit', report.netProfit],
      ['ADR (Average Daily Rate)', report.adr],
      ['RevPAR', report.revPar],
      ['Total Reservations', report.totalReservations],
      ['Completed Checkouts', report.completedCheckouts],
      ['Direct Booking Ratio', `${report.directBookingRatio}%`],
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `executive_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Executive Report CSV downloaded')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Reports &amp; Business Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time RevPAR, ADR, occupancy yield, P&amp;L margins, and financial audit reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Executive Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">ADR (Average Daily Rate)</span>
          <p className="text-2xl font-medium text-gray-900 mt-2 font-mono">
            {formatCurrency(report.adr)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Per occupied room night</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">RevPAR (Yield Performance)</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2 font-mono">
            {formatCurrency(report.revPar)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Across sellable inventory</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Occupancy Rate</span>
          <p className="text-2xl font-medium text-gray-900 mt-2 font-mono">
            {report.occupancyPercent}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {report.occupiedRooms} / {report.totalRooms} rooms in-house
          </p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Net Operating Profit</span>
          <p
            className={`text-2xl font-medium mt-2 font-mono ${
              report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(report.netProfit)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Gross revenue less expenses</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Revenue Collected</span>
          <p className="text-xl font-medium text-gray-900 mt-1 font-mono">
            {formatCurrency(report.totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Operating Expenses</span>
          <p className="text-xl font-medium text-rose-600 mt-1 font-mono">
            {formatCurrency(report.totalExpenses)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Direct Booking Share</span>
          <p className="text-xl font-medium text-emerald-600 mt-1 font-mono">
            {report.directBookingRatio}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Completed Stays</span>
          <p className="text-xl font-medium text-gray-900 mt-1 font-mono">
            {report.completedCheckouts}
          </p>
        </div>
      </div>

      {/* Report Modules Navigation Grid */}
      <div className="pt-2">
        <h2 className="text-sm font-medium text-gray-700 mb-3 font-sora">
          Dedicated Audit &amp; Performance Ledgers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/reports/occupancy"
            className="bg-white p-5 rounded-md border border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-[#f7f2fd] text-[#5e2b9d] flex items-center justify-center mb-3">
                <Building className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d] flex items-center justify-between font-sora">
                Occupancy Yield
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Room type utilization, out-of-order blocks, and sellable inventory turnover.
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#5e2b9d] mt-4 block">View Breakdown &rarr;</span>
          </Link>

          <Link
            href="/reports/revenue"
            className="bg-white p-5 rounded-md border border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d] flex items-center justify-between font-sora">
                Revenue Ledger
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Settled folios, POS incidentals, advance deposits, and payment methods.
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#5e2b9d] mt-4 block">View Breakdown &rarr;</span>
          </Link>

          <Link
            href="/reports/financial"
            className="bg-white p-5 rounded-md border border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <PieChart className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d] flex items-center justify-between font-sora">
                Profit &amp; Loss (P&amp;L)
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Gross operating profit, department expense allocations, and net margins.
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#5e2b9d] mt-4 block">View Breakdown &rarr;</span>
          </Link>

          <Link
            href="/reports/guests"
            className="bg-white p-5 rounded-md border border-gray-200 shadow-2xs hover:border-[#5e2b9d] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d] flex items-center justify-between font-sora">
                Guest Demographics
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                VIP travelers, repeat guest ratios, and average length of stay.
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#5e2b9d] mt-4 block">View Breakdown &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

