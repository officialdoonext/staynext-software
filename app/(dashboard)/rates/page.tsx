import React from 'react'
import { Tag, Plus, Calendar, DollarSign, Percent, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Rate Management | StayNext' }

const ratePlans = [
  { id: 'rp-1', name: 'Best Flexible Rate (BAR)', code: 'BAR', mealPlan: 'Room Only (EP)', cancellation: 'Free cancellation up to 24h prior', isDefault: true, multiplier: '1.0x', active: true },
  { id: 'rp-2', name: 'Bed & Breakfast Package', code: 'BB', mealPlan: 'Continental Breakfast (CP)', cancellation: 'Free cancellation up to 48h prior', isDefault: false, multiplier: '1.15x', active: true },
  { id: 'rp-3', name: 'Non-Refundable Advance Purchase', code: 'NONREF', mealPlan: 'Room Only (EP)', cancellation: '100% non-refundable, prepaid', isDefault: false, multiplier: '0.85x (-15%)', active: true },
  { id: 'rp-4', name: 'Weekend Escape Promotion', code: 'WKND', mealPlan: 'Buffet Breakfast + Late Checkout', cancellation: 'Non-refundable', isDefault: false, multiplier: '1.20x', active: true },
  { id: 'rp-5', name: 'Corporate Negotiated Tier 1', code: 'CORP1', mealPlan: 'Breakfast + High-speed WiFi', cancellation: 'Same day 6 PM cancellation', isDefault: false, multiplier: 'Fixed $180/nt', active: true },
]

export default function RatesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Yield &amp; Rate Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dynamic pricing rules, seasonal rate multipliers, meal plan policies, and corporate negotiated contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Rate Plan
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <Tag className="h-5 w-5" />
            <span className="text-xs font-semibold">Active Rate Plans</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">5 Plans</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Primary pricing: Best Available Rate (BAR)</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <Percent className="h-5 w-5" />
            <span className="text-xs font-semibold">Weekend Pricing Surge</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">+20% Multiplier</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Applied automatically Friday &amp; Saturday</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-semibold">Peak Holiday Season</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">Active in 34 Days</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Winter Peak Surge: +35% across all room types</p>
        </div>
      </div>

      {/* Rate Plans List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Configured Rate Plans</h3>
          <span className="text-xs text-gray-400">Synced to Booking Engine &amp; OTAs</span>
        </div>

        <div className="divide-y divide-gray-100">
          {ratePlans.map((plan) => (
            <div key={plan.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">{plan.name}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {plan.code}
                  </Badge>
                  {plan.isDefault && (
                    <Badge variant="purple" className="text-[10px]">
                      Default BAR
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Meal Plan: <strong>{plan.mealPlan}</strong> &bull; Policy: {plan.cancellation}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-gray-400 block text-right">Pricing Multiplier</span>
                  <span className="font-mono font-bold text-sm text-indigo-600">{plan.multiplier}</span>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  Edit Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

