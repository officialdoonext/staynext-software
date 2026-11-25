'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  TaxRateData,
  PropertySettingsData,
  createTaxRate,
  deleteTaxRate,
} from '@/services/settings.service'
import { toast } from 'sonner'

interface TaxesAndBillingClientProps {
  property: PropertySettingsData | null
  taxRates: TaxRateData[]
}

export function TaxesAndBillingClient({
  property,
  taxRates: initialTaxRates,
}: TaxesAndBillingClientProps) {
  const [taxRates, setTaxRates] = useState<TaxRateData[]>(initialTaxRates)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [ratePercentage, setRatePercentage] = useState('')
  const [code, setCode] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Deletion modal
  const [deleteTarget, setDeleteTarget] = useState<TaxRateData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property?.id) {
      toast.error('No property loaded')
      return
    }

    const rateNum = parseFloat(ratePercentage)
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      toast.error('Please enter a valid tax percentage between 0 and 100')
      return
    }

    setIsSubmitting(true)
    const res = await createTaxRate(property.id, {
      name,
      ratePercentage: rateNum,
      code: code || `TAX-${Math.round(rateNum)}`,
      isDefault,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Statutory tax rate registered')
      setIsAddOpen(false)
      setName('')
      setRatePercentage('')
      setCode('')
      setIsDefault(false)
      // Optimistic update
      setTaxRates([
        ...taxRates,
        {
          id: Math.random().toString(),
          propertyId: property.id,
          name,
          ratePercentage: rateNum,
          code: code || `TAX-${Math.round(rateNum)}`,
          isDefault,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ])
    } else {
      toast.error(res.error || 'Failed to save tax rate')
    }
  }

  const handleDeleteTax = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    const res = await deleteTaxRate(deleteTarget.id)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Tax rate removed')
      setTaxRates(taxRates.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } else {
      toast.error(res.error || 'Failed to delete tax rate')
    }
  }

  const tenant = property?.tenant

  return (
    <div className="space-y-6 w-full pb-16 font-sora">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900">
              Statutory Taxes &amp; SaaS Subscription
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage Indian GST rates (SAC 9963 / 5% / 12% / 18%) and current PMS SaaS subscription tier.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium px-4 cursor-pointer rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Tax Rate
        </Button>
      </div>

      {/* SaaS Subscription Card */}
      {tenant && (
        <Card className="border-[#eee4fa] bg-[#f7f2fd]/30 shadow-2xs rounded-md">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={tenant.isActive ? 'success' : 'outline'}
                    className="text-xs rounded-sm"
                  >
                    {tenant.isActive ? 'Active Subscription' : 'Pending Activation'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Expiry:{' '}
                    {tenant.subscriptionExpiresAt
                      ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString()
                      : 'Lifetime'}
                  </span>
                </div>
                <h2 className="text-lg font-medium text-gray-900 mt-2">
                  StayNext Enterprise PMS &bull; {property?.name}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Tenant status: <span className="font-semibold">{tenant.status}</span> &bull; Allowed Properties: <span className="font-semibold text-[#5e2b9d]">{tenant.allowedPropertiesCount}</span> &bull; Cloud Database: Supabase PostgreSQL RLS Isolated
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl font-medium font-mono text-gray-900">
                  {tenant.subscriptionPlan.toUpperCase()} TIER
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">Multi-Property SaaS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statutory Tax Rates Table */}
      <Card className="border-gray-200 shadow-2xs rounded-md overflow-hidden">
        <CardHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#5e2b9d]" />
              <CardTitle className="text-sm font-medium text-gray-900">
                Hospitality Statutory Tax Schedules
              </CardTitle>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {taxRates.length} {taxRates.length === 1 ? 'Rule' : 'Rules'} Active
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Tax Title</TableHead>
                <TableHead className="text-xs font-medium">Statutory Code</TableHead>
                <TableHead className="text-xs font-medium">Rate Percentage</TableHead>
                <TableHead className="text-xs font-medium">Application</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((t) => (
                <TableRow key={t.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-xs text-gray-900">
                    {t.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">
                    {t.code || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {t.ratePercentage}%
                  </TableCell>
                  <TableCell>
                    {t.isDefault ? (
                      <Badge variant="purple" className="text-[10px] rounded-sm">
                        Default Room Tariff
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] rounded-sm text-gray-600">
                        Service Specific
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(t)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Tax Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[440px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              Create Statutory Tax Rule
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTax} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tax Description *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. GST Accommodation (SAC 9963)"
                className="text-xs rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tax Rate (%) *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12"
                    value={ratePercentage}
                    onChange={(e) => setRatePercentage(e.target.value)}
                    required
                    className="text-xs rounded-md pr-7 font-mono"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  HSN / SAC Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SAC 9963"
                  className="text-xs rounded-md font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDefaultTax"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-[#5e2b9d] rounded border-gray-300 focus:ring-[#5e2b9d] cursor-pointer"
              />
              <label htmlFor="isDefaultTax" className="text-xs text-gray-700 cursor-pointer">
                Set as default tax rate on room reservations
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="text-xs rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md font-medium cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Create Tax Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              Delete Tax Rate
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900">{deleteTarget?.name}</strong> ({deleteTarget?.ratePercentage}%)? Historical invoices will retain their calculated values.
          </p>
          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="text-xs rounded-md cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteTax}
              className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-md font-medium cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Tax Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

