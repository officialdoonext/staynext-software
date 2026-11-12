import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Employee Shift Schedules | StayNext' }

const employeeShifts = [
  { id: 'sh-1', employee: 'Amanda Sterling', department: 'Front Desk', role: 'Duty Manager', shift: 'Morning (07:00 – 15:30)', days: 'Mon – Fri', status: 'active' },
  { id: 'sh-2', employee: 'Lucas Bennett', department: 'Front Desk', role: 'Receptionist', shift: 'Evening (15:00 – 23:30)', days: 'Wed – Sun', status: 'active' },
  { id: 'sh-3', employee: 'David Miller', department: 'Maintenance', role: 'Chief Engineer', shift: 'Day On-Call (08:00 – 17:00)', days: 'Mon – Fri', status: 'active' },
  { id: 'sh-4', employee: 'Maria Santos', department: 'Housekeeping', role: 'Lead Cleaner', shift: 'Morning (07:30 – 16:00)', days: 'Tue – Sat', status: 'active' },
  { id: 'sh-5', employee: 'Chef Marco', department: 'Food & Beverage', role: 'Head Chef', shift: 'Dinner Service (14:00 – 22:30)', days: 'Wed – Sun', status: 'active' },
  { id: 'sh-6', employee: 'Night Auditor James', department: 'Front Desk / Audit', role: 'Night Auditor', shift: 'Overnight (23:00 – 07:30)', days: 'Mon – Sun (Rotational)', status: 'active' },
]

export default function EmployeeSchedulesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Staff Shift Rotas &amp; Timecards
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Weekly department schedules, night audit rotations, overtime monitoring, and leave coverage.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Publish New Rota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employeeShifts.map((shift) => (
          <div key={shift.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{shift.employee}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{shift.role}</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-gray-50">
                  {shift.department}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">{shift.shift}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>{shift.days}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On Schedule
              </span>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                Swap Shift
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
