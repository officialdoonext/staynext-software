'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
  BedDouble,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MaintenanceItem, updateMaintenanceStatus } from '@/services/maintenance.service'
import { PropertyItem } from '@/services/property.service'
import { formatDate, formatCurrency } from '@/lib/utils'

interface MaintenanceClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialTickets: MaintenanceItem[]
}

export default function MaintenanceClient({
  property: initialProp,
  properties,
  initialTickets,
}: MaintenanceClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [tickets, setTickets] = useState<MaintenanceItem[]>(initialTickets)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Resolve Ticket Modal
  const [resolveModalTicket, setResolveModalTicket] = useState<MaintenanceItem | null>(null)
  const [actualCost, setActualCost] = useState<number>(0)

  const handleResolveTicket = async () => {
    if (!resolveModalTicket) return
    setActionLoading(`resolve-${resolveModalTicket.id}`)
    try {
      const res = await updateMaintenanceStatus(
        resolveModalTicket.id,
        resolveModalTicket.room_id,
        'resolved',
        actualCost
      )
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === resolveModalTicket.id
              ? { ...t, status: 'resolved', actual_cost: actualCost }
              : t
          )
        )
        setResolveModalTicket(null)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateStatus = async (
    ticket: MaintenanceItem,
    status: MaintenanceItem['status']
  ) => {
    if (status === 'resolved') {
      setResolveModalTicket(ticket)
      setActualCost(ticket.estimated_cost || 0)
      return
    }

    setActionLoading(`stat-${ticket.id}`)
    try {
      const res = await updateMaintenanceStatus(ticket.id, ticket.room_id, status)
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, status } : t))
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      searchTerm === '' ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.room_number && t.room_number.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter

    return matchesSearch && matchesPriority && matchesStatus
  })

  const getPriorityBadge = (p: MaintenanceItem['priority']) => {
    switch (p) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px] rounded-xs">Urgent</Badge>
      case 'high':
        return <Badge variant="warning" className="text-[10px] rounded-xs">High</Badge>
      case 'medium':
        return <Badge variant="secondary" className="text-[10px] rounded-xs">Medium</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] rounded-xs">Low</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Engineering &amp; Facility Maintenance
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch work orders for HVAC, plumbing, electrical, and room repair requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <Link href="/maintenance/types">
            <Button
              size="sm"
              variant="outline"
              className="border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd] text-xs h-9 font-medium rounded-md cursor-pointer"
            >
              <Wrench className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Maintenance Types
            </Button>
          </Link>

          <Link href="/maintenance/new">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              Log Work Order
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/20 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Open Tickets
              </span>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {tickets.filter((t) => t.status === 'open').length}
              </div>
            </div>
            <Badge variant="outline" className="border-red-300 text-red-800 text-[10px]">
              Pending Action
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/20 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
                In Progress
              </span>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {tickets.filter((t) => t.status === 'in_progress').length}
              </div>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-800 text-[10px]">
              With Technician
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Resolved &amp; Closed
              </span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[10px]">
              Completed
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/20 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#5e2b9d] flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-[#5e2b9d]" />
                Repair Expenses
              </span>
              <div className="text-2xl font-bold text-[#5e2b9d] mt-1">
                {formatCurrency(
                  tickets.reduce((acc, t) => acc + (t.actual_cost || t.estimated_cost || 0), 0)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search work order title, room, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Work Order Details</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assigned Technician</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Wrench className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No maintenance tickets found</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">All hotel facilities and equipment operating smoothly.</div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {item.room_number ? (
                      <span className="text-[#5e2b9d]">Room {item.room_number}</span>
                    ) : (
                      <span className="text-gray-700">General Facility</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">{item.description}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{item.category}</td>
                  <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.assigned_employee_name}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        item.status === 'open'
                          ? 'destructive'
                          : item.status === 'in_progress'
                          ? 'secondary'
                          : 'success'
                      }
                      className="text-[10px] rounded-xs capitalize"
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'open' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(item, 'in_progress')}
                          disabled={actionLoading === `stat-${item.id}`}
                          className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-sm cursor-pointer font-medium"
                        >
                          Start Work
                        </Button>
                      )}

                      {item.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(item, 'resolved')}
                          disabled={actionLoading === `stat-${item.id}`}
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer font-medium"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}

                      {item.status === 'resolved' && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Work Order Modal */}
      {resolveModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Resolve Work Order: {resolveModalTicket.title}
              </span>
              <button
                type="button"
                onClick={() => setResolveModalTicket(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 text-[11px]">
                Marking this ticket resolved will return Room #{resolveModalTicket.room_number || ''} to housekeeping inspection before returning to sellable inventory.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Actual Cost / Parts Replaced (₹)
                </label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolveModalTicket(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleResolveTicket}
                disabled={actionLoading === `resolve-${resolveModalTicket.id}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                Confirm Resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

