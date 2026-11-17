'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  CheckCircle,
  Clock,
  Search,
  Eye,
  Plus,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceRecord } from '@/services/billing.service'
import { toast } from 'sonner'

interface InvoicesClientProps {
  initialInvoices: InvoiceRecord[]
  propertyId: string
}

export function InvoicesClient({ initialInvoices, propertyId }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.guestName && inv.guestName.toLowerCase().includes(q)) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total, 0)
  const totalTax = invoices.reduce((acc, inv) => acc + inv.taxAmount, 0)
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No invoices to export')
      return
    }
    const headers = ['Invoice Number', 'Guest / Customer', 'Issued Date', 'Subtotal', 'Tax (12% GST)', 'Total Amount', 'Status']
    const rows = filtered.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.guestName || 'Guest'}"`,
      inv.issuedAt?.slice(0, 10),
      inv.subtotal,
      inv.taxAmount,
      inv.total,
      inv.status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `invoices_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Invoices &amp; Tax Documents
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Official guest tax invoices, GST statements, and receipt PDF downloads.
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
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-600">Total Invoiced</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(totalInvoiced)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{invoices.length} invoices generated</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-600">Total GST Collected</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">{formatCurrency(totalTax)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Automated tax reporting</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-600">Settled Invoices</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">
            {paidCount} / {invoices.length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Fully paid accounts</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice #, guest, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Status:</span>
          <div className="flex gap-1">
            {['all', 'issued', 'paid', 'void'].map((st) => (
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
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Invoices Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'No invoices match your selected search or filter.'
              : 'Tax invoices will be generated when folios are settled or upon guest checkout.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Invoice #</TableHead>
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-xs font-medium">Guest / Customer</TableHead>
                <TableHead className="text-xs font-medium">Tax Amount</TableHead>
                <TableHead className="text-xs font-medium">Total Amount</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(inv.issuedAt || inv.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    {inv.guestName || 'Guest'}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-600">
                    {formatCurrency(inv.taxAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    {formatCurrency(inv.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={inv.status === 'paid' ? 'success' : inv.status === 'issued' ? 'warning' : 'outline'}
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/billing/invoices/${inv.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-gray-700 hover:bg-[#f7f2fd] hover:text-[#5e2b9d] cursor-pointer rounded-md font-medium"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View / Print
                      </Button>
                    </Link>
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
