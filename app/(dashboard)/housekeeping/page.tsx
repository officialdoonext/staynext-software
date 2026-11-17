import React from 'react'
import { Sparkles, Clock, CheckCircle2, Search, UserCheck, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Housekeeping Operations | StayNext' }

export default async function HousekeepingPage() {
  const supabase = await createClient()

  let tasks: any[] = []
  let pendingCount = 0
  let inProgressCount = 0
  let completedCount = 0

  try {
    const { data } = await supabase
      .from('housekeeping_tasks')
      .select(`
        id,
        task_type,
        status,
        priority,
        rooms (
          room_number
        ),
        employees (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      tasks = data.map((t: any) => ({
        id: t.id,
        room: t.rooms?.room_number || '-',
        type: t.task_type || 'Room Clean',
        priority: t.priority || 'medium',
        assignedTo: `${t.employees?.first_name || ''} ${t.employees?.last_name || ''}`.trim() || 'Unassigned',
        status: t.status,
      }))

      pendingCount = tasks.filter((t) => t.status === 'pending').length
      inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
      completedCount = tasks.filter((t) => t.status === 'completed').length
    }
  } catch {}

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
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold">Pending Cleaning</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{pendingCount}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-cyan-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{inProgressCount}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Completed Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{completedCount}</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Housekeeping Tasks</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Housekeeping tasks are automatically created when guests check out or when turnover is requested.
          </p>
        </div>
      ) : (
        /* Tasks List */
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 shadow-sm">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900">
                    Room #{task.room}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{task.type}</span>
                  <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                    {task.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Assigned to: {task.assignedTo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
