import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, UtensilsCrossed, Edit2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Restaurant & Room Service Menu | StayNext' }

const menuItems = [
  { id: 'm-1', name: 'Artisan Avocado Toast & Poached Egg', category: 'Breakfast', price: 18.00, cost: 4.50, roomService: true, status: 'available' },
  { id: 'm-2', name: 'Coastal Lobster Benedict', category: 'Breakfast', price: 28.00, cost: 8.50, roomService: true, status: 'available' },
  { id: 'm-3', name: 'Grilled Wagyu Burger & Truffle Fries', category: 'Lunch & Dinner', price: 32.00, cost: 9.00, roomService: true, status: 'available' },
  { id: 'm-4', name: 'Pan-Seared Pacific Salmon', category: 'Lunch & Dinner', price: 38.00, cost: 11.50, roomService: true, status: 'available' },
  { id: 'm-5', name: 'Wild Mushroom Risotto', category: 'Lunch & Dinner', price: 26.00, cost: 6.00, roomService: true, status: 'available' },
  { id: 'm-6', name: 'Signature Espresso Martini', category: 'Beverages & Bar', price: 19.00, cost: 3.50, roomService: false, status: 'available' },
  { id: 'm-7', name: 'Freshly Pressed Green Detox Juice', category: 'Beverages & Bar', price: 12.00, cost: 2.50, roomService: true, status: 'available' },
  { id: 'm-8', name: 'Madagascar Vanilla Bean Panna Cotta', category: 'Desserts', price: 16.00, cost: 3.20, roomService: true, status: 'sold_out' },
]

export default function RestaurantMenuPage() {
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
              Restaurant &amp; Room Service Menu
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Menu catalog, kitchen recipe cost calculation, room service eligibility, and live 86 / sold out status.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Menu Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400">{item.category}</span>
                <span className="text-base font-bold font-mono text-gray-900">{formatCurrency(item.price)}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mt-2">{item.name}</h3>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Food Cost: {formatCurrency(item.cost)}</span>
                <span className="font-semibold text-emerald-600">
                  {Math.round(((item.price - item.cost) / item.price) * 100)}% margin
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <Badge variant={item.status === 'available' ? 'success' : 'destructive'} className="text-[10px]">
                {item.status === 'available' ? 'Available' : 'Sold Out (86)'}
              </Badge>
              {item.roomService && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Room Service
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
