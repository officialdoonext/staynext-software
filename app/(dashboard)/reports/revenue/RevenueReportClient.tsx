'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaymentRecord } from '@/services/billing.service'
import { toast } from 'sonner'

interface RevenueReportClientProps {
  payments: PaymentRecord[]
  propertyId: string
}

export function RevenueReportClient({ payments, propertyId }: RevenueReportClientProps) {
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const cardRevenue = payments
    .filter((p) => p.paymentMethod === 'card' || p.paymentMethod === 'pos')
    .reduce((sum, p) => sum + p.amount, 0)
  const cashRevenue = payments
    .filter((p) => p.paymentMethod === 'cash')
    .reduce((sum, p) => sum + p.amount, 0)
  const bankRevenue = payments
    .filter((p) => p.paymentMethod === 'bank_transfer' || p.paymentMethod === 'stripe')
    .reduce((sum, p) => sum + p.amount, 0)

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.info('No revenue records to export')
      return
    }
    const headers = ['Txn Reference', 'Date', 'Guest / Account', 'Payment Method', 'Amount ($)', 'Status']
    const rows = payments.map((p) => [
      `"${p.paymentReference || p.id}"`,
      p.createdAt.slice(0, 10),
      `"${p.guestName || p.folioNumber || 'Guest'}"`,
      p.paymentMethod,
      p.amount,
      p.status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `revenue_audit_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Revenue Report exported')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Gross Revenue &amp; Cashflow Audit
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live settlement revenue ledger, payment gateway breakdowns, and channel settlements.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Revenue Ledger
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Revenue Collected</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2 font-mono">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{payments.length} transactions</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Card &amp; POS Settlements</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2 font-mono">
            {formatCurrency(cardRevenue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Credit / Debit terminal</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Cash Desk Inflow</span>
          <p className="text-2xl font-medium text-gray-900 mt-2 font-mono">
            {formatCurrency(cashRevenue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Physical drawer register</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Wire / Online Gateway</span>
          <p className="text-2xl font-medium text-blue-600 mt-2 font-mono">
            {formatCurrency(bankRevenue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Direct transfers &amp; Stripe</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Revenue Transactions</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Payment transactions will appear here as guests make advance deposits or settle their folio bills.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Txn Reference</TableHead>
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-xs font-medium">Guest / Account</TableHead>
                <TableHead className="text-xs font-medium">Payment Mode</TableHead>
                <TableHead className="text-xs font-medium">Amount Received</TableHead>
                <TableHead className="text-xs font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {p.paymentReference || p.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(p.createdAt)}</TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    <div>{p.guestName || 'Guest'}</div>
                    {p.folioNumber && (
                      <span className="text-[10px] text-gray-400 font-mono">{p.folioNumber}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs capitalize text-gray-700">
                    {p.paymentMethod.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-emerald-600">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" className="text-[10px] capitalize rounded-sm">
                      {p.status}
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

