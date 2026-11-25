'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Percent,
  Download,
  Trash2,
  Calendar,
  Search,
  Tag,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import {
  RatePromotionRecord,
  createRatePromotion,
  deleteRatePromotion,
} from '@/services/rate.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PromotionsClientProps {
  initialPromotions: RatePromotionRecord[]
  propertyId: string
}

export function PromotionsClient({ initialPromotions, propertyId }: PromotionsClientProps) {
  const router = useRouter()
  const [promotions, setPromotions] = useState<RatePromotionRecord[]>(initialPromotions)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '10',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3))
      .toISOString()
      .split('T')[0],
    minBookingAmount: '0',
    usageLimit: '100',
  })

  const filtered = promotions.filter((p) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    )
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Please enter a coupon code and campaign name')
      return
    }

    const val = parseFloat(form.discountValue)
    if (!val || val <= 0) {
      toast.error('Discount value must be greater than 0')
      return
    }

    setIsSubmitting(true)
    const res = await createRatePromotion({
      propertyId,
      code: form.code,
      name: form.name.trim(),
      discountType: form.discountType,
      discountValue: val,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      minBookingAmount: parseFloat(form.minBookingAmount) || 0,
      usageLimit: parseInt(form.usageLimit) || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Promotional coupon created')
      setIsAddOpen(false)
      setForm({
        code: '',
        name: '',
        discountType: 'percentage',
        discountValue: '10',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3))
          .toISOString()
          .split('T')[0],
        minBookingAmount: '0',
        usageLimit: '100',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create promo')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteRatePromotion(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Promotion deleted')
      setPromotions((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete promotion')
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
              Promotional Codes &amp; Coupons
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Seasonal promo codes, flash sale discounts, and guest booking engine vouchers.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Promo Code
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupon code, campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Percent className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Active Promotions</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Create discount vouchers like SUMMER15 or EARLYBIRD for guests on your direct booking website.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Coupon
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((promo) => (
            <div
              key={promo.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-xs text-[#5e2b9d] bg-[#f7f2fd] rounded-sm font-medium">
                    {promo.code}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(promo.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <h3 className="text-base font-medium text-gray-900 mt-2 font-sora">{promo.name}</h3>
                <p className="text-lg font-medium text-emerald-600 mt-1 font-mono">
                  {promo.discountType === 'percentage'
                    ? `${promo.discountValue}% OFF`
                    : `${formatCurrency(promo.discountValue)} OFF`}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                  {promo.validFrom && promo.validUntil && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        {formatDate(promo.validFrom)} - {formatDate(promo.validUntil)}
                      </span>
                    </div>
                  )}
                  {promo.minBookingAmount > 0 && (
                    <div>Min Booking: {formatCurrency(promo.minBookingAmount)}</div>
                  )}
                  <div>Redemptions: {promo.usedCount} times applied</div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-medium">Active on Checkout</span>
                <Badge variant="success" className="text-[10px] rounded-sm">
                  Live
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PROMOTION MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Create Promotion Coupon</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Provide coupon voucher code, discount amount, and validity dates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER15"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Holiday Special"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                <SearchableSelect
                  value={form.discountType}
                  onChange={(val) => setForm({ ...form, discountType: val as any })}
                  options={[
                    { value: 'percentage', label: 'Percentage Discount (%)' },
                    { value: 'fixed', label: 'Fixed Cash Voucher ($)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value ({form.discountType === 'percentage' ? '%' : '$'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="15"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valid From</label>
                <CustomDatePicker
                  value={form.validFrom}
                  onChange={(val) => setForm({ ...form, validFrom: val })}
                  placeholder="Select valid from..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until</label>
                <CustomDatePicker
                  value={form.validUntil}
                  onChange={(val) => setForm({ ...form, validUntil: val })}
                  placeholder="Select valid until..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Booking ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.minBookingAmount}
                  onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Redemptions</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
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
                {isSubmitting ? 'Saving...' : 'Create Promo Code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Promo Code</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this promotional coupon?
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

