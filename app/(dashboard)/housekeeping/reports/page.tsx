import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
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

export const metadata = { title: 'Housekeeping Reports & Audit | StayNext' }

const cleaningLogs = [
  { id: 'log-1', date: '2026-11-11', room: '101', attendant: 'Maria Santos', type: 'Checkout Deep Clean', duration: '38 mins', inspectionScore: '98%', status: 'passed' },
  { id: 'log-2', date: '2026-11-11', room: '102', attendant: 'Maria Santos', type: 'Stayover Refresh', duration: '22 mins', inspectionScore: '95%', status: 'passed' },
  { id: 'log-3', date: '2026-11-11', room: '201', attendant: 'Carlos Ruiz', type: 'VIP Turndown', duration: '45 mins', inspectionScore: '100%', status: 'passed' },
  { id: 'log-4', date: '2026-11-10', room: '204', attendant: 'Carlos Ruiz', type: 'Checkout Deep Clean', duration: '52 mins', inspectionScore: '82%', status: 're_cleaned' },
  { id: 'log-5', date: '2026-11-10', room: '305', attendant: 'Maria Santos', type: 'Pre-arrival Prep', duration: '35 mins', inspectionScore: '96%', status: 'passed' },
]

export default function HousekeepingReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/housekeeping">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Housekeeping Performance &amp; Audit Logs
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Turnover velocity, average cleaning duration, supervisor QA inspection scores, and hygiene compliance.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV Log
        </Button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Average Turn Time</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">32 mins</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">↓ 4 mins faster vs benchmark</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">QA Pass Rate</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">96.4%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Above 95% target</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Cleaned Today</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">18 Rooms</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Across 3 attendants</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Re-cleans Required</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">1</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Bathroom mirror smudge</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Historical Turnaround Logs</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Attendant</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>QA Score</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cleaningLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">{log.date}</TableCell>
                <TableCell className="font-bold font-mono text-gray-900">Room {log.room}</TableCell>
                <TableCell className="text-xs font-medium text-gray-800">{log.attendant}</TableCell>
                <TableCell className="text-xs text-gray-600">{log.type}</TableCell>
                <TableCell className="text-xs font-mono">{log.duration}</TableCell>
                <TableCell className="text-xs font-bold text-emerald-600">{log.inspectionScore}</TableCell>
                <TableCell>
                  <Badge variant={log.status === 'passed' ? 'success' : 'warning'} className="text-[10px]">
                    {log.status === 'passed' ? 'Passed Inspection' : 'Action Required'}
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
