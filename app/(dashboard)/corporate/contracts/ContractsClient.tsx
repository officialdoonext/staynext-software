'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Download,
  FileText,
  Search,
  CheckCircle2,
  Trash2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import {
  CorporateContractRecord,
  CorporateAccountRecord,
  createCorporateContract,
  deleteCorporateContract,
} from '@/services/corporate.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ContractsClientProps {
  initialContracts: CorporateContractRecord[]
  accounts: CorporateAccountRecord[]
  propertyId: string
}

export function ContractsClient({
  initialContracts,
  accounts,
  propertyId,
}: ContractsClientProps) {
  const router = useRouter()
  const [contracts, setContracts] = useState<CorporateContractRecord[]>(initialContracts)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    corporateAccountId: accounts.length > 0 ? accounts[0].id : '',
    contractNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0],
    roomRateDiscountPercent: '15',
    complimentaryBreakfast: true,
    paymentTerms: 'Net 30',
    notes: '',
  })

  const filtered = contracts.filter((c) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      c.contractNumber.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q))
    )
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.corporateAccountId) {
      toast.error('Please select a corporate partner')
      return
    }

    setIsSubmitting(true)
    const res = await createCorporateContract({
      corporateAccountId: form.corporateAccountId,
      contractNumber: form.contractNumber.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      roomRateDiscountPercent: parseFloat(form.roomRateDiscountPercent) || 15,
      complimentaryBreakfast: form.complimentaryBreakfast,
      paymentTerms: form.paymentTerms,
      notes: form.notes.trim() || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Corporate agreement contracted successfully')
      setIsAddOpen(false)
      setForm({
        corporateAccountId: accounts.length > 0 ? accounts[0].id : '',
        contractNumber: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .split('T')[0],
        roomRateDiscountPercent: '15',
        complimentaryBreakfast: true,
        paymentTerms: 'Net 30',
        notes: '',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create contract')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteCorporateContract(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Contract archived')
      setContracts((prev) => prev.filter((c) => c.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete contract')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No contracts to export')
      return
    }
    const headers = ['Contract #', 'Corporate Partner', 'Start Date', 'End Date', 'Discount %', 'Breakfast', 'Payment Terms', 'Status']
    const rows = filtered.map((c) => [
      `"${c.contractNumber}"`,
      `"${c.companyName}"`,
      c.startDate,
      c.endDate,
      `${c.roomRateDiscountPercent}%`,
      c.complimentaryBreakfast ? 'Yes' : 'No',
      c.paymentTerms,
      c.status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `corporate_contracts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/corporate">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Corporate Rate Contracts &amp; Agreements
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Fixed enterprise tariffs, stay minimums, and complimentary breakfast inclusions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Contract
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contract #, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Contracts Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Create negotiated master service agreements with fixed room discounts and breakfast inclusions.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Contract First Agreement
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Contract #</TableHead>
                <TableHead className="text-xs font-medium">Corporate Partner</TableHead>
                <TableHead className="text-xs font-medium">Validity Period</TableHead>
                <TableHead className="text-xs font-medium">Discount</TableHead>
                <TableHead className="text-xs font-medium">Inclusions</TableHead>
                <TableHead className="text-xs font-medium">Payment Terms</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {c.contractNumber}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">{c.companyName}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(c.startDate)} to {formatDate(c.endDate)}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-gray-900">
                    {c.roomRateDiscountPercent}% OFF
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {c.complimentaryBreakfast ? 'Free Buffet Breakfast' : 'Room Only'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{c.paymentTerms}</TableCell>
                  <TableCell>
                    <Badge variant="success" className="text-[10px] capitalize rounded-sm">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(c.id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ADD CONTRACT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Issue Corporate Rate Agreement</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Contract negotiated room discounts and amenities for an enterprise partner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Corporate Client *</label>
              <SearchableSelect
                value={form.corporateAccountId}
                onChange={(val) => setForm({ ...form, corporateAccountId: val })}
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `${a.companyName} (${a.paymentTerms})`,
                }))}
                placeholder="Select corporate client..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <CustomDatePicker
                  value={form.startDate}
                  onChange={(val) => setForm({ ...form, startDate: val })}
                  placeholder="Select start date..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expiration Date</label>
                <CustomDatePicker
                  value={form.endDate}
                  onChange={(val) => setForm({ ...form, endDate: val })}
                  placeholder="Select end date..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Room Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.roomRateDiscountPercent}
                  onChange={(e) => setForm({ ...form, roomRateDiscountPercent: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                <SearchableSelect
                  value={form.paymentTerms}
                  onChange={(val) => setForm({ ...form, paymentTerms: val })}
                  options={[
                    { value: 'Net 15', label: 'Net 15 Days' },
                    { value: 'Net 30', label: 'Net 30 Days' },
                    { value: 'Direct Bill', label: 'Direct Company Billing' },
                  ]}
                  allowAdd={true}
                  addNewLabel="Add Payment Term"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.complimentaryBreakfast}
                  onChange={(e) => setForm({ ...form, complimentaryBreakfast: e.target.checked })}
                  className="rounded text-[#5e2b9d]"
                />
                <span>Include Complimentary Daily Buffet Breakfast</span>
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
                disabled={isSubmitting || accounts.length === 0}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isSubmitting ? 'Contracting...' : 'Sign & Contract'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Archive Contract</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to archive this corporate contract?
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
              {isSubmitting ? 'Deleting...' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

