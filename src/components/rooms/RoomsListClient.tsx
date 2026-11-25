'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BedDouble,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Sparkles,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Edit,
  Trash2,
  Download,
  Ban,
  Clock,
  ExternalLink,
  Building2,
  Layers,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { RoomItem, RoomTypeItem, updateRoomStatus, deleteRoom } from '@/services/room.service'
import { BuildingItem, FloorItem, PropertyItem } from '@/services/property.service'
import { formatCurrency } from '@/lib/utils'
import BulkUploadRoomsModal from '@/components/rooms/BulkUploadRoomsModal'

interface RoomsListClientProps {
  initialRooms: RoomItem[]
  roomTypes: RoomTypeItem[]
  buildings: BuildingItem[]
  floors: FloorItem[]
  properties: PropertyItem[]
}

export default function RoomsListClient({
  initialRooms,
  roomTypes,
  buildings,
  floors,
  properties,
}: RoomsListClientProps) {
  const router = useRouter()
  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)

  const handleQuickStatus = async (roomId: string, newStatus: RoomItem['status']) => {
    setUpdatingId(roomId)
    try {
      const res = await updateRoomStatus(roomId, newStatus)
      if (res.success) {
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (roomId: string, roomNum: string) => {
    if (!confirm(`Are you sure you want to remove Room ${roomNum} from inventory?`)) return
    const res = await deleteRoom(roomId)
    if (res.success) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    } else {
      alert(res.error || 'Failed to delete room.')
    }
  }

  const filtered = rooms.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.room_type_name && r.room_type_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === 'all' || r.room_type_id === selectedType
    const matchesFloor = selectedFloor === 'all' || r.floor_id === selectedFloor
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus

    return matchesSearch && matchesType && matchesFloor && matchesStatus
  })

  const getStatusBadge = (status: RoomItem['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Available
          </span>
        )
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#5e2b9d] bg-[#f7f2fd] px-2 py-0.5 rounded-sm border border-[#dfcef6]">
            <BedDouble className="h-3 w-3" />
            Occupied
          </span>
        )
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-200">
            <Clock className="h-3 w-3" />
            Reserved
          </span>
        )
      case 'dirty':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
            <Sparkles className="h-3 w-3" />
            Dirty
          </span>
        )
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
            <Sparkles className="h-3 w-3 animate-spin" />
            Cleaning
          </span>
        )
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-sm border border-red-200">
            <Wrench className="h-3 w-3" />
            Maintenance
          </span>
        )
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-sm border border-gray-300">
            <Ban className="h-3 w-3" />
            Blocked
          </span>
        )
      case 'out_of_order':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-900 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200">
            <AlertTriangle className="h-3 w-3" />
            Out of Order
          </span>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const exportCSV = () => {
    const headers = ['Room Number', 'Type', 'Floor', 'Building', 'Rate', 'Status', 'Smoking Allowed']
    const rows = filtered.map((r) => [
      `"${r.room_number}"`,
      `"${r.room_type_name || ''}"`,
      `"${r.floor_name || ''}"`,
      `"${r.building_name || ''}"`,
      r.base_rate || 0,
      r.status,
      r.is_smoking ? 'Yes' : 'No',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `rooms_inventory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Rooms Inventory &amp; Status
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time room availability, housekeeping states, blocking, and QR codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/rooms/buildings">
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-md cursor-pointer border-gray-200">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Blocks &amp; Wings
            </Button>
          </Link>

          <Link href="/rooms/floors">
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-md cursor-pointer border-gray-200">
              <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Floors
            </Button>
          </Link>

          <Link href="/rooms/types">
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-md cursor-pointer border-gray-200">
              Room Categories
            </Button>
          </Link>

          <Link href="/rooms/blocking">
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-md cursor-pointer border-gray-200">
              <Ban className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Room Blocking
            </Button>
          </Link>

          <Link href="/rooms/qr-codes">
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-md cursor-pointer border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]">
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              QR Codes
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkUploadOpen(true)}
            className="text-xs h-9 rounded-md cursor-pointer border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd] font-medium"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Bulk Upload
          </Button>

          <Link href="/rooms/new">
            <Button className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and View Mode Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search room number or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <SearchableSelect
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { value: 'all', label: 'All Room Types' },
              ...roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
            ]}
            placeholder="Filter Type..."
          />
        </div>

        <div>
          <SearchableSelect
            value={selectedFloor}
            onChange={setSelectedFloor}
            options={[
              { value: 'all', label: 'All Floors' },
              ...floors.map((f) => ({ value: f.id, label: f.name || `Floor ${f.floor_number}` })),
            ]}
            placeholder="Filter Floor..."
          />
        </div>

        <div>
          <SearchableSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'available', label: 'Available' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'reserved', label: 'Reserved' },
              { value: 'dirty', label: 'Dirty' },
              { value: 'cleaning', label: 'Cleaning' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'out_of_order', label: 'Out of Order' },
            ]}
            placeholder="Filter Status..."
          />
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-8 px-2 text-xs rounded-md cursor-pointer border-gray-200"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
          </Button>

          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-gray-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#5e2b9d] text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 cursor-pointer ${
                viewMode === 'table' ? 'bg-[#5e2b9d] text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
          <BedDouble className="h-8 w-8 text-[#5e2b9d] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900">No rooms found</h3>
          <p className="text-xs text-gray-500 mt-1">Try resetting search filters or register a new room unit.</p>
          <div className="mt-4">
            <Link href="/rooms/new">
              <Button size="sm" className="bg-[#5e2b9d] text-white text-xs rounded-md cursor-pointer">
                Add Room Unit
              </Button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((room) => (
            <Card
              key={room.id}
              className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-2.5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900 tracking-tight">
                        Room {room.room_number}
                      </span>
                      {room.is_smoking && (
                        <span className="text-[10px] text-gray-400 font-normal">🚬</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {room.room_type_name}
                    </span>
                  </div>
                  <div>{getStatusBadge(room.status)}</div>
                </div>
              </CardHeader>

              <CardContent className="pt-3 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="font-medium text-gray-800">
                      {room.floor_name} • {room.building_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Base Rate:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(room.base_rate || 0)} / night
                    </span>
                  </div>
                  {room.notes && (
                    <div className="text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-sm border border-gray-100 line-clamp-2 mt-1">
                      {room.notes}
                    </div>
                  )}
                </div>

                {/* Quick Status Action Controls */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                  <select
                    value={room.status}
                    onChange={(e) => handleQuickStatus(room.id, e.target.value as any)}
                    disabled={updatingId === room.id}
                    className="text-[10px] py-1 px-1.5 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="available">Mark Available</option>
                    <option value="dirty">Mark Dirty</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Block</option>
                    <option value="out_of_order">Out of Order</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <Link href={`/rooms/qr-codes?roomId=${room.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-[#5e2b9d] rounded-sm cursor-pointer"
                        title="View QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </Button>
                    </Link>

                    <Link href={`/rooms/${room.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-sm cursor-pointer"
                        title="Edit Room"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(room.id, room.room_number)}
                      className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-red-600 rounded-sm cursor-pointer transition-colors"
                      title="Delete Room"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Room &amp; Status</th>
                <th className="px-3.5 py-3">Category &amp; AC</th>
                <th className="px-3.5 py-3">Building &amp; Floor</th>
                <th className="px-3.5 py-3">Bed &amp; Max Occupants</th>
                <th className="px-3.5 py-3">Tariffs (Base / Wknd)</th>
                <th className="px-3.5 py-3">GST Category</th>
                <th className="px-3.5 py-3">Room Status</th>
                <th className="px-3.5 py-3">Housekeeping</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                  {/* Room Number & Active */}
                  <td className="px-3.5 py-3">
                    <span className="font-semibold text-gray-900 block text-xs">
                      Room {room.room_number}
                    </span>
                    <span className={`text-[10px] inline-flex items-center gap-1 font-medium ${
                      room.is_active ? 'text-emerald-700' : 'text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${room.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {room.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Category & AC */}
                  <td className="px-3.5 py-3">
                    <div className="font-medium text-gray-800">{room.room_type_name}</div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      room.is_ac ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {room.is_ac ? 'AC' : 'Non-AC'}
                    </span>
                  </td>

                  {/* Floor / Wing */}
                  <td className="px-3.5 py-3 text-gray-600">
                    <div className="font-medium text-gray-800">{room.building_name || 'Main Block'}</div>
                    <div className="text-[10px] text-gray-400">{room.floor_name || 'Ground Floor'}</div>
                  </td>

                  {/* Bed & Capacity */}
                  <td className="px-3.5 py-3 text-gray-700">
                    <div className="font-medium">{room.bed_type || 'Double Bed'}</div>
                    <div className="text-[10px] text-gray-400">
                      {room.max_adults || 2} Adults &bull; {room.max_children || 1} Child
                    </div>
                  </td>

                  {/* Base & Weekend Tariffs */}
                  <td className="px-3.5 py-3">
                    <div className="font-medium text-gray-900">{formatCurrency(room.base_rate || 0)}</div>
                    <div className="text-[10px] text-gray-400">
                      Wknd: {formatCurrency(room.weekend_price || Math.round((room.base_rate || 0) * 1.15))}
                    </div>
                  </td>

                  {/* GST Category */}
                  <td className="px-3.5 py-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                      {room.gst_category || 'Accommodation'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3.5 py-3">{getStatusBadge(room.status)}</td>

                  {/* Housekeeping */}
                  <td className="px-3.5 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      room.status === 'dirty'
                        ? 'bg-amber-100 text-amber-800'
                        : room.status === 'cleaning'
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {room.status === 'dirty' ? 'Dirty' : room.status === 'cleaning' ? 'Cleaning' : 'Clean / Inspected'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3.5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <select
                        value={room.status}
                        onChange={(e) => handleQuickStatus(room.id, e.target.value as any)}
                        disabled={updatingId === room.id}
                        className="text-[10px] py-1 px-1.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                      >
                        <option value="available">Available</option>
                        <option value="dirty">Dirty</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="blocked">Blocked</option>
                        <option value="out_of_order">Out of Order</option>
                      </select>

                      <Link href={`/rooms/qr-codes?roomId=${room.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-[#5e2b9d] rounded-sm cursor-pointer"
                          title="QR Code"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <Link href={`/rooms/${room.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-sm cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(room.id, room.room_number)}
                        className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-red-600 rounded-sm cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Bulk Upload Rooms Modal */}
      <BulkUploadRoomsModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        properties={properties}
        currentPropertyId={properties[0]?.id || ''}
        existingRoomTypes={roomTypes}
        existingBuildings={buildings}
        existingFloors={floors}
        existingRoomNumbers={rooms.map((r) => r.room_number)}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}

