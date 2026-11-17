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
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Inventory Management | StayNext' }

export default async function InventoryPage() {
  const supabase = await createClient()

  let items: any[] = []
  try {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true })

    if (data) {
      items = data.map((i: any) => ({
        id: i.id,
        name: i.name,
        sku: i.sku || 'N/A',
        category: i.category || 'General Supplies',
        currentStock: i.current_stock || 0,
        minStock: i.min_stock || 0,
        unitCost: Number(i.unit_cost || 0),
        status: i.current_stock <= (i.min_stock || 0) ? 'low_stock' : 'healthy',
      }))
    }
  } catch {}

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
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Inventory Items Tracked</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Track hotel linens, guest toiletries, food provisions, and maintenance supplies.
          </p>
        </div>
      ) : (
        /* Inventory Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead className="text-right">Stock Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm font-semibold text-gray-900">{item.name}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{item.sku}</TableCell>
                  <TableCell className="text-xs text-gray-600">{item.category}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900">{item.currentStock}</TableCell>
                  <TableCell className="text-xs text-gray-500">{item.minStock}</TableCell>
                  <TableCell className="text-xs font-medium text-gray-700">{formatCurrency(item.unitCost)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.status === 'low_stock' ? 'destructive' : 'success'}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
