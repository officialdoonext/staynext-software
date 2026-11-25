'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Tag,
  Plus,
  Calendar,
  Percent,
  ShieldCheck,
  Search,
  Trash2,
  Utensils,
  Layers,
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
import {
  RatePlanRecord,
  createRatePlan,
  deleteRatePlan,
} from '@/services/rate.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface RatesClientProps {
  initialPlans: RatePlanRecord[]
  propertyId: string
}

export function RatesClient({ initialPlans, propertyId }: RatesClientProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<RatePlanRecord[]>(initialPlans)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    mealPlan: 'ep' as 'ep' | 'cp' | 'map' | 'ap',
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    isRefundable: true,
    isDefault: false,
  })

  const filtered = plans.filter((p) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.mealPlan.toLowerCase().includes(q)
    )
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter a rate plan name')
      return
    }

    setIsSubmitting(true)
    const res = await createRatePlan({
      propertyId,
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      mealPlan: form.mealPlan,
      cancellationPolicy: form.cancellationPolicy.trim() || undefined,
      isRefundable: form.isRefundable,
      isDefault: form.isDefault,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Rate plan created successfully')
      setIsAddOpen(false)
      setForm({
        name: '',
        code: '',
        description: '',
        mealPlan: 'ep',
        cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
        isRefundable: true,
        isDefault: false,
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create rate plan')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteRatePlan(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Rate plan removed')
      setPlans((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete rate plan')
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Yield &amp; Rate Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dynamic pricing rules, seasonal rate multipliers, meal plan policies, and corporate negotiated contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rates/seasonal">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <Calendar className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Seasonal Multipliers
            </Button>
          </Link>
          <Link href="/rates/promotions">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <Percent className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Promotions &amp; Coupons
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Rate Plan
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rate plans, codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Rate Plans Defined</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Configure EP (Room Only), CP (Bed &amp; Breakfast), MAP (Half Board), or AP (Full Board) rate plans.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Rate Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] text-gray-600 bg-gray-50 rounded-sm">
                      {plan.code}
                    </Badge>
                    {plan.isDefault && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(plan.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <h3 className="text-base font-medium text-gray-900 mt-2 font-sora">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {plan.description || 'Flexible guest booking plan with meal entitlements.'}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Meal Plan:</span>
                    <strong className="uppercase font-mono text-[#5e2b9d]">
                      {plan.mealPlan === 'ep'
                        ? 'EP (Room Only)'
                        : plan.mealPlan === 'cp'
                        ? 'CP (Bed & Breakfast)'
                        : plan.mealPlan === 'map'
                        ? 'MAP (Half Board)'
                        : 'AP (Full Board)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Refund Policy:</span>
                    <span>{plan.isRefundable ? 'Refundable' : 'Non-Refundable'}</span>
                  </div>
                  {plan.cancellationPolicy && (
                    <div className="pt-1 text-[11px] text-gray-400 italic">
                      {plan.cancellationPolicy}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-medium">Active on Booking Engine</span>
                <Badge variant="success" className="text-[10px] rounded-sm">
                  Live
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE RATE PLAN MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Create Rate Plan</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Define meal plan packaging, cancellation terms, and tariff codes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rate Plan Name *</label>
              <input
                type="text"
                placeholder="e.g. Best Available Rate with Breakfast"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rate Code</label>
                <input
                  type="text"
                  placeholder="e.g. BAR-BB"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meal Package</label>
                <select
                  value={form.mealPlan}
                  onChange={(e) => setForm({ ...form, mealPlan: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="ep">EP - European Plan (Room Only)</option>
                  <option value="cp">CP - Continental Plan (Breakfast)</option>
                  <option value="map">MAP - Modified American (Breakfast + Lunch/Dinner)</option>
                  <option value="ap">AP - American Plan (All Meals)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cancellation Policy</label>
              <input
                type="text"
                placeholder="e.g. Free cancellation up to 48 hours before check-in"
                value={form.cancellationPolicy}
                onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRefundable}
                  onChange={(e) => setForm({ ...form, isRefundable: e.target.checked })}
                  className="rounded text-[#5e2b9d]"
                />
                <span>Refundable Rate Plan</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded text-[#5e2b9d]"
                />
                <span>Set as Default Rate Plan for Reservations</span>
              </label>
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
                {isSubmitting ? 'Saving...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Rate Plan</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this rate plan? Existing bookings will preserve their contracted price.
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

