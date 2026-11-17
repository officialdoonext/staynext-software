import React from 'react'
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Maintenance & Engineering | StayNext' }

export default async function MaintenancePage() {
  const supabase = await createClient()

  let workOrders: any[] = []
  let openCount = 0

  try {
    const { data } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        title,
        priority,
        status,
        category,
        created_at,
        rooms (
          room_number
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      workOrders = data.map((wo: any) => ({
        id: wo.id,
        title: wo.title,
        room: wo.rooms?.room_number || 'General Facility',
        category: wo.category || 'General',
        priority: wo.priority || 'medium',
        status: wo.status || 'open',
        reportedAt: wo.created_at?.split('T')[0] || '',
      }))

      openCount = workOrders.filter((wo) => wo.status === 'open' || wo.status === 'in_progress').length
    }
  } catch {}

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
          <Link href="/maintenance/new">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              New Work Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-semibold">Active Work Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{openCount}</p>
        </div>
      </div>

      {workOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Open Work Orders</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            All equipment and rooms are in good working order. Report tickets as maintenance needs arise.
          </p>
          <div className="mt-6">
            <Link href="/maintenance/new">
              <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Report First Ticket
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Work Orders List */
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 shadow-sm">
          {workOrders.map((wo) => (
            <div key={wo.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900">
                    Room #{wo.room}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{wo.title}</span>
                  <Badge variant={wo.priority === 'urgent' ? 'destructive' : 'warning'}>
                    {wo.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Category: {wo.category} &bull; Reported: {formatDate(wo.reportedAt)}</p>
              </div>
              <Badge variant={wo.status === 'resolved' ? 'success' : 'secondary'}>
                {wo.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
