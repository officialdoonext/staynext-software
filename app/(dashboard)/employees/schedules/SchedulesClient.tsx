'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  CalendarCheck,
  Clock,
  User,
  Search,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import {
  ShiftScheduleRecord,
  EmployeeRecord,
  assignEmployeeShift,
} from '@/services/employee.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SchedulesClientProps {
  initialSchedules: ShiftScheduleRecord[]
  employees: EmployeeRecord[]
  propertyId: string
}

export function SchedulesClient({
  initialSchedules,
  employees,
  propertyId,
}: SchedulesClientProps) {
  const router = useRouter()
  const [schedules, setSchedules] = useState<ShiftScheduleRecord[]>(initialSchedules)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    employeeId: employees.length > 0 ? employees[0].id : '',
    shiftDate: new Date().toISOString().split('T')[0],
    shiftType: 'morning',
    startTime: '07:00',
    endTime: '15:30',
    notes: '',
  })

  const filtered = schedules.filter((s) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      s.employeeName.toLowerCase().includes(q) ||
      s.shiftType.toLowerCase().includes(q) ||
      s.shiftDate.includes(q)
    )
  })

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employeeId) {
      toast.error('Please select an employee')
      return
    }

    setIsSubmitting(true)
    const res = await assignEmployeeShift({
      propertyId,
      employeeId: form.employeeId,
      shiftDate: form.shiftDate,
      shiftType: form.shiftType,
      startTime: form.startTime,
      endTime: form.endTime,
      notes: form.notes.trim() || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Shift assigned successfully')
      setIsAssignOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to assign shift')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No shifts to export')
      return
    }
    const headers = ['Shift Date', 'Employee Name', 'Shift Type', 'Timing', 'Notes']
    const rows = filtered.map((s) => [
      s.shiftDate,
      `"${s.employeeName}"`,
      s.shiftType,
      `"${s.startTime} - ${s.endTime}"`,
      `"${s.notes || '-'}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `shifts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Staff Shift Schedules &amp; Roster
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Weekly duty roster, morning/evening/night shift assignments, and operational coverage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAssignOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Assign Shift
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Roster
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff name, shift..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Scheduled Shifts Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Assign shift duties to front office receptionists, housekeeping room attendants, and chefs.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Schedule First Shift
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Shift Date</TableHead>
                <TableHead className="text-xs font-medium">Staff Member</TableHead>
                <TableHead className="text-xs font-medium">Shift Type</TableHead>
                <TableHead className="text-xs font-medium">Duty Timings</TableHead>
                <TableHead className="text-xs font-medium">Notes</TableHead>
                <TableHead className="text-xs font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-xs font-medium text-gray-900 whitespace-nowrap">
                    {formatDate(s.shiftDate)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>{s.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.shiftType === 'morning'
                          ? 'success'
                          : s.shiftType === 'afternoon'
                          ? 'outline'
                          : s.shiftType === 'night'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {s.shiftType} Shift
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 font-mono">
                    {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {s.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-emerald-600 font-medium">Rostered</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ASSIGN SHIFT MODAL */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Assign Shift Duty</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Schedule staff member to duty roster with specific operational hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Staff Member *</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shift Date *</label>
                <input
                  type="date"
                  value={form.shiftDate}
                  onChange={(e) => setForm({ ...form, shiftDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shift Type</label>
                <select
                  value={form.shiftType}
                  onChange={(e) => {
                    const st = e.target.value
                    let start = '07:00'
                    let end = '15:30'
                    if (st === 'afternoon') {
                      start = '15:00'
                      end = '23:30'
                    } else if (st === 'night') {
                      start = '23:00'
                      end = '07:30'
                    } else if (st === 'general') {
                      start = '09:00'
                      end = '18:00'
                    }
                    setForm({ ...form, shiftType: st, startTime: start, endTime: end })
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer capitalize"
                >
                  <option value="morning">Morning (07:00 - 15:30)</option>
                  <option value="afternoon">Afternoon / Evening (15:00 - 23:30)</option>
                  <option value="night">Night Audit (23:00 - 07:30)</option>
                  <option value="general">General (09:00 - 18:00)</option>
                  <option value="off">Day Off (Rest)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Station Assignment</label>
              <input
                type="text"
                placeholder="e.g. Front Desk Terminal 1, Floors 3 &amp; 4 turnover"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || employees.length === 0}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isSubmitting ? 'Assigning...' : 'Assign Shift'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
