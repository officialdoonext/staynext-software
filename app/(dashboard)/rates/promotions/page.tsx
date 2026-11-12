import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Tag, Copy, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Promotions & Promo Codes | StayNext' }

const promotions = [
  { id: 'pro-1', code: 'DIRECT15', name: 'Direct Booking Engine Discount', discount: '15% Off', validUntil: 'Dec 31, 2026', totalUsed: 142, maxUses: 500, status: 'active' },
  { id: 'pro-2', code: 'LONGSTAY', name: 'Extended Stay (7+ Nights)', discount: '20% Off', validUntil: 'Ongoing', totalUsed: 38, maxUses: 'Unlimited', status: 'active' },
  { id: 'pro-3', code: 'EARLYBIRD', name: 'Book 30 Days in Advance', discount: '10% Off', validUntil: 'Dec 31, 2026', totalUsed: 89, maxUses: 'Unlimited', status: 'active' },
  { id: 'pro-4', code: 'VIPWELCOME', name: 'Complimentary Suite Upgrade', discount: 'Free Upgrade', validUntil: 'Nov 30, 2026', totalUsed: 12, maxUses: 25, status: 'expiring_soon' },
]

export default function PromotionsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rates">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Promotional Codes &amp; Special Offers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Incentivize direct bookings, early reservations, and extended stays with automated coupon codes.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Promo Code
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {promotions.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                  {p.code}
                </span>
                <span className="text-sm font-bold text-emerald-600">{p.discount}</span>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mt-3">{p.name}</h3>

              <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Redemptions:</span>
                  <strong className="text-gray-800">{p.totalUsed} uses</strong>
                </div>
                <div className="flex justify-between">
                  <span>Valid Until:</span>
                  <span className="text-gray-800">{p.validUntil}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2">
              <Badge variant={p.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                {p.status === 'active' ? 'Active' : 'Expiring Soon'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
