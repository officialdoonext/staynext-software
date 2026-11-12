import React from 'react'
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Maintenance & Engineering | StayNext' }

const workOrders = [
  { id: 'wo-1', title: 'HVAC Compressor Servicing', room: '204', category: 'HVAC', priority: 'urgent', status: 'in_progress', technician: 'Tom Bradley', cost: 340.00, reportedAt: '2026-11-10' },
  { id: 'wo-2', title: 'Bathroom Tile Regrouting & Sealant', room: '302', category: 'Plumbing / Tile', priority: 'high', status: 'open', technician: 'Leo Martinez', cost: 180.00, reportedAt: '2026-11-11' },
  { id: 'wo-3', title: 'Keycard Reader Battery Replacement', room: '105', category: 'Electronic Access', priority: 'medium', status: 'resolved', technician: 'Tom Bradley', cost: 25.00, reportedAt: '2026-11-09' },
  { id: 'wo-4', title: 'Balcony Sliding Door Track Alignment', room: '301', category: 'Carpentry', priority: 'low', status: 'open', technician: 'Unassigned', cost: 60.00, reportedAt: '2026-11-11' },
]

export default function MaintenancePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Maintenance &amp; Engineering
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track equipment repairs, room out-of-order blocks, technician dispatches, and facilities work orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            New Work Order
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-semibold">Open Work Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">4</p>
          <p className="text-[11px] text-gray-500 mt-0.5">2 rooms blocked from sale</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-semibold">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">1</p>
          <p className="text-[11px] text-gray-500 mt-0.5">HVAC technician on site</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs font-semibold">Resolved This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">24</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Average repair turnaround: 3.4 hrs</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wrench className="h-5 w-5" />
            <span className="text-xs font-semibold">Maintenance Spend</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(1890)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Parts &amp; contractor labor</p>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Work Order Queue</h3>
          <span className="text-xs text-gray-400">Engineering Tickets</span>
        </div>

        <div className="divide-y divide-gray-100">
          {workOrders.map((wo) => (
            <div key={wo.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  Room #{wo.room}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900">{wo.title}</p>
                    <Badge variant={wo.priority === 'urgent' ? 'destructive' : wo.priority === 'high' ? 'warning' : 'secondary'} className="text-[9px]">
                      {wo.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Category: {wo.category} &bull; Tech: <strong>{wo.technician}</strong> &bull; Est. Cost: {formatCurrency(wo.cost)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={wo.status === 'resolved' ? 'success' : wo.status === 'in_progress' ? 'purple' : 'warning'}>
                  {wo.status.replace('_', ' ')}
                </Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Update Ticket
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

