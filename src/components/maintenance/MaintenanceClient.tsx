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
  DollarSign,
  QrCode,
  User,
  Phone,
  Eye,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { MaintenanceItem, updateMaintenanceStatus } from '@/services/maintenance.service'
import { PropertyItem } from '@/services/property.service'
import { formatCurrency, formatDateTime } from '@/lib/utils'

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
  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [tickets, setTickets] = useState<MaintenanceItem[]>(initialTickets)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Full Details Inspection Modal
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<MaintenanceItem | null>(null)

  // Resolve Ticket Modal
  const [resolveModalTicket, setResolveModalTicket] = useState<MaintenanceItem | null>(null)
  const [actualCost, setActualCost] = useState<number | string>('')

  const handleResolveTicket = async () => {
    if (!resolveModalTicket) return
    setActionLoading(`resolve-${resolveModalTicket.id}`)
    try {
      const costNum = actualCost === '' ? 0 : Number(actualCost)
      const res = await updateMaintenanceStatus(
        resolveModalTicket.id,
        resolveModalTicket.room_id,
        'resolved',
        costNum
      )
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === resolveModalTicket.id
              ? { ...t, status: 'resolved', actual_cost: costNum }
              : t
          )
        )
        if (selectedTicketDetail && selectedTicketDetail.id === resolveModalTicket.id) {
          setSelectedTicketDetail((prev) =>
            prev ? { ...prev, status: 'resolved', actual_cost: costNum } : null
          )
        }
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
      setActualCost('')
      return
    }

    setActionLoading(`stat-${ticket.id}`)
    try {
      const res = await updateMaintenanceStatus(ticket.id, ticket.room_id, status)
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, status } : t))
        )
        if (selectedTicketDetail && selectedTicketDetail.id === ticket.id) {
          setSelectedTicketDetail((prev) => (prev ? { ...prev, status } : null))
        }
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = tickets.filter((t) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === '' ||
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      (t.room_number && t.room_number.toLowerCase().includes(term)) ||
      (t.guest_name && t.guest_name.toLowerCase().includes(term)) ||
      (t.guest_phone && t.guest_phone.toLowerCase().includes(term))

    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesSource = sourceFilter === 'all' || (t.source || 'staff') === sourceFilter
    const matchesProperty = selectedPropertyId === 'all' || !t.property_id || t.property_id === selectedPropertyId

    return matchesSearch && matchesPriority && matchesStatus && matchesSource && matchesProperty
  })

  const getPriorityBadge = (p: MaintenanceItem['priority']) => {
    switch (p) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px] rounded-xs font-semibold">Urgent</Badge>
      case 'high':
        return <Badge variant="warning" className="text-[10px] rounded-xs font-semibold">High</Badge>
      case 'medium':
        return <Badge variant="secondary" className="text-[10px] rounded-xs font-normal">Medium</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] rounded-xs font-normal">Low</Badge>
    }
  }

  const openTicketsCount = tickets.filter((t) => t.status === 'open').length
  const inProgressTicketsCount = tickets.filter((t) => t.status === 'in_progress').length
  const resolvedTicketsCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length
  const qrRequestsCount = tickets.filter((t) => t.source === 'room_qr').length

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#5e2b9d]" />
            Engineering &amp; Facility Maintenance
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch work orders for HVAC, plumbing, electrical, and live guest room QR maintenance requests.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {properties.length > 1 && (
            <div className="w-56">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={setSelectedPropertyId}
                placeholder="All Properties..."
              >
                <option value="all">All Properties ({properties.length})</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SearchableSelect>
            </div>
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
                {openTicketsCount}
              </div>
              <div className="text-[10px] text-red-700 mt-0.5">
                {qrRequestsCount} reported via Room QR
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
                {inProgressTicketsCount}
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">With technician</div>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-800 text-[10px]">
              Active Work
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
                {resolvedTicketsCount}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Rooms restored</div>
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
              <div className="text-[10px] text-gray-500 mt-0.5">Parts &amp; maintenance costs</div>
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
            placeholder="Search work order title, room, guest name, or problem description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <SearchableSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="All Priorities"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </SearchableSelect>
        </div>

        <div className="flex gap-2">
          <div className="w-1/2">
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open ({openTicketsCount})</option>
              <option value="in_progress">In Progress ({inProgressTicketsCount})</option>
              <option value="resolved">Resolved ({resolvedTicketsCount})</option>
            </SearchableSelect>
          </div>

          <div className="w-1/2">
            <SearchableSelect
              value={sourceFilter}
              onChange={setSourceFilter}
              placeholder="All Sources"
            >
              <option value="all">All Sources</option>
              <option value="room_qr">Room QR</option>
              <option value="staff">Staff</option>
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Location &amp; Source</th>
              <th className="px-4 py-3">Work Order &amp; Problem Details</th>
              <th className="px-4 py-3">Reported Time</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <Wrench className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No maintenance tickets found</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all'
                      ? 'No work orders match the current filter criteria.'
                      : 'All hotel facilities and equipment are operating smoothly.'}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Location & Source */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {item.room_number ? (
                        <span className="text-[#5e2b9d] font-bold">Room {item.room_number}</span>
                      ) : (
                        <span className="text-gray-700">General Facility</span>
                      )}
                    </div>

                    <div className="mt-1">
                      {item.source === 'room_qr' ? (
                        <Badge className="bg-purple-100 text-[#5e2b9d] border-[#dfcef6] text-[9px] rounded-xs font-medium flex items-center gap-1 w-fit">
                          <QrCode className="h-2.5 w-2.5" />
                          Room QR
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-gray-400">Staff Work Order</span>
                      )}
                    </div>
                  </td>

                  {/* Work Order Details */}
                  <td className="px-4 py-3 max-w-md">
                    <div className="font-medium text-gray-900 text-xs flex items-center gap-1.5">
                      <span>{item.title}</span>
                    </div>

                    {/* Problem Description - clearly readable */}
                    {item.description && (
                      <div className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded p-1.5 mt-1 whitespace-pre-line leading-relaxed">
                        {item.description}
                      </div>
                    )}

                    {/* Guest Contact if provided */}
                    {(item.guest_name || item.guest_phone) && (
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                        {item.guest_name && (
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <User className="h-3 w-3 text-gray-400" />
                            {item.guest_name}
                          </span>
                        )}
                        {item.guest_phone && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {item.guest_phone}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Reported Time */}
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {formatDateTime(item.created_at)}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-600 capitalize text-xs">
                    {item.category}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3">
                    {getPriorityBadge(item.priority)}
                  </td>

                  {/* Technician */}
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {item.assigned_employee_name}
                  </td>

                  {/* Status */}
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

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicketDetail(item)}
                        className="h-7 px-2 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-sm cursor-pointer"
                      >
                        <Eye className="h-3 w-3 mr-1 text-gray-500" />
                        Details
                      </Button>

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

      {/* MODAL 1: VIEW FULL TICKET DETAILS */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[#5e2b9d]" />
                <span className="text-sm font-semibold text-gray-900">
                  Maintenance Request Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketDetail(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Location</span>
                  <span className="text-xs font-bold text-gray-900">
                    {selectedTicketDetail.room_number ? `Room ${selectedTicketDetail.room_number}` : 'Public Facility'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Source</span>
                  {selectedTicketDetail.source === 'room_qr' ? (
                    <Badge className="bg-purple-100 text-[#5e2b9d] border-[#dfcef6] text-[10px] font-medium">
                      Room QR Scan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 text-[10px]">
                      Staff Logged
                    </Badge>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Priority</span>
                  {getPriorityBadge(selectedTicketDetail.priority)}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Status</span>
                  <Badge
                    variant={
                      selectedTicketDetail.status === 'open'
                        ? 'destructive'
                        : selectedTicketDetail.status === 'in_progress'
                        ? 'secondary'
                        : 'success'
                    }
                    className="text-[10px] rounded-xs capitalize"
                  >
                    {selectedTicketDetail.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Reported Time</span>
                  <span className="text-gray-700 font-medium">{formatDateTime(selectedTicketDetail.created_at)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Category</span>
                  <span className="text-gray-700 font-medium capitalize">{selectedTicketDetail.category}</span>
                </div>
              </div>

              {/* Guest Details */}
              {(selectedTicketDetail.guest_name || selectedTicketDetail.guest_phone) && (
                <div className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-md text-xs">
                  <span className="text-[10px] font-semibold text-[#5e2b9d] uppercase block mb-1">
                    Guest Contact Details:
                  </span>
                  <div className="flex items-center gap-3 text-gray-800">
                    {selectedTicketDetail.guest_name && (
                      <span className="font-medium">Name: {selectedTicketDetail.guest_name}</span>
                    )}
                    {selectedTicketDetail.guest_phone && (
                      <span>Phone: {selectedTicketDetail.guest_phone}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Work Order Title */}
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">
                  Issue Title:
                </span>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200 font-semibold text-gray-900">
                  {selectedTicketDetail.title}
                </div>
              </div>

              {/* Full Problem Description */}
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">
                  Complete Problem Description &amp; Technical Notes:
                </span>
                <div className="p-3 bg-amber-50/30 border border-amber-200 rounded-md text-xs text-gray-800 whitespace-pre-line leading-relaxed min-h-[70px]">
                  {selectedTicketDetail.description || 'No additional technical notes provided.'}
                </div>
              </div>

              {/* Financials / Costs */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 text-xs">
                <span>
                  Estimated Cost: <strong>{formatCurrency(selectedTicketDetail.estimated_cost || 0)}</strong>
                </span>
                <span>
                  Actual Cost: <strong className="text-emerald-700">{formatCurrency(selectedTicketDetail.actual_cost || 0)}</strong>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicketDetail(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedTicketDetail.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedTicketDetail, 'in_progress')}
                    disabled={actionLoading === `stat-${selectedTicketDetail.id}`}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer font-medium"
                  >
                    Start Work
                  </Button>
                )}

                {selectedTicketDetail.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedTicketDetail, 'resolved')}
                    disabled={actionLoading === `stat-${selectedTicketDetail.id}`}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer font-medium"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Resolve Ticket
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLVE WORK ORDER MODAL */}
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
                  placeholder={resolveModalTicket?.estimated_cost ? String(resolveModalTicket.estimated_cost) : '0.00'}
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value === '' ? '' : Number(e.target.value))}
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
