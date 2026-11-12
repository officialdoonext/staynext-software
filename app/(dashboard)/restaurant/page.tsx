import React from 'react'
import { UtensilsCrossed, Plus, Coffee, Wine, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Restaurant & POS | StayNext' }

const activeOrders = [
  { id: 'ord-101', table: 'Table 4', roomCharge: 'Room #201', guest: 'Sophia Montgomery', items: 'Grilled Salmon x2, Pinot Noir x1', amount: 86.00, status: 'served', time: '12:30 PM' },
  { id: 'ord-102', table: 'Table 9', roomCharge: 'None (Walk-in)', guest: 'Table Dining Guest', items: 'Prime Ribeye x1, Truffle Fries x1', amount: 64.50, status: 'kitchen_prep', time: '12:45 PM' },
  { id: 'ord-103', table: 'Room Service', roomCharge: 'Room #102', guest: 'Liam Gallagher', items: 'Club Sandwich, Iced Americano', amount: 32.00, status: 'dispatched', time: '12:50 PM' },
  { id: 'ord-104', table: 'Table 2', roomCharge: 'Room #304', guest: 'David Chen', items: 'Caesar Salad, Sparkling Water', amount: 24.00, status: 'bill_printed', time: '12:15 PM' },
]

export default function RestaurantPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Restaurant POS &amp; F&amp;B Console
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Table management, kitchen order tickets (KOT), room service billing, and menu catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            New POS Order
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Today&apos;s F&amp;B Revenue</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(1420)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">38 orders processed</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Table Occupancy</span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">75% (9/12)</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Main Dining Room &amp; Patio</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Room Service Orders</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">8 Orders</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Direct folio charge enabled</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Kitchen Prep Time</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">14 mins</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Average ticket completion</p>
        </div>
      </div>

      {/* Active Orders List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Active Kitchen Orders &amp; Tables</h3>
          <span className="text-xs text-gray-400">Live KOT Display</span>
        </div>

        <div className="divide-y divide-gray-100">
          {activeOrders.map((ord) => (
            <div key={ord.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                  {ord.table}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900">{ord.guest}</p>
                    <span className="text-[11px] text-gray-400">&bull; {ord.roomCharge}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 font-medium">{ord.items}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-900 block">{formatCurrency(ord.amount)}</span>
                  <span className="text-[10px] text-gray-400">{ord.time}</span>
                </div>
                <Badge variant={ord.status === 'served' ? 'success' : ord.status === 'dispatched' ? 'purple' : 'warning'} className="capitalize text-[10px]">
                  {ord.status.replace('_', ' ')}
                </Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Folio Bill
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

