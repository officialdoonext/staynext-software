import React from 'react'
import { Package, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Inventory Management | StayNext' }

const items = [
  { id: 'inv-1', name: 'Bath Towels (Egyptian Cotton 600 GSM)', sku: 'LIN-TOWEL-01', category: 'Linen & Bedding', currentStock: 140, minStock: 200, unitCost: 18.50, status: 'low_stock' },
  { id: 'inv-2', name: 'Luxury Shampoo Bottles (50ml)', sku: 'TOI-SHAMPOO-50', category: 'Guest Toiletries', currentStock: 48, minStock: 150, unitCost: 1.20, status: 'critical' },
  { id: 'inv-3', name: 'Keycards RFID NFC', sku: 'ACC-KEYCARD-01', category: 'Front Desk Supplies', currentStock: 450, minStock: 300, unitCost: 0.85, status: 'healthy' },
  { id: 'inv-4', name: 'Single Origin Espresso Beans (1kg)', sku: 'FNB-COFFEE-01', category: 'F&B Provisions', currentStock: 24, minStock: 15, unitCost: 22.00, status: 'healthy' },
  { id: 'inv-5', name: 'Bed Sheets (King Size White)', sku: 'LIN-SHEET-K', category: 'Linen & Bedding', currentStock: 80, minStock: 100, unitCost: 32.00, status: 'low_stock' },
]

export default function InventoryPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Inventory &amp; Supplies Control
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock levels, purchase orders, reorder point thresholds, and supply chain vendors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Inventory Item
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total SKUs Tracked</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">184 Items</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Across 8 hotel departments</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Low Stock Alerts
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-2">3 Items</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Below safe par levels</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Inventory Asset Value</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(24850)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Current warehouse audit</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Pending Purchase Orders</span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">2 POs</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Awaiting supplier delivery</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Stock Catalog &amp; Reorder Status</h3>
          <span className="text-xs text-gray-400">Warehouse Par Levels</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product / Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Department Category</TableHead>
              <TableHead>Current In Stock</TableHead>
              <TableHead>Par Level</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead className="text-right">Stock Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-semibold text-gray-900 text-xs">
                  {it.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-500">
                  {it.sku}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {it.category}
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-gray-900">
                  {it.currentStock}
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-400">
                  {it.minStock}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {formatCurrency(it.unitCost)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      it.status === 'healthy'
                        ? 'success'
                        : it.status === 'low_stock'
                        ? 'warning'
                        : 'destructive'
                    }
                    className="capitalize text-[10px]"
                  >
                    {it.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

