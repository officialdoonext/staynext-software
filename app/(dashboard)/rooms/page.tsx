import React from 'react'
import { Plus, BedDouble, Filter, Search, Sparkles, Wrench, CheckCircle2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Rooms Management | StayNext' }

export default async function RoomsPage() {
  const supabase = await createClient()

  let rooms: any[] = []
  try {
    const { data } = await supabase
      .from('rooms')
      .select(`
        id,
        room_number,
        status,
        notes,
        floors (
          name,
          floor_number
        ),
        room_types (
          name,
          base_rate,
          max_occupancy
        )
      `)
      .order('room_number', { ascending: true })

    if (data) {
      rooms = data.map((r: any) => ({
        id: r.id,
        roomNumber: r.room_number,
        floor: r.floors?.name || (r.floors?.floor_number ? `Floor ${r.floors.floor_number}` : 'Floor 1'),
        type: r.room_types?.name || 'Standard Room',
        rate: Number(r.room_types?.base_rate || 0),
        status: r.status,
        maxGuests: r.room_types?.max_occupancy || 2,
        notes: r.notes,
      }))
    }
  } catch {}

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'success'
      case 'occupied':
        return 'purple'
      case 'reserved':
        return 'info'
      case 'dirty':
        return 'warning'
      case 'cleaning':
        return 'secondary'
      case 'maintenance':
        return 'destructive'
      case 'out_of_order':
        return 'destructive'
      default:
        return 'outline'
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
          <Link href="/rooms/types">
            <Button variant="outline" size="sm" className="text-xs h-9">
              Room Categories
            </Button>
          </Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <BedDouble className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Rooms Added Yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Your property inventory has not been configured yet. Add room types and assign room numbers to start taking bookings.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link href="/rooms/types">
              <Button size="sm" variant="outline" className="text-xs">
                Configure Room Types
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Room Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="border-gray-200 hover:border-[#5e2b9d] transition-all cursor-pointer shadow-2xs hover:shadow-sm rounded-md"
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-gray-900">
                    #{room.roomNumber}
                  </span>
                  <Badge variant={getBadgeVariant(room.status)} className="capitalize text-[10px]">
                    {room.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">{room.floor}</p>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <p className="text-xs font-semibold text-gray-800 line-clamp-1">{room.type}</p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span>{formatCurrency(room.rate)}</span>
                  <span>Max: {room.maxGuests}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
