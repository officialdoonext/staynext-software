import React from 'react'
import Link from 'next/link'
import { Plus, BedDouble, Users, Sparkles, Check, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Room Types & Categories | StayNext' }

const roomTypes = [
  {
    id: 'rt-1',
    name: 'Presidential Suite',
    code: 'PRES-STE',
    baseRate: 650,
    maxOccupancy: 4,
    totalRooms: 4,
    size: '120 sqm',
    bedding: '1 King Bed + 1 Queen Bed',
    amenities: ['Private Balcony', 'Ocean View', 'Jacuzzi', 'Minibar', 'Butler Service', 'High-Speed Wi-Fi'],
  },
  {
    id: 'rt-2',
    name: 'Ocean Villa',
    code: 'OCN-VIL',
    baseRate: 520,
    maxOccupancy: 4,
    totalRooms: 6,
    size: '95 sqm',
    bedding: '2 King Beds',
    amenities: ['Direct Beach Access', 'Infinity Pool', 'Espresso Machine', 'Smart TV', 'Lounge Area'],
  },
  {
    id: 'rt-3',
    name: 'Junior Suite',
    code: 'JR-STE',
    baseRate: 350,
    maxOccupancy: 2,
    totalRooms: 10,
    size: '55 sqm',
    bedding: '1 King Bed',
    amenities: ['City View', 'Bathtub', 'Workstation', 'Espresso Machine', 'Mini Fridge'],
  },
  {
    id: 'rt-4',
    name: 'Executive Double',
    code: 'EXEC-DBL',
    baseRate: 280,
    maxOccupancy: 4,
    totalRooms: 14,
    size: '42 sqm',
    bedding: '2 Queen Beds',
    amenities: ['High Floor', 'Ergonomic Chair', 'Safe', 'Rain Shower', 'Complimentary Breakfast'],
  },
  {
    id: 'rt-5',
    name: 'Deluxe King',
    code: 'DLX-KNG',
    baseRate: 220,
    maxOccupancy: 2,
    totalRooms: 18,
    size: '36 sqm',
    bedding: '1 King Bed',
    amenities: ['Garden View', 'Tea & Coffee Maker', 'Iron & Board', 'Hair Dryer'],
  },
  {
    id: 'rt-6',
    name: 'Standard Queen',
    code: 'STD-QUN',
    baseRate: 175,
    maxOccupancy: 2,
    totalRooms: 12,
    size: '28 sqm',
    bedding: '1 Queen Bed',
    amenities: ['Standard View', 'Smart TV', 'Air Conditioning', 'En-suite Bathroom'],
  },
]

export default function RoomTypesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Room Types &amp; Categories
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Define pricing models, maximum occupancy caps, bedding layouts, and room class amenities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rooms">
            <Button variant="outline" size="sm" className="text-xs h-9">
              View All Rooms
            </Button>
          </Link>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Room Type
          </Button>
        </div>
      </div>

      {/* Grid of Room Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roomTypes.map((rt) => (
          <div
            key={rt.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-600 bg-indigo-50/50 border-indigo-100">
                    {rt.code}
                  </Badge>
                  <h3 className="text-base font-bold text-gray-900 mt-1.5">{rt.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-gray-900">{formatCurrency(rt.baseRate)}</div>
                  <span className="text-[11px] text-gray-400">/ night base</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Max Guests</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{rt.maxOccupancy} Adults</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Inventory</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{rt.totalRooms} Units</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Floor Space</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{rt.size}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 font-medium mb-2.5">
                Bedding: <span className="text-gray-800">{rt.bedding}</span>
              </p>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Features</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {rt.amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[11px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Active in booking engine</span>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2">
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Edit Plan
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
