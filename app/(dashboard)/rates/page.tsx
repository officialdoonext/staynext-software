import React from 'react'
import { Tag, Plus, Calendar, DollarSign, Percent, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Rate Management | StayNext' }

export default async function RatesPage() {
  const supabase = await createClient()

  let ratePlans: any[] = []
  try {
    const { data } = await supabase
      .from('rate_plans')
      .select('*')
      .order('name', { ascending: true })

    if (data) {
      ratePlans = data.map((rp: any) => ({
        id: rp.id,
        name: rp.name,
        code: rp.code || 'BAR',
        mealPlan: rp.meal_plan ? rp.meal_plan.toUpperCase() : 'Room Only',
        cancellation: rp.cancellation_policy || 'Standard cancellation policy',
        isDefault: rp.is_default || false,
        active: rp.is_active,
      }))
    }
  } catch {}

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
      </div>

      {ratePlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Rate Plans Defined</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Configure dynamic rate plans, weekend pricing surges, and meal package inclusions.
          </p>
        </div>
      ) : (
        /* Rate Plans List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ratePlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs hover:border-[#dfcef6] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                    <span className="font-mono text-[10px] text-gray-400 font-semibold">{plan.code}</span>
                  </div>
                  {plan.isDefault && (
                    <Badge variant="purple" className="text-[10px]">
                      Primary Rate Plan
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 py-3 border-t border-gray-100 text-xs text-gray-600">
                  <p>
                    <strong className="text-gray-900">Meal Plan:</strong> {plan.mealPlan}
                  </p>
                  <p>
                    <strong className="text-gray-900">Cancellation:</strong> {plan.cancellation}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Badge variant={plan.active ? 'success' : 'secondary'}>
                  {plan.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
