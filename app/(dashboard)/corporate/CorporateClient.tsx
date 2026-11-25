'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Building,
  Percent,
  FileText,
  Search,
  Download,
  Trash2,
  Users,
  ShieldCheck,
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
import { formatCurrency } from '@/lib/utils'
import {
  CorporateAccountRecord,
  createCorporateAccount,
  deleteCorporateAccount,
} from '@/services/corporate.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CorporateClientProps {
  initialAccounts: CorporateAccountRecord[]
  propertyId: string
}

export function CorporateClient({ initialAccounts, propertyId }: CorporateClientProps) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<CorporateAccountRecord[]>(initialAccounts)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    creditLimit: '50000',
    discountPercentage: '15',
    paymentTerms: 'Net 30',
  })

  const filtered = accounts.filter((c) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      c.companyName.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  })

  const totalCredit = accounts.reduce((sum, c) => sum + c.creditLimit, 0)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim()) {
      toast.error('Please enter a company name')
      return
    }

    setIsSubmitting(true)
    const res = await createCorporateAccount({
      propertyId,
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      creditLimit: parseFloat(form.creditLimit) || 50000,
      discountPercentage: parseFloat(form.discountPercentage) || 15,
      paymentTerms: form.paymentTerms,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Corporate account created successfully')
      setIsAddOpen(false)
      setForm({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        creditLimit: '50000',
        discountPercentage: '15',
        paymentTerms: 'Net 30',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create account')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteCorporateAccount(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Corporate account removed')
      setAccounts((prev) => prev.filter((a) => a.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete account')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No corporate records to export')
      return
    }
    const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'Credit Limit', 'Discount %', 'Payment Terms', 'GSTIN']
    const rows = filtered.map((c) => [
      `"${c.companyName}"`,
      `"${c.contactPerson || '-'}"`,
      `"${c.email || '-'}"`,
      `"${c.phone || '-'}"`,
      c.creditLimit,
      `${c.discountPercentage}%`,
      c.paymentTerms,
      `"${c.taxId || '-'}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `corporate_accounts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Corporate Clients &amp; B2B Accounts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Corporate accounts, corporate billing credit terms, agent commissions, and contract rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/corporate/contracts">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <FileText className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Rate Contracts
            </Button>
          </Link>
          <Link href="/corporate/travel-agents">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <Users className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Travel Agents
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Corporate Account
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

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Corporate Accounts</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{accounts.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Commercial clients</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Credit Extended</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{formatCurrency(totalCredit)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Post-paid direct billing limit</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Active Partners</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">
            {accounts.filter((a) => a.isActive).length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">In good standing</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company, contact, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Corporate Accounts Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No corporate clients match your search query.'
              : 'Add enterprise partners, consulting firms, airlines, and tech companies with negotiated credit terms.'}
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Register First Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-[#dfcef6] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 font-sora">{client.companyName}</h3>
                      <p className="text-[11px] text-gray-400">
                        {client.contactPerson ? `${client.contactPerson} • ` : ''}
                        {client.email || 'No email registered'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] rounded-sm">
                    {client.discountPercentage}% DISC
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                  <div className="p-2 bg-gray-50 rounded-sm">
                    <p className="text-[10px] text-gray-400">Credit Limit</p>
                    <p className="text-xs font-mono font-medium text-gray-900 mt-0.5">
                      {formatCurrency(client.creditLimit)}
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-sm">
                    <p className="text-[10px] text-gray-400">Terms</p>
                    <p className="text-xs font-medium text-[#5e2b9d] mt-0.5">{client.paymentTerms}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-sm">
                    <p className="text-[10px] text-gray-400">GSTIN / Tax</p>
                    <p className="text-xs font-mono font-medium text-gray-600 mt-0.5 truncate">
                      {client.taxId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Direct billing authorization active</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(client.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD CORPORATE ACCOUNT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Add Corporate Client</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Establish contracted billing terms, corporate discounts, and credit caps.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company / Organization *</label>
              <input
                type="text"
                placeholder="e.g. Infosys Technologies Ltd"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Travel Desk Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="traveldesk@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Credit Limit ($)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={form.creditLimit}
                  onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Negotiated Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="15"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Direct Bill">Direct Bill to Company</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  placeholder="36AAACH7409R1ZZ"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
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
                {isSubmitting ? 'Saving...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Corporate Account</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove this corporate partner?
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

