import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Globe, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Channel Manager & OTA Sync | StayNext' }

const channels = [
  { id: 'ch-1', name: 'Booking.com API', code: 'BKG-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '1 minute ago', activeListings: 18, syncErrors: 0 },
  { id: 'ch-2', name: 'Expedia Partner Central', code: 'EXP-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '3 minutes ago', activeListings: 18, syncErrors: 0 },
  { id: 'ch-3', name: 'Airbnb Host Channel', code: 'ABNB-ICAL', status: 'connected', syncFrequency: '15 min poll', lastSynced: '12 minutes ago', activeListings: 8, syncErrors: 0 },
  { id: 'ch-4', name: 'Agoda YCS Network', code: 'AGD-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '5 minutes ago', activeListings: 18, syncErrors: 0 },
  { id: 'ch-5', name: 'TripAdvisor Instant Booking', code: 'TA-DIRECT', status: 'pending_setup', syncFrequency: 'Hourly', lastSynced: 'Never', activeListings: 0, syncErrors: 0 },
]

export default function ChannelManagerPage() {
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
              Channel Manager &amp; 2-Way OTA Synchronization
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Prevent overbooking with instant real-time rate &amp; availability synchronization across global distribution channels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Force Full Sync
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Connect New OTA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <div key={ch.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{ch.name}</h3>
                  <Badge variant="outline" className="font-mono text-[10px] bg-gray-50 mt-1">
                    {ch.code}
                  </Badge>
                </div>
                <Badge variant={ch.status === 'connected' ? 'success' : 'outline'} className="text-[10px]">
                  {ch.status === 'connected' ? 'Live & Synced' : 'Action Required'}
                </Badge>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sync Mode:</span>
                  <strong className="text-gray-800">{ch.syncFrequency}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Synced:</span>
                  <span className="text-gray-800 font-mono">{ch.lastSynced}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Synced Room Inventory:</span>
                  <strong className="text-gray-900">{ch.activeListings} Room Types</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 0 Sync Conflicts
              </span>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                Mapping &rarr;
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
