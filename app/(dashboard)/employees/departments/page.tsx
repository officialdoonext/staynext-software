import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, Shield, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Hotel Departments & Structure | StayNext' }

const departments = [
  { id: 'dept-1', name: 'Front Desk & Guest Services', head: 'Amanda Sterling', staffCount: 8, openShifts: 0, description: 'Check-in, check-out, concierge reservations, telephone switchboard, and VIP guest relations.' },
  { id: 'dept-2', name: 'Housekeeping & Laundry', head: 'Supervisor Elena', staffCount: 14, openShifts: 2, description: 'Room turnover, laundry plant, public areas sanitation, lost & found, and turndown service.' },
  { id: 'dept-3', name: 'Engineering & Facilities', head: 'Dave Miller', staffCount: 5, openShifts: 0, description: 'HVAC repair, plumbing, preventive maintenance, electrical work, pool maintenance.' },
  { id: 'dept-4', name: 'Food & Beverage', head: 'Chef Marco Bellini', staffCount: 16, openShifts: 1, description: 'Main restaurant, room service hotline, banquet halls, and cocktail terrace bar.' },
  { id: 'dept-5', name: 'Accounting & Revenue Operations', head: 'Sarah Lin, CPA', staffCount: 4, openShifts: 0, description: 'Night audit, folio reconciliation, tax filings, accounts payable, and merchant settlements.' },
  { id: 'dept-6', name: 'Sales & Corporate Contracting', head: 'Robert Taylor', staffCount: 3, openShifts: 0, description: 'OTA channel agreements, corporate negotiated volume rates, and group blocks.' },
]

export default function DepartmentsPage() {
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
              Hotel Departments &amp; Organization
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Department leadership, headcounts, operational scopes, and access boundaries.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-gray-900">{d.name}</h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {d.staffCount} Staff
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{d.description}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs">
                <span className="text-gray-400">Department Head:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{d.head}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{d.openShifts > 0 ? `${d.openShifts} open shifts` : 'Fully staffed'}</span>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                View Roster &rarr;
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
