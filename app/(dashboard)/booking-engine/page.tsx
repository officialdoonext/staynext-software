import React from 'react'
import { Globe, Plus, CheckCircle2, RefreshCw, Key, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Direct Booking Engine & Channels | StayNext' }

const channels = [
  { id: 'ch-1', name: 'Direct Website Engine', type: 'Direct Widget', status: 'connected', latency: 'Instant', syncRate: '100%' },
  { id: 'ch-2', name: 'Booking.com API v2', type: 'OTA 2-Way Sync', status: 'connected', latency: '< 2s', syncRate: '99.8%' },
  { id: 'ch-3', name: 'Expedia Partner Central', type: 'OTA 2-Way Sync', status: 'connected', latency: '< 5s', syncRate: '99.9%' },
  { id: 'ch-4', name: 'Agoda Connectivity Partner', type: 'OTA 2-Way Sync', status: 'connected', latency: '< 4s', syncRate: '99.7%' },
  { id: 'ch-5', name: 'Airbnb Host Channel API', type: 'OTA 2-Way Sync', status: 'connected', latency: '< 8s', syncRate: '99.5%' },
]

export default function BookingEnginePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Booking Engine &amp; Channel Manager
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Zero-commission direct booking widget, coupon discounts, and real-time 2-way OTA rate &amp; availability sync.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Force Full Sync
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Globe className="h-4 w-4 mr-1.5" />
            Direct Engine Preview
          </Button>
        </div>
      </div>

      {/* Direct Booking Widget Configuration Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Embedded Direct Booking Engine</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Embed on your official hotel website to accept 0% commission direct reservations.</p>
            </div>
            <Badge variant="success">Widget Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              readOnly
              value='<script src="https://cdn.staynext.com/v1/booking-widget.js" data-property="prop-horizon-01"></script>'
              className="font-mono text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-md w-full text-gray-700"
            />
            <Button size="sm" variant="outline" className="text-xs shrink-0">
              Copy Embed Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Channels List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Connected 2-Way OTA Distribution Channels</h3>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> All Feeds Synchronized
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {channels.map((ch) => (
            <div key={ch.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{ch.name}</p>
                  <p className="text-[11px] text-gray-400">{ch.type} &bull; Sync Latency: {ch.latency}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-emerald-600">Reliability: {ch.syncRate}</span>
                <Badge variant="success" className="capitalize text-[10px]">
                  {ch.status}
                </Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Channel Mapping
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

