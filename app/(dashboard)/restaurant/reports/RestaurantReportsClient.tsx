'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingUp,
  FileBarChart,
  Calendar,
  UtensilsCrossed,
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
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { RestaurantOrderRecord } from '@/services/restaurant.service'
import { toast } from 'sonner'

interface RestaurantReportsClientProps {
  orders: RestaurantOrderRecord[]
  propertyId: string
}

export function RestaurantReportsClient({ orders, propertyId }: RestaurantReportsClientProps) {
  const settledOrders = orders.filter((o) => o.status === 'settled' || o.paymentStatus === 'paid' || o.paymentStatus === 'billed_to_room')

  const totalRevenue = settledOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalTax = settledOrders.reduce((sum, o) => sum + o.taxAmount, 0)
  const averageCheck = settledOrders.length > 0 ? totalRevenue / settledOrders.length : 0

  const roomBilledRevenue = settledOrders
    .filter((o) => o.paymentStatus === 'billed_to_room')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const handleExportCSV = () => {
    if (settledOrders.length === 0) {
      toast.info('No sales records to export')
      return
    }
    const headers = ['Order ID', 'Date', 'Type', 'Table / Room', 'Items Summary', 'Subtotal', 'GST (5%)', 'Total Amount', 'Payment Mode']
    const rows = settledOrders.map((o) => [
      `"${o.id.slice(0, 8)}"`,
      o.createdAt.slice(0, 10),
      o.orderType,
      `"${o.tableNumber || o.roomNumber || 'Counter'}"`,
      `"${o.items.map((i) => `${i.itemName} (${i.quantity})`).join('; ')}"`,
      o.subtotal,
      o.taxAmount,
      o.totalAmount,
      o.paymentStatus,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fb_sales_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/restaurant">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              F&amp;B Sales &amp; Revenue Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Settlement history, average ticket size, room service billing, and kitchen tax audit.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Sales Report
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total F&amp;B Sales</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{settledOrders.length} settled tickets</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Average Check Size</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">{formatCurrency(averageCheck)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Per guest transaction</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Room Service Billed</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(roomBilledRevenue)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Transferred to guest folios</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">5% Restaurant GST</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(totalTax)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Statutory tax collected</p>
        </div>
      </div>

      {settledOrders.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <FileBarChart className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Settled Orders</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Sales records will appear here as POS tickets are paid or billed to guest rooms.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Ticket #</TableHead>
                <TableHead className="text-xs font-medium">Date &amp; Time</TableHead>
                <TableHead className="text-xs font-medium">Service Type</TableHead>
                <TableHead className="text-xs font-medium">Destination</TableHead>
                <TableHead className="text-xs font-medium">Items Breakdown</TableHead>
                <TableHead className="text-xs font-medium">Total Bill</TableHead>
                <TableHead className="text-xs font-medium text-right">Settlement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settledOrders.map((o) => (
                <TableRow key={o.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell className="text-xs capitalize text-gray-700">
                    {o.orderType.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    {o.tableNumber ? `Table ${o.tableNumber}` : o.roomNumber ? `Room #${o.roomNumber}` : 'Counter'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                    {o.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-emerald-600 font-mono">
                    {formatCurrency(o.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={o.paymentStatus === 'paid' ? 'success' : 'outline'}
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {o.paymentStatus.replace('_', ' ')}
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

