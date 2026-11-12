import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, BedDouble, Calendar, TrendingUp } from 'lucide-react'
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

export const metadata = { title: 'Occupancy & RevPAR Reports | StayNext' }

const dailyOccupancy = [
  { date: '2026-11-11 (Today)', totalRooms: 64, occupied: 44, available: 12, dirtyCleaning: 4, maintenance: 4, occupancyRate: '68.8%', adr: 285.00, revpar: 196.08 },
  { date: '2026-11-10', totalRooms: 64, occupied: 48, available: 10, dirtyCleaning: 3, maintenance: 3, occupancyRate: '75.0%', adr: 290.00, revpar: 217.50 },
  { date: '2026-11-09', totalRooms: 64, occupied: 52, available: 8, dirtyCleaning: 2, maintenance: 2, occupancyRate: '81.3%', adr: 310.00, revpar: 252.03 },
  { date: '2026-11-08 (Weekend)', totalRooms: 64, occupied: 60, available: 2, dirtyCleaning: 1, maintenance: 1, occupancyRate: '93.8%', adr: 340.00, revpar: 318.92 },
  { date: '2026-11-07 (Weekend)', totalRooms: 64, occupied: 58, available: 4, dirtyCleaning: 1, maintenance: 1, occupancyRate: '90.6%', adr: 335.00, revpar: 303.51 },
  { date: '2026-11-06', totalRooms: 64, occupied: 45, available: 14, dirtyCleaning: 3, maintenance: 2, occupancyRate: '70.3%', adr: 275.00, revpar: 193.33 },
]

export default function OccupancyReportsPage() {
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
              Occupancy Rates &amp; RevPAR Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Daily room inventory utilization, Average Daily Rate (ADR), and Revenue Per Available Room (RevPAR).
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export Occupancy CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Current Occupancy</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">68.8%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">44 of 64 rooms occupied</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Average Daily Rate (ADR)</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(295)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">↑ 8.2% vs last month</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">RevPAR</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(202.96)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Revenue / Total Rooms</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Projected Weekend</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">94.2%</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Near full capacity</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Total Inventory</TableHead>
              <TableHead>Occupied</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Occupancy %</TableHead>
              <TableHead>Average Daily Rate (ADR)</TableHead>
              <TableHead className="text-right">RevPAR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyOccupancy.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="font-semibold text-gray-900 text-xs">{row.date}</TableCell>
                <TableCell className="font-mono text-xs">{row.totalRooms} Rooms</TableCell>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{row.occupied}</TableCell>
                <TableCell className="font-mono text-xs text-emerald-600">{row.available}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">{row.occupancyRate}</TableCell>
                <TableCell className="font-mono text-xs font-bold">{formatCurrency(row.adr)}</TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-indigo-600">{formatCurrency(row.revpar)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
