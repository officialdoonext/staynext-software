import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Clock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Housekeeping Schedules & Shifts | StayNext' }

const schedules = [
  { id: 'sch-1', staff: 'Maria Santos', role: 'Lead Housekeeper', shift: 'Morning Shift (07:00 - 15:30)', zone: 'Floor 1 (Rooms 101-108)', assignedRooms: 8, completed: 5, status: 'on_shift' },
  { id: 'sch-2', staff: 'Carlos Ruiz', role: 'Room Attendant', shift: 'Morning Shift (07:00 - 15:30)', zone: 'Floor 2 (Rooms 201-206)', assignedRooms: 6, completed: 4, status: 'on_shift' },
  { id: 'sch-3', staff: 'Supervisor Elena', role: 'Floor Supervisor', shift: 'Day Shift (08:00 - 16:30)', zone: 'Quality Inspection (All Floors)', assignedRooms: 14, completed: 9, status: 'on_shift' },
  { id: 'sch-4', staff: 'Aisha Bello', role: 'Room Attendant', shift: 'Evening Turndown (15:00 - 23:30)', zone: 'Floor 3 Penthouse Suites', assignedRooms: 6, completed: 0, status: 'scheduled' },
  { id: 'sch-5', staff: 'Vikram Patel', role: 'Deep Clean Specialist', shift: 'Night Deep Clean (22:00 - 06:30)', zone: 'Public Areas & Lobby', assignedRooms: 0, completed: 0, status: 'scheduled' },
]

export default function HousekeepingSchedulePage() {
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
              Housekeeping Staff Rosters &amp; Shifts
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Daily attendant assignments, cleaning zones, turnover workloads, and shift rotas.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Assign Shift
        </Button>
      </div>

      {/* Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{item.staff}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{item.role}</p>
                </div>
                <Badge variant={item.status === 'on_shift' ? 'success' : 'outline'} className="text-[10px]">
                  {item.status === 'on_shift' ? 'Active on Floor' : 'Upcoming'}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{item.shift}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">{item.zone}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Completed: <strong className="text-gray-900">{item.completed}/{item.assignedRooms}</strong> rooms
              </span>
              <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${item.assignedRooms ? (item.completed / item.assignedRooms) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
