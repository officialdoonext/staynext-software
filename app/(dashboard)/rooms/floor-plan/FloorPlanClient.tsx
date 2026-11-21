'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BedDouble,
  CheckCircle2,
  Users,
  AlertTriangle,
  Clock,
  Wrench,
  Ban,
  Sparkles,
  ArrowLeft,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FloorItem, PropertyItem } from '@/services/property.service'
import { RoomItem, updateRoomStatus } from '@/services/room.service'
import { formatCurrency } from '@/lib/utils'

interface FloorPlanClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  floors: FloorItem[]
  rooms: RoomItem[]
}

export default function FloorPlanClient({
  property: initialProp,
  properties,
  floors,
  rooms,
}: FloorPlanClientProps) {
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    floors[0]?.id || 'all'
  )
  const [roomList, setRoomList] = useState<RoomItem[]>(rooms)

  const handleStatusChange = async (roomId: string, newStatus: RoomItem['status']) => {
    const res = await updateRoomStatus(roomId, newStatus)
    if (res.success) {
      setRoomList((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
      )
    }
  }

  const displayedRooms = selectedFloorId === 'all'
    ? roomList
    : roomList.filter((r) => r.floor_id === selectedFloorId)

  const getStatusBadge = (status: RoomItem['status']) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">Available</span>
      case 'occupied':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#5e2b9d] bg-[#f7f2fd] px-2 py-0.5 rounded-sm border border-[#dfcef6]">Occupied</span>
      case 'reserved':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-200">Reserved</span>
      case 'dirty':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">Dirty</span>
      case 'cleaning':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">Cleaning</span>
      case 'maintenance':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-sm border border-red-200">Maintenance</span>
      case 'blocked':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-sm border border-gray-300">Blocked</span>
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-900 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200">{status}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rooms">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Visual Floor Plan &amp; Room Matrix
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Interactive bird&apos;s-eye layout of rooms across hotel floors and architectural blocks.
            </p>
          </div>
        </div>

        <Link href="/rooms/new">
          <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer font-medium">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Room
          </Button>
        </Link>
      </div>

      {/* Floor Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setSelectedFloorId('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            selectedFloorId === 'all'
              ? 'bg-[#5e2b9d] text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Floors ({roomList.length} Rooms)
        </button>

        {floors.map((f) => {
          const count = roomList.filter((r) => r.floor_id === f.id).length
          const isSelected = selectedFloorId === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFloorId(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#5e2b9d] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.name || `Floor ${f.floor_number}`} ({count} Rooms)
            </button>
          )
        })}
      </div>

      {/* Room Matrix Grid */}
      {displayedRooms.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
          <BedDouble className="h-8 w-8 text-[#5e2b9d] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900">No rooms on this floor</h3>
          <p className="text-xs text-gray-500 mt-1">Assign room units to this floor in room settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {displayedRooms.map((room) => (
            <Card
              key={room.id}
              className={`border rounded-md shadow-2xs transition-all flex flex-col justify-between ${
                room.status === 'occupied'
                  ? 'border-[#dfcef6] bg-[#f7f2fd]/20'
                  : room.status === 'dirty'
                  ? 'border-amber-200 bg-amber-50/20'
                  : room.status === 'maintenance'
                  ? 'border-red-200 bg-red-50/20'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      #{room.room_number}
                    </span>
                    {getStatusBadge(room.status)}
                  </div>
                  <div className="text-[10px] text-gray-500 line-clamp-1 mt-1">
                    {room.room_type_name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {formatCurrency(room.base_rate || 0)}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value as any)}
                    className="text-[9px] py-1 px-1 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer w-full"
                  >
                    <option value="available">Available</option>
                    <option value="dirty">Dirty</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

