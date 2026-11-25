'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Download,
  Boxes,
  Truck,
  CheckCircle2,
  Search,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  PurchaseOrderRecord,
  SupplierRecord,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} from '@/services/inventory.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PurchaseOrdersClientProps {
  initialOrders: PurchaseOrderRecord[]
  suppliers: SupplierRecord[]
  propertyId: string
}

export function PurchaseOrdersClient({
  initialOrders,
  suppliers,
  propertyId,
}: PurchaseOrdersClientProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>(initialOrders)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    supplierId: suppliers.length > 0 ? suppliers[0].id : '',
    itemsSummary: '',
    totalAmount: '',
    expectedDelivery: '',
    notes: '',
  })

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      o.poNumber.toLowerCase().includes(q) ||
      (o.supplierName && o.supplierName.toLowerCase().includes(q)) ||
      o.itemsSummary.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.itemsSummary.trim()) {
      toast.error('Please enter the purchase order items summary')
      return
    }

    const amountNum = parseFloat(form.totalAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid total amount')
      return
    }

    setIsSubmitting(true)
    const res = await createPurchaseOrder({
      propertyId,
      supplierId: form.supplierId || undefined,
      totalAmount: amountNum,
      expectedDelivery: form.expectedDelivery || undefined,
      itemsSummary: form.itemsSummary.trim(),
      notes: form.notes.trim() || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Purchase order created successfully')
      setIsCreateOpen(false)
      setForm({
        supplierId: suppliers.length > 0 ? suppliers[0].id : '',
        itemsSummary: '',
        totalAmount: '',
        expectedDelivery: '',
        notes: '',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create PO')
    }
  }

  const handleStatusChange = async (orderId: string, status: any) => {
    setIsSubmitting(true)
    const res = await updatePurchaseOrderStatus(orderId, status)
    setIsSubmitting(false)

    if (res.success) {
      toast.success(`PO status updated to ${status}`)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update status')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No purchase orders to export')
      return
    }
    const headers = ['PO Number', 'Supplier', 'Order Date', 'Expected ETA', 'Line Items Summary', 'Total Amount', 'Status']
    const rows = filtered.map((o) => [
      `"${o.poNumber}"`,
      `"${o.supplierName}"`,
      o.createdAt.slice(0, 10),
      o.expectedDelivery || '-',
      `"${o.itemsSummary}"`,
      o.totalAmount,
      o.status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
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
              Procurement &amp; Purchase Orders
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Stock replenishment workflows, supplier purchase agreements, delivery tracking, and receiving audits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Purchase Order
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
          <span className="text-xs text-gray-500 font-medium">Total Procurement Value</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(totalValue)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{orders.length} purchase orders issued</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Delivered &amp; Received</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{deliveredCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Warehouse stock received</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Active In-Transit Orders</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">
            {orders.filter((o) => o.status === 'ordered' || o.status === 'shipped').length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Awaiting delivery</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Status:</span>
          <div className="flex gap-1 flex-wrap">
            {['all', 'ordered', 'shipped', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-[#5e2b9d] text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Boxes className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Purchase Orders Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Create purchase orders to order linen restocks, F&amp;B provisions, or guest supplies from your vendors.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Purchase Order
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">PO Number</TableHead>
                <TableHead className="text-xs font-medium">Order Date</TableHead>
                <TableHead className="text-xs font-medium">Vendor / Supplier</TableHead>
                <TableHead className="text-xs font-medium">Purchased Line Items</TableHead>
                <TableHead className="text-xs font-medium">Expected Delivery</TableHead>
                <TableHead className="text-xs font-medium">Total Cost</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((po) => (
                <TableRow key={po.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {po.poNumber}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(po.createdAt)}</TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">{po.supplierName}</TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                    {po.itemsSummary}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {po.expectedDelivery ? formatDate(po.expectedDelivery) : 'TBD'}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-gray-900">
                    {formatCurrency(po.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        po.status === 'delivered'
                          ? 'success'
                          : po.status === 'shipped'
                          ? 'warning'
                          : po.status === 'ordered'
                          ? 'outline'
                          : 'secondary'
                      }
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {po.status === 'ordered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(po.id, 'shipped')}
                          className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer rounded-md"
                        >
                          Ship
                        </Button>
                      )}
                      {po.status === 'shipped' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(po.id, 'delivered')}
                          className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer rounded-md font-medium"
                        >
                          Receive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Issue Purchase Order</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Submit commercial order to supplier for inventory delivery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Supplier *</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                required
              >
                {suppliers.length === 0 ? (
                  <option value="">No registered vendors (create one in Suppliers)</option>
                ) : (
                  suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ordered Items Summary *
              </label>
              <textarea
                placeholder="e.g. 200 Queen Bedsheets (White), 100 Bath Towels, 50 Pillowcases"
                rows={3}
                value={form.itemsSummary}
                onChange={(e) => setForm({ ...form, itemsSummary: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Order Cost ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Notes / Instructions</label>
              <input
                type="text"
                placeholder="e.g. Deliver to Service Dock B, Attention: Executive Housekeeper"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
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
                {isSubmitting ? 'Issuing...' : 'Issue Purchase Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

