'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BedDouble, CheckCircle2, Users, AlertTriangle, Clock, Wrench, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const floorsData = [
  {
    floor: 'Floor 1',
    description: 'Ground floor / Lobby access, Standard & Deluxe wings',
    rooms: [
      { number: '101', type: 'Deluxe King', status: 'available', guest: null, rate: '$220' },
      { number: '102', type: 'Deluxe King', status: 'occupied', guest: 'Sarah Jenkins', rate: '$220' },
      { number: '103', type: 'Executive Double', status: 'dirty', guest: null, rate: '$280' },
      { number: '104', type: 'Executive Double', status: 'cleaning', guest: null, rate: '$280' },
      { number: '105', type: 'Standard Queen', status: 'available', guest: null, rate: '$175' },
      { number: '106', type: 'Standard Queen', status: 'occupied', guest: 'John Doe', rate: '$175' },
      { number: '107', type: 'Standard Queen', status: 'available', guest: null, rate: '$175' },
      { number: '108', type: 'Executive Double', status: 'maintenance', guest: null, rate: '$280' },
    ],
  },
  {
    floor: 'Floor 2',
    description: 'Mid-tier executive floor, Junior Suites & Executive Wings',
    rooms: [
      { number: '201', type: 'Presidential Suite', status: 'occupied', guest: 'Marcus Vance', rate: '$650' },
      { number: '202', type: 'Junior Suite', status: 'reserved', guest: 'Elena Rostova', rate: '$350' },
      { number: '203', type: 'Deluxe Twin', status: 'available', guest: null, rate: '$210' },
      { number: '204', type: 'Deluxe Twin', status: 'maintenance', guest: null, rate: '$210' },
      { number: '205', type: 'Junior Suite', status: 'occupied', guest: 'Rachel Green', rate: '$350' },
      { number: '206', type: 'Junior Suite', status: 'available', guest: null, rate: '$350' },
    ],
  },
  {
    floor: 'Floor 3',
    description: 'Penthouse & VIP suites with private ocean balconies',
    rooms: [
      { number: '301', type: 'Ocean Villa', status: 'available', guest: null, rate: '$520' },
      { number: '302', type: 'Ocean Villa', status: 'out_of_order', guest: null, rate: '$520' },
      { number: '303', type: 'Standard Queen', status: 'available', guest: null, rate: '$175' },
      { number: '304', type: 'Standard Queen', status: 'occupied', guest: 'David Chen', rate: '$175' },
      { number: '305', type: 'Presidential Suite', status: 'occupied', guest: 'Sophia Montgomery', rate: '$650' },
      { number: '306', type: 'Ocean Villa', status: 'reserved', guest: 'Alex Turner', rate: '$520' },
    ],
  },
]

export default function FloorPlanPage() {
  const [selectedFloor, setSelectedFloor] = useState('Floor 1')

  const currentFloor = floorsData.find((f) => f.floor === selectedFloor) || floorsData[0]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Available</span>
      case 'occupied':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Occupied</span>
      case 'reserved':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Reserved</span>
      case 'dirty':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Dirty</span>
      case 'cleaning':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Cleaning</span>
      case 'maintenance':
      case 'out_of_order':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Maintenance</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rooms">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Interactive Floor Plan &amp; Layout
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Visual floor map with real-time occupancy status, room turnover, and guest allocation.
            </p>
          </div>
        </div>

        {/* Floor selector buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs">
          {floorsData.map((f) => (
            <button
              key={f.floor}
              onClick={() => setSelectedFloor(f.floor)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedFloor === f.floor
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.floor}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 rounded-lg border border-gray-200 shadow-2xs text-gray-600">
        <span className="font-semibold text-gray-700">Status Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Reserved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Dirty
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Cleaning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Maintenance
        </span>
      </div>

      {/* Floor Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{currentFloor.floor}</h2>
            <p className="text-xs text-gray-500">{currentFloor.description}</p>
          </div>
          <span className="text-xs font-medium text-gray-400">
            {currentFloor.rooms.length} Total Rooms
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentFloor.rooms.map((room) => (
            <div
              key={room.number}
              className={`p-4 rounded-lg border transition-all bg-white shadow-2xs hover:shadow-xs ${
                room.status === 'occupied'
                  ? 'border-indigo-200'
                  : room.status === 'available'
                  ? 'border-emerald-200'
                  : room.status === 'dirty'
                  ? 'border-amber-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-gray-900 tracking-tight">
                    {room.number}
                  </span>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{room.type}</p>
                </div>
                {getStatusBadge(room.status)}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Guest</span>
                  <p className="font-semibold text-gray-800 truncate max-w-[120px]">
                    {room.guest || '— None —'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Rate</span>
                  <p className="font-mono font-bold text-gray-900">{room.rate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
