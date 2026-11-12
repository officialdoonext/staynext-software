import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Tag, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Seasonal & Holiday Pricing | StayNext' }

const seasons = [
  { id: 'sea-1', name: 'Winter Holiday Peak', dateRange: 'Dec 20, 2026 – Jan 05, 2027', adjustment: '+45%', minStay: '3 Nights', appliesTo: 'All Room Types', status: 'upcoming' },
  { id: 'sea-2', name: 'Valentine Romantic Weekend', dateRange: 'Feb 12, 2027 – Feb 15, 2027', adjustment: '+25%', minStay: '2 Nights', appliesTo: 'Suites & Villas Only', status: 'upcoming' },
  { id: 'sea-3', name: 'Spring Low Season Promo', dateRange: 'Mar 01, 2027 – Apr 15, 2027', adjustment: '-15%', minStay: '1 Night', appliesTo: 'Standard & Deluxe', status: 'active' },
  { id: 'sea-4', name: 'Summer High Season', dateRange: 'Jun 15, 2027 – Aug 31, 2027', adjustment: '+35%', minStay: '2 Nights', appliesTo: 'All Room Types', status: 'upcoming' },
]

export default function SeasonalRatesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rates">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Seasonal &amp; Dynamic Pricing Rules
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated high season multipliers, holiday markups, weekend surcharges, and minimum length-of-stay (MLOS).
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Seasonal Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seasons.map((rule) => (
          <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{rule.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>{rule.dateRange}</span>
                  </div>
                </div>
                <span className={`text-lg font-mono font-bold ${rule.adjustment.startsWith('+') ? 'text-indigo-600' : 'text-emerald-600'}`}>
                  {rule.adjustment}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-4 py-3 border-y border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Scope</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{rule.appliesTo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Min Stay (MLOS)</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{rule.minStay}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant={rule.status === 'active' ? 'success' : 'purple'} className="text-[10px]">
                {rule.status === 'active' ? 'Currently Active' : 'Scheduled'}
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2">
                Configure Rule
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
