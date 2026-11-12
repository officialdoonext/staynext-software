import React from 'react'
import { UserCog, Plus, ShieldCheck, Mail, Phone, CalendarCheck } from 'lucide-react'
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

export const metadata = { title: 'Employee Directory | StayNext' }

const employees = [
  { id: 'emp-1', name: 'Alex Rivers', email: 'alex.rivers@staynext.com', role: 'General Manager', department: 'Executive Management', phone: '+1 (555) 019-2041', shift: 'Morning / Day', status: 'active' },
  { id: 'emp-2', name: 'Hannah Wright', email: 'h.wright@staynext.com', role: 'Front Desk Lead', department: 'Front Office', phone: '+1 (555) 019-2042', shift: 'Day Shift (07:00 - 15:30)', status: 'active' },
  { id: 'emp-3', name: 'Maria Santos', email: 'm.santos@staynext.com', role: 'Housekeeping Supervisor', department: 'Housekeeping', phone: '+1 (555) 019-2043', shift: 'Morning (08:00 - 16:30)', status: 'active' },
  { id: 'emp-4', name: 'Tom Bradley', email: 't.bradley@staynext.com', role: 'Lead Maintenance Technician', department: 'Engineering', phone: '+1 (555) 019-2044', shift: 'On Call (08:00 - 17:00)', status: 'active' },
  { id: 'emp-5', name: 'Antoine Laurent', email: 'a.laurent@staynext.com', role: 'Executive Chef', department: 'Food & Beverage', phone: '+1 (555) 019-2045', shift: 'Evening (14:00 - 23:00)', status: 'active' },
]

export default function EmployeesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Employee &amp; Staff Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Departmental rosters, role permissions, shift schedules, and staff attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned Shift</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-[11px] text-gray-400">{emp.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium text-gray-800">
                  {emp.role}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {emp.department}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {emp.phone}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {emp.shift}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="success" className="capitalize text-[10px]">
                    {emp.status}
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

