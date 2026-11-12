import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, UtensilsCrossed, DollarSign, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Restaurant & F&B Reports | StayNext' }

const itemPerformance = [
  { rank: 1, name: 'Pan-Seared Pacific Salmon', category: 'Dinner', unitsSold: 84, revenue: 3192.00, profitMargin: '69.7%' },
  { rank: 2, name: 'Grilled Wagyu Burger & Truffle Fries', category: 'Lunch/Dinner', unitsSold: 76, revenue: 2432.00, profitMargin: '71.8%' },
  { rank: 3, name: 'Artisan Avocado Toast', category: 'Breakfast', unitsSold: 112, revenue: 2016.00, profitMargin: '75.0%' },
  { rank: 4, name: 'Signature Espresso Martini', category: 'Bar', unitsSold: 95, revenue: 1805.00, profitMargin: '81.5%' },
  { rank: 5, name: 'Coastal Lobster Benedict', category: 'Breakfast', unitsSold: 58, revenue: 1624.00, profitMargin: '69.6%' },
]

export default function RestaurantReportsPage() {
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
              Food &amp; Beverage Sales Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Daily covers, average spend per guest (RevPASH), room service charge ratios, and menu profitability.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export F&amp;B P&amp;L
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Today&apos;s F&amp;B Revenue</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(3420)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">↑ 14% vs yesterday</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Total Covers (Guests)</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">94 Covers</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Avg spend: $36.38 / guest</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Room Service Volume</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">32 Orders</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">42% of total F&amp;B revenue</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Average Kitchen Prep Time</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">16 mins</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Target &lt; 20 mins</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Top Performing Menu Items (This Week)</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Units Sold</TableHead>
              <TableHead>Gross Revenue</TableHead>
              <TableHead className="text-right">Gross Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemPerformance.map((item) => (
              <TableRow key={item.rank}>
                <TableCell className="font-mono text-xs font-bold text-gray-400">#{item.rank}</TableCell>
                <TableCell className="font-semibold text-gray-900 text-xs">{item.name}</TableCell>
                <TableCell className="text-xs text-gray-600">{item.category}</TableCell>
                <TableCell className="text-xs font-mono">{item.unitsSold}</TableCell>
                <TableCell className="text-xs font-bold font-mono text-gray-900">{formatCurrency(item.revenue)}</TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">{item.profitMargin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
