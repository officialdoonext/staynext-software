import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Download, Package, Truck, CheckCircle2 } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Inventory Purchase Orders | StayNext' }

const orders = [
  { id: 'PO-2026-081', supplier: 'Luxe Linen & Textile Co.', items: '300 Queen Fitted Sheets, 200 Bath Towels', amount: 3450.00, date: '2026-11-10', eta: '2026-11-14', status: 'shipped' },
  { id: 'PO-2026-082', supplier: 'Napa Valley Cellars Distribution', items: '24 Cases House Cabernet, 12 Cases Pinot Noir', amount: 4800.00, date: '2026-11-09', eta: '2026-11-12', status: 'delivered' },
  { id: 'PO-2026-083', supplier: 'EcoPure Amenity Organics', items: '1,000 Shampoo Bottles, 1,000 Body Lotion', amount: 1650.00, date: '2026-11-08', eta: '2026-11-16', status: 'processing' },
  { id: 'PO-2026-084', supplier: 'Sysco Foodservice Metro', items: 'Dry Goods, Dairy, Coffee Beans', amount: 2890.00, date: '2026-11-07', eta: '2026-11-08', status: 'delivered' },
]

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Procurement &amp; Purchase Orders
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Stock replenishment workflows, supplier purchase agreements, delivery tracking, and receiving audits.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Purchase Order
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Vendor / Supplier</TableHead>
              <TableHead>Purchased Line Items</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{po.id}</TableCell>
                <TableCell className="font-mono text-xs">{po.date}</TableCell>
                <TableCell className="font-semibold text-gray-900 text-xs">{po.supplier}</TableCell>
                <TableCell className="text-xs text-gray-600 max-w-xs truncate">{po.items}</TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{po.eta}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">{formatCurrency(po.amount)}</TableCell>
                <TableCell>
                  <Badge variant={po.status === 'delivered' ? 'success' : po.status === 'shipped' ? 'info' : 'warning'} className="text-[10px]">
                    {po.status === 'delivered' ? 'Received & Stored' : po.status === 'shipped' ? 'In Transit' : 'Pending Vendor'}
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
