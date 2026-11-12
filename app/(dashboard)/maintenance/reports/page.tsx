import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Wrench, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react'
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

export const metadata = { title: 'Maintenance History & Downtime Reports | StayNext' }

const historyItems = [
  { id: 'wo-101', date: '2026-11-10', room: '103', category: 'HVAC Servicing', tech: 'Sam Thorne', duration: '2.5 hrs', partsCost: 85, laborCost: 120, status: 'resolved' },
  { id: 'wo-102', date: '2026-11-08', room: '204', category: 'Bathroom Plumbing', tech: 'Dave Miller', duration: '1.0 hr', partsCost: 35, laborCost: 50, status: 'resolved' },
  { id: 'wo-103', date: '2026-11-06', room: 'Elevator #2', category: 'Safety Inspection', tech: 'Otis Certified', duration: '4.0 hrs', partsCost: 450, laborCost: 300, status: 'resolved' },
  { id: 'wo-104', date: '2026-11-05', room: '302', category: 'Balcony Tile Repair', tech: 'Dave Miller', duration: '3.0 hrs', partsCost: 120, laborCost: 150, status: 'in_progress' },
  { id: 'wo-105', date: '2026-11-02', room: 'Kitchen', category: 'Walk-in Cooler Thermostat', tech: 'Sam Thorne', duration: '2.0 hrs', partsCost: 210, laborCost: 100, status: 'resolved' },
]

export default function MaintenanceReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/maintenance">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Maintenance History &amp; Equipment Downtime
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Equipment lifecycle tracking, parts replacement expenditures, resolution velocity, and contractor logs.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export Engineering Audit
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Total Downtime (MTTR)</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">2.4 hrs</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Mean Time to Repair</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Total Maintenance Cost</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(1620)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">This billing cycle</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Tickets Closed</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">14</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">93% resolution rate</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Pending Parts</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">1 Order</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Carrier AC PCB board</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Historical Equipment Service Tickets</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Issue / Task</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{item.id}</TableCell>
                <TableCell className="font-mono text-xs">{item.date}</TableCell>
                <TableCell className="font-semibold text-gray-900 text-xs">{item.room}</TableCell>
                <TableCell className="text-xs text-gray-700">{item.category}</TableCell>
                <TableCell className="text-xs text-gray-600">{item.tech}</TableCell>
                <TableCell className="text-xs font-mono">{item.duration}</TableCell>
                <TableCell className="text-xs font-bold font-mono text-gray-900">
                  {formatCurrency(item.partsCost + item.laborCost)}
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'resolved' ? 'success' : 'warning'} className="text-[10px]">
                    {item.status === 'resolved' ? 'Resolved' : 'Active Work'}
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
