'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Download,
  Trash2,
  SlidersHorizontal,
  Building2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import {
  InventoryItemRecord,
  InventoryCategoryRecord,
  SupplierRecord,
  createInventoryItem,
  adjustStock,
  deleteInventoryItem,
} from '@/services/inventory.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface InventoryClientProps {
  initialItems: InventoryItemRecord[]
  categories: InventoryCategoryRecord[]
  suppliers: SupplierRecord[]
  propertyId: string
}

export function InventoryClient({
  initialItems,
  categories,
  suppliers,
  propertyId,
}: InventoryClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItemRecord[]>(initialItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [adjustItem, setAdjustItem] = useState<InventoryItemRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add Form
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    supplierId: suppliers.length > 0 ? suppliers[0].id : '',
    unit: 'pcs',
    unitPrice: '',
    currentStock: '0',
    minimumStock: '10',
    description: '',
  })

  // Adjust Form
  const [adjustForm, setAdjustForm] = useState({
    transactionType: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 1,
    notes: 'Routine inventory restock',
  })

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCat === 'all' || item.categoryId === selectedCat
    const matchesLow = !lowStockOnly || item.isLowStock
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(q))
    return matchesCat && matchesLow && matchesSearch
  })

  const totalValuation = items.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0)
  const lowStockCount = items.filter((i) => i.isLowStock).length

  // Add Item Submit
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name.trim()) {
      toast.error('Please enter an item name')
      return
    }

    const sku = itemForm.sku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`
    const price = parseFloat(itemForm.unitPrice) || 0
    const curStock = parseInt(itemForm.currentStock) || 0
    const minStock = parseInt(itemForm.minimumStock) || 10

    setIsSubmitting(true)
    const res = await createInventoryItem({
      propertyId,
      sku,
      name: itemForm.name.trim(),
      categoryId: itemForm.categoryId || undefined,
      supplierId: itemForm.supplierId || undefined,
      unit: itemForm.unit,
      unitPrice: price,
      currentStock: curStock,
      minimumStock: minStock,
      description: itemForm.description.trim() || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Inventory item added successfully')
      setIsAddItemOpen(false)
      setItemForm({
        sku: '',
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        supplierId: suppliers.length > 0 ? suppliers[0].id : '',
        unit: 'pcs',
        unitPrice: '',
        currentStock: '0',
        minimumStock: '10',
        description: '',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to add item')
    }
  }

  // Adjust Stock Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustItem) return
    if (adjustForm.quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    setIsSubmitting(true)
    const res = await adjustStock({
      itemId: adjustItem.id,
      transactionType: adjustForm.transactionType,
      quantity: Number(adjustForm.quantity),
      notes: adjustForm.notes,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Stock adjusted successfully')
      setAdjustItem(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to adjust stock')
    }
  }

  // Delete Item Submit
  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteInventoryItem(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Item deleted')
      setItems((prev) => prev.filter((i) => i.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete item')
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.info('No inventory items to export')
      return
    }
    const headers = ['SKU', 'Item Name', 'Category', 'Current Stock', 'Min Stock', 'Unit', 'Unit Cost', 'Total Valuation', 'Status']
    const rows = filteredItems.map((i) => [
      `"${i.sku}"`,
      `"${i.name}"`,
      `"${i.categoryName}"`,
      i.currentStock,
      i.minimumStock,
      i.unit,
      i.unitPrice,
      (i.currentStock * i.unitPrice).toFixed(2),
      i.isLowStock ? 'Low Stock' : 'Healthy',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Inventory &amp; Supplies Control
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock levels, purchase orders, reorder point thresholds, and supply chain vendors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/inventory/suppliers">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <Building2 className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Suppliers Directory
            </Button>
          </Link>
          <Link href="/inventory/purchase-orders">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <FileText className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Purchase Orders
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsAddItemOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add SKU Item
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Tracked Items</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{items.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Active warehouse SKUs</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Stock Valuation</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{formatCurrency(totalValuation)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">At landed unit cost</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Low Stock Alerts</span>
          <p className="text-2xl font-medium text-rose-600 mt-2">{lowStockCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Below reorder minimum</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Registered Vendors</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">{suppliers.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Approved supply partners</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search SKU, item name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
              lowStockOnly
                ? 'bg-rose-600 text-white font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
            Low Stock Only ({lowStockCount})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Items Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm || lowStockOnly
              ? 'No items match your selected filters.'
              : 'Add bed linens, guest toiletries, kitchen ingredients, or cleaning chemicals to track inventory.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">SKU</TableHead>
                <TableHead className="text-xs font-medium">Item Name</TableHead>
                <TableHead className="text-xs font-medium">Category</TableHead>
                <TableHead className="text-xs font-medium">In Stock</TableHead>
                <TableHead className="text-xs font-medium">Unit Price</TableHead>
                <TableHead className="text-xs font-medium">Total Value</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {item.sku}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    <div>{item.name}</div>
                    <span className="text-[11px] text-gray-400 font-normal">
                      Supplier: {item.supplierName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-gray-100 text-gray-800 text-[11px]">
                      {item.categoryName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    <span
                      className={`font-medium ${
                        item.isLowStock ? 'text-rose-600' : 'text-gray-900'
                      }`}
                    >
                      {item.currentStock} {item.unit}
                    </span>
                    <span className="text-[10px] text-gray-400 block">Min: {item.minimumStock}</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-gray-900">
                    {formatCurrency(item.currentStock * item.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.isLowStock ? 'destructive' : 'success'}
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {item.isLowStock ? 'Low Stock' : 'Optimal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjustItem(item)
                          setAdjustForm({
                            transactionType: 'in',
                            quantity: item.reorderQuantity || 10,
                            notes: 'Restock shipment received',
                          })
                        }}
                        className="h-7 px-2 text-xs border-gray-200 text-gray-700 hover:bg-[#f7f2fd] hover:text-[#5e2b9d] cursor-pointer rounded-md"
                      >
                        <SlidersHorizontal className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ADD ITEM DIALOG */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Add Inventory Item</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Register stock SKU, procurement cost, and minimum threshold.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItemSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Queen Bed Linen Set"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SKU / Code</label>
                <input
                  type="text"
                  placeholder="e.g. LIN-Q-01"
                  value={itemForm.sku}
                  onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={itemForm.supplierId}
                  onChange={(e) => setItemForm({ ...itemForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="">None / Local Sourcing</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  placeholder="pcs, kg, ltr, box"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={itemForm.unitPrice}
                  onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.currentStock}
                  onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Minimum Stock Reorder Threshold
              </label>
              <input
                type="number"
                min="1"
                value={itemForm.minimumStock}
                onChange={(e) => setItemForm({ ...itemForm, minimumStock: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddItemOpen(false)}
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
                {isSubmitting ? 'Saving...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADJUST STOCK DIALOG */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Adjust Stock Level</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {adjustItem?.name} ({adjustItem?.sku}) • Current Stock: {adjustItem?.currentStock} {adjustItem?.unit}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, transactionType: 'in' })}
                  className={`p-2 text-xs rounded-md border text-center cursor-pointer ${
                    adjustForm.transactionType === 'in'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  + Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, transactionType: 'out' })}
                  className={`p-2 text-xs rounded-md border text-center cursor-pointer ${
                    adjustForm.transactionType === 'out'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 font-medium'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  - Stock Out
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, transactionType: 'adjustment' })}
                  className={`p-2 text-xs rounded-md border text-center cursor-pointer ${
                    adjustForm.transactionType === 'adjustment'
                      ? 'border-[#5e2b9d] bg-[#f7f2fd] text-[#5e2b9d] font-medium'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  = Set Exact
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity ({adjustItem?.unit}) *</label>
              <input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason / Notes</label>
              <input
                type="text"
                placeholder="e.g. Delivery intake, damaged goods, room restocking"
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustItem(null)}
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
                {isSubmitting ? 'Adjusting...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Inventory Item</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to permanently delete this SKU item and its transaction history?
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
