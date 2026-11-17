'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Search,
  UserCheck,
  AlertCircle,
  Plus,
  ArrowLeft,
  BedDouble,
  Layers,
  Wrench,
  Check,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  HousekeepingTaskItem,
  updateHousekeepingTaskStatus,
  createHousekeepingTask
} from '@/services/housekeeping.service'
import { RoomItem, updateRoomStatus } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'

interface HousekeepingClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  rooms: RoomItem[]
  initialTasks: HousekeepingTaskItem[]
}

export default function HousekeepingClient({
  property: initialProp,
  properties,
  rooms,
  initialTasks,
}: HousekeepingClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [tasks, setTasks] = useState<HousekeepingTaskItem[]>(initialTasks)
  const [roomList, setRoomList] = useState<RoomItem[]>(rooms)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Quick Task Modal
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskRoomId, setNewTaskRoomId] = useState(rooms[0]?.id || '')
  const [newTaskType, setNewTaskType] = useState('Full Turnover & Linen Change')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')

  // Stats
  const dirtyRooms = roomList.filter((r) => r.status === 'dirty').length
  const cleaningRooms = roomList.filter((r) => r.status === 'cleaning').length
  const cleanRooms = roomList.filter((r) => r.status === 'available').length
  const maintenanceRooms = roomList.filter((r) => r.status === 'maintenance').length

  const handleQuickRoomStatus = async (roomId: string, newStatus: RoomItem['status']) => {
    setActionLoading(`room-${roomId}`)
    try {
      const res = await updateRoomStatus(roomId, newStatus)
      if (res.success) {
        setRoomList((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTask = async (
    taskId: string,
    roomId: string,
    newStatus: HousekeepingTaskItem['status']
  ) => {
    setActionLoading(`task-${taskId}`)
    try {
      const res = await updateHousekeepingTaskStatus(taskId, roomId, newStatus)
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        )
        const updatedRoomStatus =
          newStatus === 'completed' || newStatus === 'inspected'
            ? 'available'
            : newStatus === 'in_progress'
            ? 'cleaning'
            : 'dirty'
        setRoomList((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, status: updatedRoomStatus } : r))
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskRoomId) return

    setActionLoading('create-task')
    try {
      const res = await createHousekeepingTask({
        room_id: newTaskRoomId,
        task_type: newTaskType,
        priority: newTaskPriority,
      })
      if (res.success && res.data) {
        const roomObj = roomList.find((r) => r.id === newTaskRoomId)
        setTasks((prev) => [
          {
            ...res.data,
            room_number: roomObj?.room_number || 'Room',
            floor_name: roomObj?.floor_name,
            assigned_employee_name: 'Unassigned',
          },
          ...prev,
        ])
        setRoomList((prev) =>
          prev.map((r) => (r.id === newTaskRoomId ? { ...r, status: 'dirty' } : r))
        )
        setShowAddTask(false)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRooms = roomList.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.room_type_name && r.room_type_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Housekeeping &amp; Turnover Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time room turnover board, inspection queue, cleaning task dispatch, and staff allocations.
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

          <Button
            size="sm"
            onClick={() => setShowAddTask(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Dispatch Cleaning Task
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/30 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Dirty / Needs Clean
              </span>
              <div className="text-2xl font-bold text-amber-900 mt-1">{dirtyRooms}</div>
              <div className="text-[10px] text-amber-700 mt-0.5">Awaiting turnover</div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-800 text-[10px]">
              Turnover Queue
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
                Cleaning in Progress
              </span>
              <div className="text-2xl font-bold text-blue-900 mt-1">{cleaningRooms}</div>
              <div className="text-[10px] text-blue-700 mt-0.5">Staff on floor</div>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-800 text-[10px]">
              In Progress
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Clean &amp; Inspected
              </span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">{cleanRooms}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Ready for guests</div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[10px]">
              Sellable
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30 rounded-md shadow-2xs">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-red-600" />
                Maintenance Hold
              </span>
              <div className="text-2xl font-bold text-red-900 mt-1">{maintenanceRooms}</div>
              <div className="text-[10px] text-red-700 mt-0.5">Under repair work</div>
            </div>
            <Badge variant="outline" className="border-red-300 text-red-800 text-[10px]">
              Off-Market
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-3 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by room number or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Room States</option>
            <option value="dirty">Dirty Rooms</option>
            <option value="cleaning">Cleaning in Progress</option>
            <option value="available">Clean / Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Housekeeping Room Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <Card
            key={room.id}
            className={`border rounded-md shadow-2xs transition-all flex flex-col justify-between ${
              room.status === 'dirty'
                ? 'border-amber-300 bg-amber-50/20'
                : room.status === 'cleaning'
                ? 'border-blue-300 bg-blue-50/20'
                : room.status === 'available'
                ? 'border-emerald-200 bg-white'
                : 'border-gray-200 bg-gray-50/40'
            }`}
          >
            <CardHeader className="pb-2.5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-semibold text-gray-900">
                    Room {room.room_number}
                  </span>
                  <div className="text-[10px] text-gray-500">{room.floor_name}</div>
                </div>
                <Badge
                  variant={
                    room.status === 'available'
                      ? 'success'
                      : room.status === 'dirty'
                      ? 'warning'
                      : room.status === 'cleaning'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="text-[10px] rounded-xs capitalize"
                >
                  {room.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3 flex-1 flex flex-col justify-between">
              <div className="text-xs text-gray-600">
                <span className="text-[10px] text-gray-400 block">Category:</span>
                <span className="font-medium text-gray-800">{room.room_type_name}</span>
                {room.notes && (
                  <div className="text-[10px] text-gray-500 bg-white p-1.5 rounded border border-gray-100 mt-2 line-clamp-2">
                    {room.notes}
                  </div>
                )}
              </div>

              {/* Status Toggle Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                {room.status === 'dirty' ? (
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoomStatus(room.id, 'cleaning')}
                    disabled={actionLoading === `room-${room.id}`}
                    className="w-full text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-sm cursor-pointer font-medium"
                  >
                    Start Cleaning
                  </Button>
                ) : room.status === 'cleaning' ? (
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoomStatus(room.id, 'available')}
                    disabled={actionLoading === `room-${room.id}`}
                    className="w-full text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer font-medium"
                  >
                    Mark Clean &amp; Inspected
                  </Button>
                ) : room.status === 'available' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickRoomStatus(room.id, 'dirty')}
                    disabled={actionLoading === `room-${room.id}`}
                    className="w-full text-xs h-7 text-amber-700 border-amber-300 hover:bg-amber-50 rounded-sm cursor-pointer"
                  >
                    Mark Dirty
                  </Button>
                ) : (
                  <select
                    value={room.status}
                    onChange={(e) => handleQuickRoomStatus(room.id, e.target.value as any)}
                    className="w-full text-[10px] py-1 px-1 bg-white border border-gray-200 rounded-sm cursor-pointer"
                  >
                    <option value="available">Make Available</option>
                    <option value="dirty">Make Dirty</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dispatch Cleaning Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Dispatch Housekeeping Task
              </span>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Room *</label>
                <select
                  value={newTaskRoomId}
                  onChange={(e) => setNewTaskRoomId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  required
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.floor_name}) - Current: {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Task Type *</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="Full Turnover & Linen Change">Full Turnover &amp; Linen Change</option>
                  <option value="Daily Refresh & Towels">Daily Refresh &amp; Towels</option>
                  <option value="Deep Sanitization & Steaming">Deep Sanitization &amp; Steaming</option>
                  <option value="Post-Maintenance Inspection">Post-Maintenance Inspection</option>
                  <option value="VIP Pre-Arrival Setup">VIP Pre-Arrival Setup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="medium">Medium</option>
                  <option value="high">High (Arrival Today)</option>
                  <option value="urgent">Urgent (Guest Waiting in Lobby)</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTask(false)}
                  className="text-xs h-8 rounded-md cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading === 'create-task'}
                  size="sm"
                  className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
                >
                  Dispatch Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

