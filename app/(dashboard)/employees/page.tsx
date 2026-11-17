import React from 'react'
import { UserCog, Plus, ShieldCheck, Mail, Phone, CalendarCheck, Users } from 'lucide-react'
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
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Employee Directory | StayNext' }

export default async function EmployeesPage() {
  const supabase = await createClient()

  let employees: any[] = []
  try {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      employees = data.map((emp: any) => ({
        id: emp.id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Staff Member',
        email: emp.email || 'N/A',
        role: emp.job_title || 'Staff',
        department: emp.department || 'Hotel Operations',
        phone: emp.phone || 'N/A',
        status: emp.is_active ? 'active' : 'inactive',
      }))
    }
  } catch {}

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
          <Link href="/employees/new">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Staff Member
            </Button>
          </Link>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Employees Registered</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Manage your staff team, assign front desk staff, housekeeping cleaners, and shift schedules.
          </p>
          <div className="mt-6">
            <Link href="/employees/new">
              <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Add First Staff Member
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Roster Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Role &amp; Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#f7f2fd] text-[#5e2b9d] flex items-center justify-center font-bold text-xs">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-[11px] text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-gray-900">{emp.role}</p>
                    <p className="text-[11px] text-gray-500">{emp.department}</p>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{emp.phone}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={emp.status === 'active' ? 'success' : 'secondary'}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
