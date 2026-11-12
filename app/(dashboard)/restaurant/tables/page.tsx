import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Restaurant Dining Tables & Seating | StayNext' }

const tables = [
  { number: 'T-01', capacity: 2, zone: 'Oceanfront Terrace', status: 'occupied', guests: 'Table of 2', server: 'Marco', orderTotal: '$68.00' },
  { number: 'T-02', capacity: 2, zone: 'Oceanfront Terrace', status: 'available', guests: null, server: 'Marco', orderTotal: null },
  { number: 'T-03', capacity: 4, zone: 'Oceanfront Terrace', status: 'reserved', guests: 'Vance Party (7:30 PM)', server: 'Marco', orderTotal: null },
  { number: 'T-04', capacity: 4, zone: 'Main Dining Hall', status: 'occupied', guests: 'Jenkins Family', server: 'Lisa', orderTotal: '$142.50' },
  { number: 'T-05', capacity: 6, zone: 'Main Dining Hall', status: 'occupied', guests: 'Corporate Dinner', server: 'Lisa', orderTotal: '$310.00' },
  { number: 'T-06', capacity: 4, zone: 'Main Dining Hall', status: 'available', guests: null, server: 'Lisa', orderTotal: null },
  { number: 'T-07', capacity: 2, zone: 'Cocktail Lounge', status: 'occupied', guests: 'Room 201 Guest', server: 'Antoine', orderTotal: '$38.00' },
  { number: 'T-08', capacity: 8, zone: 'Private Dining Cellar', status: 'reserved', guests: 'VIP Tasting (8:00 PM)', server: 'Antoine', orderTotal: null },
]

export default function RestaurantTablesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/restaurant">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Dining Room Tables &amp; Seating Layout
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live dining floor map, active restaurant tickets, assigned waitstaff, and reservation covers.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Seat Walk-in Party
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((tbl) => (
          <div
            key={tbl.number}
            className={`bg-white border rounded-lg p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
              tbl.status === 'occupied' ? 'border-indigo-200' : tbl.status === 'reserved' ? 'border-purple-200' : 'border-gray-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-gray-900">{tbl.number}</span>
                  <p className="text-xs text-gray-500 font-medium">{tbl.zone}</p>
                </div>
                <Badge
                  variant={tbl.status === 'occupied' ? 'purple' : tbl.status === 'reserved' ? 'info' : 'success'}
                  className="text-[10px]"
                >
                  {tbl.status === 'occupied' ? 'Seated' : tbl.status === 'reserved' ? 'Booked' : 'Open'}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Capacity:</span>
                  <strong className="text-gray-900">{tbl.capacity} Tops</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Party:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[130px]">{tbl.guests || 'None'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Server:</span>
                  <span className="text-gray-800">{tbl.server}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Running Total:</span>
              <span className="font-mono font-bold text-gray-900">{tbl.orderTotal || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
