import React from 'react'
import { Sparkles, Clock, CheckCircle2, Search, UserCheck, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Housekeeping Operations | StayNext' }

const tasks = [
  { id: 'hk-1', room: '103', type: 'Checkout Deep Clean', priority: 'high', assignedTo: 'Maria Santos', status: 'pending', eta: '45 mins' },
  { id: 'hk-2', room: '104', type: 'Stayover Daily Service', priority: 'medium', assignedTo: 'Carlos Ruiz', status: 'in_progress', eta: '25 mins' },
  { id: 'hk-3', room: '203', type: 'Routine Inspection', priority: 'high', assignedTo: 'Supervisor Elena', status: 'awaiting_inspection', eta: '10 mins' },
  { id: 'hk-4', room: '302', type: 'Linen & Towel Refresh', priority: 'low', assignedTo: 'Aisha Bello', status: 'completed', eta: 'Done' },
  { id: 'hk-5', room: '204', type: 'Pre-arrival VIP Turndown', priority: 'high', assignedTo: 'Maria Santos', status: 'pending', eta: '30 mins' },
]

export default function HousekeepingPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Housekeeping Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time room turnover, cleaner assignments, supervisor quality inspections, and lost &amp; found.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Assign Cleaning Task
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold">Pending Cleaning</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
          <p className="text-[11px] text-gray-500 mt-0.5">3 checkout cleanings urgent</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-cyan-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
          <p className="text-[11px] text-gray-500 mt-0.5">2 staff actively on floors</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <Search className="h-4 w-4" />
            <span className="text-xs font-semibold">Awaiting Inspection</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Ready for supervisor signoff</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Cleaned Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">18</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">&uarr; Average turnover 28m</p>
        </div>
      </div>

      {/* Task Board Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Active Cleaning Work Orders</h3>
          <span className="text-xs text-gray-400">Auto-dispatches on guest checkout</span>
        </div>

        <div className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded">
                  Room #{task.room}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900">{task.type}</p>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[9px]">
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Assigned: <strong>{task.assignedTo}</strong> &bull; Est. Duration: {task.eta}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    task.status === 'completed'
                      ? 'success'
                      : task.status === 'in_progress'
                      ? 'purple'
                      : task.status === 'awaiting_inspection'
                      ? 'info'
                      : 'warning'
                  }
                  className="capitalize"
                >
                  {task.status.replace('_', ' ')}
                </Badge>
                {task.status === 'awaiting_inspection' && (
                  <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                    Approve Room
                  </Button>
                )}
                {task.status === 'pending' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Start Cleaning
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

