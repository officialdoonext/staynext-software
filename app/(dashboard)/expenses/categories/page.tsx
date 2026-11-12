import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, FolderTree, Tag, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Expense Categories | StayNext' }

const categories = [
  { id: 'cat-1', name: 'Housekeeping & Guest Supplies', code: 'EXP-HK', budget: 4500, spent: 3200, count: 24, description: 'Linen, toiletries, cleaning chemicals, amenities' },
  { id: 'cat-2', name: 'Food & Beverage Provisions', code: 'EXP-FB', budget: 12000, spent: 9840, count: 48, description: 'Fresh produce, meat, dairy, coffee, alcoholic beverages' },
  { id: 'cat-3', name: 'Utilities & Power', code: 'EXP-UTL', budget: 6000, spent: 4850, count: 6, description: 'Electricity, municipal water, natural gas, high-speed fiber' },
  { id: 'cat-4', name: 'Maintenance & Engineering', code: 'EXP-MNT', budget: 3500, spent: 1620, count: 14, description: 'HVAC parts, plumbing hardware, lightbulbs, elevator service' },
  { id: 'cat-5', name: 'Marketing & Commissions', code: 'EXP-MKT', budget: 8000, spent: 6100, count: 8, description: 'OTA commissions, Google Ads, local brochures, influencer stays' },
  { id: 'cat-6', name: 'Administrative & SaaS', code: 'EXP-ADM', budget: 2500, spent: 1890, count: 12, description: 'PMS software license, accounting software, merchant fees' },
]

export default function ExpenseCategoriesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/expenses">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Expense Categories &amp; Cost Centers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Organize hotel operating expenditure into ledger categories with monthly budget caps.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const percentSpent = Math.round((cat.spent / cat.budget) * 100)
          return (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] text-gray-600 bg-gray-50">
                    {cat.code}
                  </Badge>
                  <span className="text-xs text-gray-400">{cat.count} transactions</span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-2">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">
                      Spent: <strong className="text-gray-900 font-mono">{formatCurrency(cat.spent)}</strong>
                    </span>
                    <span className="text-gray-400">
                      Budget: <span className="font-mono">{formatCurrency(cat.budget)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${percentSpent > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(percentSpent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{percentSpent}% of budget used</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(cat.budget - cat.spent)} remaining</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
