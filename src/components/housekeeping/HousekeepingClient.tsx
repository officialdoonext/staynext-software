'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Search,
  AlertCircle,
  Plus,
  BedDouble,
  Layers,
  Wrench,
  Check,
  RotateCcw,
  QrCode,
  User,
  Phone,
  Eye,
  Calendar,
  Filter,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  HousekeepingTaskItem,
  updateHousekeepingTaskStatus,
  createHousekeepingTask
} from '@/services/housekeeping.service'
import { RoomItem, updateRoomStatus } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatDateTime } from '@/lib/utils'

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
  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [activeTab, setActiveTab] = useState<'requests' | 'rooms'>('requests')
  const [tasks, setTasks] = useState<HousekeepingTaskItem[]>(initialTasks)
  const [roomList, setRoomList] = useState<RoomItem[]>(rooms)

  // Filters for Requests
  const [taskSearchTerm, setTaskSearchTerm] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all')
  const [taskSourceFilter, setTaskSourceFilter] = useState('all')

  // Filters for Rooms Matrix
  const [roomSearchTerm, setRoomSearchTerm] = useState('')
  const [roomStatusFilter, setRoomStatusFilter] = useState('all')

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Quick Task Modal
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskRoomId, setNewTaskRoomId] = useState(rooms[0]?.id || '')
  const [newTaskType, setNewTaskType] = useState('Full Turnover & Linen Change')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskNotes, setNewTaskNotes] = useState('')

  // View Task Details Modal
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<HousekeepingTaskItem | null>(null)

  // Stats
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length
  const inProgressTasksCount = tasks.filter((t) => t.status === 'in_progress').length
  const completedTasksCount = tasks.filter((t) => t.status === 'completed' || t.status === 'inspected').length
  const qrRequestsCount = tasks.filter((t) => t.source === 'room_qr').length

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
        if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
          setSelectedTaskDetail((prev) => (prev ? { ...prev, status: newStatus } : null))
        }
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
        notes: newTaskNotes.trim() || undefined,
      })
      if (res.success && res.data) {
        const roomObj = roomList.find((r) => r.id === newTaskRoomId)
        setTasks((prev) => [
          {
            ...res.data,
            room_number: roomObj?.room_number || 'Room',
            floor_name: roomObj?.floor_name,
            assigned_employee_name: 'Unassigned',
            source: 'staff',
            notes: newTaskNotes.trim() || '',
          },
          ...prev,
        ])
        setRoomList((prev) =>
          prev.map((r) => (r.id === newTaskRoomId ? { ...r, status: 'dirty' } : r))
        )
        setShowAddTask(false)
        setNewTaskNotes('')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const term = taskSearchTerm.toLowerCase()
    const matchesSearch =
      taskSearchTerm === '' ||
      t.room_number.toLowerCase().includes(term) ||
      t.task_type.toLowerCase().includes(term) ||
      (t.notes && t.notes.toLowerCase().includes(term)) ||
      (t.guest_name && t.guest_name.toLowerCase().includes(term)) ||
      (t.guest_phone && t.guest_phone.toLowerCase().includes(term))

    const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter
    const matchesPriority = taskPriorityFilter === 'all' || t.priority === taskPriorityFilter
    const matchesSource = taskSourceFilter === 'all' || (t.source || 'staff') === taskSourceFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesSource
  })

  // Filter Rooms
  const filteredRooms = roomList.filter((r) => {
    const matchesSearch =
      roomSearchTerm === '' ||
      r.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      (r.room_type_name && r.room_type_name.toLowerCase().includes(roomSearchTerm.toLowerCase()))

    const matchesStatus = roomStatusFilter === 'all' || r.status === roomStatusFilter
    return matchesSearch && matchesStatus
  })

  const getPriorityBadge = (p: HousekeepingTaskItem['priority']) => {
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

  const getStatusBadge = (s: HousekeepingTaskItem['status']) => {
    switch (s) {
      case 'pending':
        return <Badge variant="warning" className="text-[10px] rounded-xs capitalize">Pending</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="text-[10px] rounded-xs capitalize">Cleaning</Badge>
      case 'completed':
      case 'inspected':
        return <Badge variant="success" className="text-[10px] rounded-xs capitalize">Completed</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] rounded-xs capitalize">{s}</Badge>
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#5e2b9d]" />
            Housekeeping &amp; Turnover Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track real-time room turnover, guest QR service requests, cleaning dispatches, and staff inspection queue.
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

          <Link href="/housekeeping/types">
            <Button
              size="sm"
              variant="outline"
              className="border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd] text-xs h-9 font-medium rounded-md cursor-pointer"
            >
              <Sparkles className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Housekeeping Types
            </Button>
          </Link>

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
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Pending Requests
              </span>
              <div className="text-2xl font-bold text-amber-900 mt-1">{pendingTasksCount}</div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                {qrRequestsCount} from Room QR scans
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-800 text-[10px]">
              Active Queue
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
              <div className="text-2xl font-bold text-blue-900 mt-1">{inProgressTasksCount}</div>
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
              <div className="text-[10px] text-emerald-700 mt-0.5">{completedTasksCount} tasks completed</div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[10px]">
              Ready for Guests
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
              <div className="text-[10px] text-red-700 mt-0.5">Off-market repair</div>
            </div>
            <Badge variant="outline" className="border-red-300 text-red-800 text-[10px]">
              Blocked
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md cursor-pointer transition-colors ${
            activeTab === 'requests'
              ? 'bg-[#5e2b9d] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Housekeeping Requests &amp; Tasks</span>
          {pendingTasksCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'requests' ? 'bg-white text-[#5e2b9d]' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingTasksCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md cursor-pointer transition-colors ${
            activeTab === 'rooms'
              ? 'bg-[#5e2b9d] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BedDouble className="h-3.5 w-3.5" />
          <span>Room Turnover Matrix</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
              activeTab === 'rooms' ? 'bg-white text-[#5e2b9d]' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {roomList.length} Rooms
          </span>
        </button>
      </div>

      {/* TAB 1: HOUSEKEEPING REQUESTS & TASKS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Requests Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
            <div className="sm:col-span-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search request type, room number, guest name, or notes..."
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <SearchableSelect
                value={taskStatusFilter}
                onChange={setTaskStatusFilter}
                placeholder="All Request Statuses"
              >
                <option value="all">All Request Statuses</option>
                <option value="pending">Pending ({pendingTasksCount})</option>
                <option value="in_progress">Cleaning in Progress ({inProgressTasksCount})</option>
                <option value="completed">Completed / Inspected ({completedTasksCount})</option>
              </SearchableSelect>
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <SearchableSelect
                  value={taskPriorityFilter}
                  onChange={setTaskPriorityFilter}
                  placeholder="All Priorities"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </SearchableSelect>
              </div>

              <div className="w-1/2">
                <SearchableSelect
                  value={taskSourceFilter}
                  onChange={setTaskSourceFilter}
                  placeholder="All Sources"
                >
                  <option value="all">All Sources</option>
                  <option value="room_qr">Room QR</option>
                  <option value="staff">Staff</option>
                </SearchableSelect>
              </div>
            </div>
          </div>

          {/* Requests List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-md border border-gray-200 p-12 text-center shadow-2xs">
              <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-xs font-semibold text-gray-900">No Housekeeping Requests Found</h3>
              <p className="text-[11px] text-gray-500 mt-1">
                {taskSearchTerm || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all'
                  ? 'No tasks match your selected search or filter criteria.'
                  : 'All rooms are clean and no guest service requests are currently queued.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`border rounded-md shadow-2xs transition-all hover:shadow-xs ${
                    task.status === 'pending'
                      ? 'border-amber-200 bg-amber-50/10'
                      : task.status === 'in_progress'
                      ? 'border-blue-200 bg-blue-50/10'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left Block: Room, Request Title & Source */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                            Room {task.room_number}
                          </span>
                          <span className="text-[11px] text-gray-500">{task.floor_name}</span>

                          {task.source === 'room_qr' ? (
                            <Badge className="bg-purple-100 text-[#5e2b9d] border-[#dfcef6] text-[10px] rounded-xs font-medium flex items-center gap-1">
                              <QrCode className="h-3 w-3" />
                              Room QR Scan
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 text-[10px] rounded-xs font-normal">
                              Staff Dispatched
                            </Badge>
                          )}

                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>

                        {/* Request Title */}
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <span>{task.task_type}</span>
                        </div>

                        {/* Full Request Details / Notes */}
                        {task.notes && (
                          <div className="bg-gray-50/80 border border-gray-200 rounded p-2 text-xs text-gray-700 whitespace-pre-line font-normal leading-relaxed mt-1">
                            <span className="text-[10px] font-semibold text-gray-500 block uppercase tracking-wide mb-0.5">
                              Request Instructions &amp; Guest Notes:
                            </span>
                            {task.notes}
                          </div>
                        )}

                        {/* Guest & Timing Meta */}
                        <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1 flex-wrap">
                          {task.guest_name && (
                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                              <User className="h-3 w-3 text-gray-400" />
                              Guest: {task.guest_name}
                            </span>
                          )}

                          {task.guest_phone && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {task.guest_phone}
                            </span>
                          )}

                          <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-3 w-3" />
                            Reported: {formatDateTime(task.created_at)}
                          </span>

                          <span className="text-gray-400">
                            Assigned: <strong className="text-gray-600">{task.assigned_employee_name}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right Block: Status Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTaskDetail(task)}
                          className="h-8 px-2.5 text-xs text-gray-700 border-gray-200 hover:bg-gray-50 rounded-sm cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          View Full Details
                        </Button>

                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTask(task.id, task.room_id, 'in_progress')}
                            disabled={actionLoading === `task-${task.id}`}
                            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-sm cursor-pointer font-medium"
                          >
                            Start Cleaning
                          </Button>
                        )}

                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTask(task.id, task.room_id, 'completed')}
                            disabled={actionLoading === `task-${task.id}`}
                            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm cursor-pointer font-medium"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Mark Clean &amp; Inspected
                          </Button>
                        )}

                        {(task.status === 'completed' || task.status === 'inspected') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTask(task.id, task.room_id, 'in_progress')}
                            disabled={actionLoading === `task-${task.id}`}
                            className="h-8 px-2.5 text-xs text-gray-500 border-gray-200 hover:bg-gray-50 rounded-sm cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Re-clean
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOM TURNOVER MATRIX */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Room Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
            <div className="sm:col-span-3 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter room matrix by room number or category..."
                value={roomSearchTerm}
                onChange={(e) => setRoomSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <SearchableSelect
                value={roomStatusFilter}
                onChange={setRoomStatusFilter}
                options={[
                  { value: 'all', label: `All Room States (${roomList.length})` },
                  { value: 'dirty', label: `Dirty Rooms (${dirtyRooms})` },
                  { value: 'cleaning', label: `Cleaning in Progress (${cleaningRooms})` },
                  { value: 'available', label: `Clean / Available (${cleanRooms})` },
                  { value: 'occupied', label: 'Occupied Rooms' },
                  { value: 'maintenance', label: `Maintenance Hold (${maintenanceRooms})` },
                ]}
                placeholder="Filter Room State..."
              />
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
                      <SearchableSelect
                        value={room.status}
                        onChange={(val) => handleQuickRoomStatus(room.id, val as any)}
                        options={[
                          { value: 'available', label: 'Make Available' },
                          { value: 'dirty', label: 'Make Dirty' },
                          { value: 'cleaning', label: 'Cleaning' },
                          { value: 'maintenance', label: 'Maintenance' },
                        ]}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW FULL REQUEST DETAILS */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#5e2b9d]" />
                <span className="text-sm font-semibold text-gray-900">
                  Housekeeping Request Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Room</span>
                  <span className="text-xs font-bold text-gray-900">
                    Room {selectedTaskDetail.room_number} ({selectedTaskDetail.floor_name})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Source</span>
                  {selectedTaskDetail.source === 'room_qr' ? (
                    <Badge className="bg-purple-100 text-[#5e2b9d] border-[#dfcef6] text-[10px] font-medium">
                      Room QR Scan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 text-[10px]">
                      Staff Dispatch
                    </Badge>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Priority</span>
                  {getPriorityBadge(selectedTaskDetail.priority)}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Status</span>
                  {getStatusBadge(selectedTaskDetail.status)}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Reported Time</span>
                  <span className="text-gray-700 font-medium">{formatDateTime(selectedTaskDetail.created_at)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Assigned Staff</span>
                  <span className="text-gray-700 font-medium">{selectedTaskDetail.assigned_employee_name}</span>
                </div>
              </div>

              {/* Guest Information */}
              {(selectedTaskDetail.guest_name || selectedTaskDetail.guest_phone) && (
                <div className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-md text-xs">
                  <span className="text-[10px] font-semibold text-[#5e2b9d] uppercase block mb-1">
                    Guest Contact Details:
                  </span>
                  <div className="flex items-center gap-3 text-gray-800">
                    {selectedTaskDetail.guest_name && (
                      <span className="font-medium">Name: {selectedTaskDetail.guest_name}</span>
                    )}
                    {selectedTaskDetail.guest_phone && (
                      <span>Phone: {selectedTaskDetail.guest_phone}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Service Type */}
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">
                  Requested Service / Task:
                </span>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200 font-semibold text-gray-900">
                  {selectedTaskDetail.task_type}
                </div>
              </div>

              {/* Full Notes & Instructions */}
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">
                  Complete Request Description &amp; Guest Instructions:
                </span>
                <div className="p-3 bg-amber-50/30 border border-amber-200 rounded-md text-xs text-gray-800 whitespace-pre-line leading-relaxed min-h-[70px]">
                  {selectedTaskDetail.notes || 'No additional instructions provided for this request.'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTaskDetail(null)}
                className="text-xs h-8 rounded-md cursor-pointer"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedTaskDetail.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleUpdateTask(selectedTaskDetail.id, selectedTaskDetail.room_id, 'in_progress')
                    }
                    disabled={actionLoading === `task-${selectedTaskDetail.id}`}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer font-medium"
                  >
                    Start Cleaning
                  </Button>
                )}

                {selectedTaskDetail.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleUpdateTask(selectedTaskDetail.id, selectedTaskDetail.room_id, 'completed')
                    }
                    disabled={actionLoading === `task-${selectedTaskDetail.id}`}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer font-medium"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Mark Clean &amp; Inspected
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH CLEANING TASK MODAL */}
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
                <SearchableSelect
                  value={newTaskRoomId}
                  onChange={(val) => setNewTaskRoomId(val)}
                  options={rooms.map((r) => ({
                    value: r.id,
                    label: `Room ${r.room_number} (${r.floor_name}) - Current: ${r.status}`,
                  }))}
                  placeholder="Select room..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Task Type *</label>
                <SearchableSelect
                  value={newTaskType}
                  onChange={(val) => setNewTaskType(val)}
                  options={[
                    { value: 'Full Turnover & Linen Change', label: 'Full Turnover & Linen Change' },
                    { value: 'Daily Refresh & Towels', label: 'Daily Refresh & Towels' },
                    { value: 'Deep Sanitization & Steaming', label: 'Deep Sanitization & Steaming' },
                    { value: 'Post-Maintenance Inspection', label: 'Post-Maintenance Inspection' },
                    { value: 'VIP Pre-Arrival Setup', label: 'VIP Pre-Arrival Setup' },
                  ]}
                  allowAdd={true}
                  addNewLabel="Add Task Type"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <SearchableSelect
                  value={newTaskPriority}
                  onChange={(val) => setNewTaskPriority(val)}
                  options={[
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High (Arrival Today)' },
                    { value: 'urgent', label: 'Urgent (Guest Waiting in Lobby)' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Specific Instructions / Notes (Optional)
                </label>
                <textarea
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Extra pillows, replace bathroom floor mat"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
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
