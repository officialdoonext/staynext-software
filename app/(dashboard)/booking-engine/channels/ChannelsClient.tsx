'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Channel {
  id: string
  name: string
  code: string
  status: 'connected' | 'disconnected' | 'syncing'
  syncFrequency: string
  lastSynced: string
  activeListings: number
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'ch-1', name: 'Booking.com XML Connectivity', code: 'BKG-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: 'Just now', activeListings: 18 },
  { id: 'ch-2', name: 'Expedia Partner Central', code: 'EXP-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '2 mins ago', activeListings: 18 },
  { id: 'ch-3', name: 'Airbnb Host Channel API', code: 'ABNB-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '5 mins ago', activeListings: 12 },
  { id: 'ch-4', name: 'Agoda YCS Partner API', code: 'AGD-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '8 mins ago', activeListings: 18 },
  { id: 'ch-5', name: 'MakeMyTrip / Goibibo IngoMMT', code: 'MMT-API', status: 'connected', syncFrequency: 'Instant 2-way', lastSynced: '10 mins ago', activeListings: 18 },
  { id: 'ch-6', name: 'TripAdvisor Instant Booking', code: 'TA-CONNECT', status: 'disconnected', syncFrequency: 'Hourly Poll', lastSynced: 'Never', activeListings: 0 },
]

export function ChannelsClient() {
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [connectName, setConnectName] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSyncChannel = (chId: string) => {
    setSyncingId(chId)
    setTimeout(() => {
      setSyncingId(null)
      setChannels((prev) =>
        prev.map((c) => (c.id === chId ? { ...c, lastSynced: 'Just now', status: 'connected' } : c))
      )
      toast.success('Channel rates and inventory synchronized!')
    }, 1000)
  }

  const handleToggleChannel = (chId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === chId
          ? {
              ...c,
              status: c.status === 'connected' ? 'disconnected' : 'connected',
            }
          : c
      )
    )
    toast.info('Channel status updated')
  }

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!connectName.trim()) {
      toast.error('Please enter channel name')
      return
    }

    const newCh: Channel = {
      id: `ch-${Date.now()}`,
      name: connectName.trim(),
      code: `OTA-${connectName.slice(0, 3).toUpperCase()}`,
      status: 'connected',
      syncFrequency: 'Instant 2-way',
      lastSynced: 'Just now',
      activeListings: 18,
    }

    setChannels([...channels, newCh])
    setIsConnectOpen(false)
    setConnectName('')
    setApiKey('')
    toast.success('New OTA Channel integrated successfully!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/booking-engine">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Channel Manager &amp; 2-Way OTA Synchronization
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Prevent overbooking with instant real-time rate &amp; availability synchronization across global distribution channels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsConnectOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Connect New OTA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 font-sora">{ch.name}</h3>
                  <Badge variant="outline" className="font-mono text-[10px] bg-gray-50 mt-1 rounded-sm">
                    {ch.code}
                  </Badge>
                </div>
                <Badge
                  variant={ch.status === 'connected' ? 'success' : 'outline'}
                  className="text-[10px] rounded-sm capitalize"
                >
                  {ch.status}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Sync Protocol:</span>
                  <span className="font-medium text-gray-900">{ch.syncFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="text-gray-700">{ch.lastSynced}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Listings:</span>
                  <span className="font-medium text-[#5e2b9d]">{ch.activeListings} Room Types</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleToggleChannel(ch.id)}
                className={`text-xs px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  ch.status === 'connected'
                    ? 'text-gray-600 hover:text-gray-900 bg-gray-100'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {ch.status === 'connected' ? 'Pause Sync' : 'Resume'}
              </button>
              <Button
                variant="outline"
                size="sm"
                disabled={syncingId === ch.id}
                onClick={() => handleSyncChannel(ch.id)}
                className="h-7 text-xs border-gray-200 text-[#5e2b9d] hover:bg-[#f7f2fd] cursor-pointer rounded-md font-medium"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${syncingId === ch.id ? 'animate-spin' : ''}`} />
                {syncingId === ch.id ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CONNECT NEW OTA MODAL */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Connect Distribution Partner</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Provide OTA partner details and API hotel ID / authentication credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConnectSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">OTA Platform *</label>
              <input
                type="text"
                placeholder="e.g. Google Hotel Ads, Yatra, Hostelworld"
                value={connectName}
                onChange={(e) => setConnectName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hotel Property ID / API Key</label>
              <input
                type="text"
                placeholder="e.g. BKG-HOTEL-84920"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConnectOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                Establish 2-Way Connection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
