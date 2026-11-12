import React from 'react'
import { Plus, BedDouble, Filter, Search, Sparkles, Wrench, CheckCircle2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Rooms Management | StayNext' }

const demoRooms = [
  { id: 'r-101', roomNumber: '101', floor: 'Floor 1', type: 'Deluxe King', rate: 220, status: 'available', maxGuests: 2 },
  { id: 'r-102', roomNumber: '102', floor: 'Floor 1', type: 'Deluxe King', rate: 220, status: 'occupied', guest: 'Sarah Jenkins', checkOut: 'Nov 14', maxGuests: 2 },
  { id: 'r-103', roomNumber: '103', floor: 'Floor 1', type: 'Executive Double', rate: 280, status: 'dirty', maxGuests: 4 },
  { id: 'r-104', roomNumber: '104', floor: 'Floor 1', type: 'Executive Double', rate: 280, status: 'cleaning', maxGuests: 4 },
  { id: 'r-201', roomNumber: '201', floor: 'Floor 2', type: 'Presidential Suite', rate: 650, status: 'occupied', guest: 'Marcus Vance', checkOut: 'Nov 16', maxGuests: 4 },
  { id: 'r-202', roomNumber: '202', floor: 'Floor 2', type: 'Junior Suite', rate: 350, status: 'reserved', guest: 'Elena Rostova', checkIn: 'Today', maxGuests: 2 },
  { id: 'r-203', roomNumber: '203', floor: 'Floor 2', type: 'Deluxe Twin', rate: 210, status: 'available', maxGuests: 2 },
  { id: 'r-204', roomNumber: '204', floor: 'Floor 2', type: 'Deluxe Twin', rate: 210, status: 'maintenance', reason: 'AC compressor servicing', maxGuests: 2 },
  { id: 'r-301', roomNumber: '301', floor: 'Floor 3', type: 'Ocean Villa', rate: 520, status: 'available', maxGuests: 4 },
  { id: 'r-302', roomNumber: '302', floor: 'Floor 3', type: 'Ocean Villa', rate: 520, status: 'out_of_order', reason: 'Bathroom tile renovation', maxGuests: 4 },
  { id: 'r-303', roomNumber: '303', floor: 'Floor 3', type: 'Standard Queen', rate: 175, status: 'available', maxGuests: 2 },
  { id: 'r-304', roomNumber: '304', floor: 'Floor 3', type: 'Standard Queen', rate: 175, status: 'occupied', guest: 'David Chen', checkOut: 'Nov 13', maxGuests: 2 },
]

export default function RoomsPage() {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'success'
      case 'occupied': return 'purple'
      case 'reserved': return 'info'
      case 'dirty': return 'warning'
      case 'cleaning': return 'secondary'
      case 'maintenance': return 'destructive'
      case 'out_of_order': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Room Inventory &amp; Status
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time room occupancy, housekeeping states, blocking, and maintenance tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rooms/blocking">
            <Button variant="outline" size="sm" className="text-xs h-9">
              Block Room
            </Button>
          </Link>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
          <button className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-semibold">All (12)</button>
          <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Available (4)</button>
          <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Occupied (3)</button>
          <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Dirty / Cleaning (2)</button>
          <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Reserved (1)</button>
          <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Maintenance (2)</button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter room #..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {demoRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-gray-900 leading-none">
                    #{room.roomNumber}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {room.floor}
                  </span>
                </div>
                <Badge variant={getBadgeVariant(room.status)} className="capitalize text-[10px]">
                  {room.status.replace('_', ' ')}
                </Badge>
              </div>

              <p className="text-xs font-semibold text-gray-800">{room.type}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(room.rate)} / night</p>

              {/* Occupied info */}
              {room.guest && (
                <div className="mt-3 p-2 bg-indigo-50/60 rounded border border-indigo-100 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-medium truncate">
                    <User className="h-3 w-3 text-indigo-600 shrink-0" />
                    <span>{room.guest}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 pl-4.5">
                    {room.checkOut ? `Departing: ${room.checkOut}` : `Arrival: ${room.checkIn}`}
                  </p>
                </div>
              )}

              {/* Maintenance / Out of order reason */}
              {room.reason && (
                <div className="mt-3 p-2 bg-rose-50 rounded border border-rose-100 text-[11px] text-rose-800">
                  <span className="font-semibold block">Issue:</span>
                  <span>{room.reason}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-1 text-xs">
              {room.status === 'available' && (
                <Button size="sm" className="w-full h-7 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Assign &amp; Check-in
                </Button>
              )}
              {room.status === 'dirty' && (
                <Button size="sm" variant="outline" className="w-full h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mark Cleaning
                </Button>
              )}
              {room.status === 'occupied' && (
                <Link href={`/front-desk`} className="w-full">
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs text-gray-700">
                    View Folio
                  </Button>
                </Link>
              )}
              {(room.status === 'maintenance' || room.status === 'out_of_order') && (
                <Link href="/maintenance" className="w-full">
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs text-rose-700 border-rose-200">
                    <Wrench className="h-3 w-3 mr-1" />
                    View Ticket
                  </Button>
                </Link>
              )}
              {room.status === 'cleaning' && (
                <Button size="sm" variant="outline" className="w-full h-7 text-xs text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready to Inspect
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

