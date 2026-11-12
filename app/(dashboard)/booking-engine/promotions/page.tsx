import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Globe, Tag, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Direct Booking Engine Promotions | StayNext' }

const enginePromos = [
  { id: 'be-1', title: 'Direct Website Best Rate Guarantee (BRG)', discount: '10% Instant Cash Discount', code: 'BOOKDIRECT', displayPill: 'Best Rate Guaranteed', active: true },
  { id: 'be-2', title: 'Complimentary Valet Parking & Welcome Cocktail', discount: 'Free Valet ($45 value)', code: 'VALETFREE', displayPill: 'Free Perks Included', active: true },
  { id: 'be-3', title: 'Late Checkout 2:00 PM Guarantee', discount: 'Free Late Checkout', code: 'LATEOUT', displayPill: 'Stay Longer', active: true },
  { id: 'be-4', title: 'Suite Summer Escapes (3+ Nights)', discount: '20% off Villas & Suites', code: 'SUMMERVILLA', displayPill: 'Limited Time', active: false },
]

export default function BookingEnginePromotionsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/booking-engine">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Direct Website Perks &amp; Conversion Banners
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Motivate travelers to book directly on your hotel website instead of paying 15-20% OTA commissions.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Direct Perk
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enginePromos.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{p.title}</h3>
                  <p className="text-sm font-semibold text-emerald-600 mt-1">{p.discount}</p>
                </div>
                <Badge variant={p.active ? 'success' : 'outline'} className="text-[10px]">
                  {p.active ? 'Visible on Website' : 'Paused'}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>Direct Promo Code: <strong className="font-mono text-indigo-600">{p.code}</strong></span>
                <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium text-gray-700">{p.displayPill}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Shown in direct booking engine widget</span>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                Configure Banner
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
