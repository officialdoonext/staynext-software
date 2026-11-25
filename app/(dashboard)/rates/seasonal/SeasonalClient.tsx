'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Calendar,
  TrendingUp,
  Download,
  Trash2,
  Search,
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
import { formatDate } from '@/lib/utils'
import {
  SeasonalRateRecord,
  createSeasonalRate,
  deleteSeasonalRate,
} from '@/services/rate.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SeasonalClientProps {
  initialRates: SeasonalRateRecord[]
  propertyId: string
}

export function SeasonalClient({ initialRates, propertyId }: SeasonalClientProps) {
  const router = useRouter()
  const [rates, setRates] = useState<SeasonalRateRecord[]>(initialRates)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split('T')[0],
    multiplier: '1.25',
  })

  const filtered = rates.filter((r) => {
    const q = searchTerm.toLowerCase()
    return !searchTerm || r.name.toLowerCase().includes(q)
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter a seasonal surge name')
      return
    }

    const mult = parseFloat(form.multiplier)
    if (!mult || mult <= 0) {
      toast.error('Multiplier must be greater than 0')
      return
    }

    setIsSubmitting(true)
    const res = await createSeasonalRate({
      propertyId,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      multiplier: mult,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Seasonal rate surge configured')
      setIsAddOpen(false)
      setForm({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          .toISOString()
          .split('T')[0],
        multiplier: '1.25',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create seasonal rate')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteSeasonalRate(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Seasonal rate removed')
      setRates((prev) => prev.filter((r) => r.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete seasonal rate')
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rates">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Seasonal Pricing Multipliers &amp; Surges
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated high season rate surges, weekend markups, and monsoon low-demand adjustments.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Seasonal Surge
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search season name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Seasonal Rates Configured</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Configure dynamic seasonal rules like Festive New Year (1.40x) or Summer Holiday High-Demand (1.25x).
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Configure First Surge
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Badge
                    variant={r.multiplier >= 1 ? 'outline' : 'secondary'}
                    className="font-mono text-xs text-[#5e2b9d] bg-[#f7f2fd] rounded-sm font-medium"
                  >
                    {r.multiplier}x Base Rate
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(r.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <h3 className="text-base font-medium text-gray-900 mt-2 font-sora">{r.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(r.startDate)} through {formatDate(r.endDate)}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Effective Impact:</span>
                  <strong className="font-mono text-gray-900">
                    {r.multiplier > 1
                      ? `+${Math.round((r.multiplier - 1) * 100)}% Surge`
                      : `${Math.round((1 - r.multiplier) * 100)}% Discount`}
                  </strong>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-medium">Auto-applied at Booking</span>
                <Badge variant="success" className="text-[10px] rounded-sm">
                  Active
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD SEASONAL RATE MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Add Seasonal Surge Multiplier</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Apply automated dynamic pricing multiplier across all room types for date periods.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Season / Event Name *</label>
              <input
                type="text"
                placeholder="e.g. Peak Summer Holidays, Diwali Festive Week"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rate Multiplier (e.g. 1.25 for +25%, 0.90 for -10%) *
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5.0"
                value={form.multiplier}
                onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save Surge'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Seasonal Rate</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove this seasonal pricing surge?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              className="text-xs cursor-pointer rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md font-medium"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

