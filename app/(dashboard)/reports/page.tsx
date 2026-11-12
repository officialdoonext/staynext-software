import React from 'react'
import { BarChart3, Download, TrendingUp, Calendar, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Reports & Business Intelligence | StayNext' }

const reportsList = [
  { id: 'rep-1', title: 'Monthly Gross Operating Revenue (RevPAR & ADR)', category: 'Financial', cadence: 'Monthly', lastRun: 'Nov 11, 2026', format: 'PDF / XLSX' },
  { id: 'rep-2', title: 'Room Occupancy & Sellable Inventory Yield', category: 'Operations', cadence: 'Daily / Weekly', lastRun: 'Nov 11, 2026', format: 'PDF / CSV' },
  { id: 'rep-3', title: 'Channel Manager Performance & OTA Commission Costs', category: 'Sales', cadence: 'Monthly', lastRun: 'Nov 01, 2026', format: 'PDF' },
  { id: 'rep-4', title: 'State Lodging & City Hotel Occupancy Tax Filing', category: 'Compliance', cadence: 'Monthly', lastRun: 'Oct 31, 2026', format: 'XLSX / PDF' },
  { id: 'rep-5', title: 'Housekeeping Turnaround Time & Staff Efficiency', category: 'Operations', cadence: 'Weekly', lastRun: 'Nov 08, 2026', format: 'CSV' },
  { id: 'rep-6', title: 'Corporate Client Production & Nightly Volume', category: 'Corporate', cadence: 'Quarterly', lastRun: 'Oct 01, 2026', format: 'PDF' },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Reports &amp; Business Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Export RevPAR, ADR, Occupancy yield, tax liabilities, and departmental performance ledgers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Download className="h-4 w-4 mr-1.5" />
            Generate Custom Audit
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">ADR (Average Daily Rate)</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(248.50)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">&uarr; 12% vs previous period</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">RevPAR (Revenue per Available Room)</span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(186.37)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">&uarr; 9.4% yield performance</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Average Stay Duration</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">3.2 Nights</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Leisure + Corporate mix</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Direct Booking Share</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">54.2%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Zero OTA commission saved</p>
        </div>
      </div>

      {/* Reports Catalog */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Standard Management Reports</h3>
          <span className="text-xs text-gray-400">Scheduled &amp; On-demand</span>
        </div>

        <div className="divide-y divide-gray-100">
          {reportsList.map((rep) => (
            <div key={rep.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{rep.title}</p>
                  <p className="text-[11px] text-gray-400">
                    Category: <strong>{rep.category}</strong> &bull; Cadence: {rep.cadence} &bull; Last run: {rep.lastRun}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {rep.format}
                </Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  Run &amp; Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

