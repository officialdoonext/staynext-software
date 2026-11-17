'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Search,
  Download,
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
  SupplierRecord,
  createSupplier,
  deleteSupplier,
} from '@/services/inventory.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SuppliersClientProps {
  initialSuppliers: SupplierRecord[]
  propertyId: string
}

export function SuppliersClient({ initialSuppliers, propertyId }: SuppliersClientProps) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(initialSuppliers)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 'Net 30',
  })

  const filtered = suppliers.filter((s) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    )
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter a supplier name')
      return
    }

    setIsSubmitting(true)
    const res = await createSupplier({
      propertyId,
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      paymentTerms: form.paymentTerms,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Supplier added successfully')
      setIsAddOpen(false)
      setForm({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        paymentTerms: 'Net 30',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to add supplier')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteSupplier(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Supplier deleted')
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete supplier')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Suppliers &amp; Procurement Vendors
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage commercial vendor agreements, tax IDs, contact details, and payment credit terms.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendor name, contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Vendors Registered</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Add linen providers, food &amp; dairy distributors, toiletries suppliers, and engineering hardware contractors.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Vendor
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] text-gray-600 bg-gray-50 rounded-sm">
                    {s.paymentTerms}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(s.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <h3 className="text-base font-medium text-gray-900 mt-2 font-sora">{s.name}</h3>
                {s.contactPerson && (
                  <p className="text-xs text-gray-600 mt-0.5">Contact: {s.contactPerson}</p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {s.taxId && (
                <div className="pt-3 mt-3 border-t border-gray-100 text-[11px] text-gray-400 font-mono">
                  GSTIN / Tax ID: {s.taxId}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Register Supply Partner</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Provide corporate details, contact email, GSTIN, and credit payment terms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company / Vendor Name *</label>
              <input
                type="text"
                placeholder="e.g. Apex Hospitality Wholesale Ltd"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="Advance">100% Advance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="City, Industrial Area"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                {isSubmitting ? 'Saving...' : 'Register Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Vendor</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this supplier profile?
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

