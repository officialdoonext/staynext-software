import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Globe, Percent, Building2, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Travel Agencies & OTA Commissions | StayNext' }

const agencies = [
  { id: 'agt-1', name: 'Booking.com (OTA Direct)', iata: 'OTA-BKG', commission: '15.0%', ytdRevenue: 48500, pendingPayout: 3200, status: 'active' },
  { id: 'agt-2', name: 'Expedia Partner Solutions', iata: 'OTA-EXP', commission: '18.0%', ytdRevenue: 34200, pendingPayout: 2150, status: 'active' },
  { id: 'agt-3', name: 'American Express Global Business Travel', iata: 'IATA-098124', commission: '10.0%', ytdRevenue: 62000, pendingPayout: 1800, status: 'active' },
  { id: 'agt-4', name: 'Carlson Wagonlit Travel (CWT)', iata: 'IATA-448102', commission: '10.0%', ytdRevenue: 29000, pendingPayout: 950, status: 'active' },
]

export default function TravelAgentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/corporate">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Travel Agencies &amp; Commission Ledgers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              IATA / ARC registered agencies, negotiated commission splits, and pending commission settlement ledgers.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Agency Partner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agencies.map((a) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{a.name}</h3>
                  <Badge variant="outline" className="font-mono text-[10px] bg-gray-50 text-gray-600 mt-1">
                    {a.iata}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">Commission</span>
                  <div className="text-base font-bold text-indigo-600">{a.commission}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4 py-3 border-y border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">YTD Bookings Gross</span>
                  <p className="text-sm font-bold font-mono text-gray-900 mt-0.5">{formatCurrency(a.ytdRevenue)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Pending Commission Payout</span>
                  <p className="text-sm font-bold font-mono text-amber-600 mt-0.5">{formatCurrency(a.pendingPayout)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="success" className="text-[10px]">
                Direct Channel Synced
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                Reconcile Payout &rarr;
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
