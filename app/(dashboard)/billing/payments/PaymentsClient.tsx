'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  CreditCard,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
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
import { PaymentRecord, recordPayment } from '@/services/billing.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PaymentsClientProps {
  initialPayments: PaymentRecord[]
  propertyId: string
}

export function PaymentsClient({ initialPayments, propertyId }: PaymentsClientProps) {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments)
  const [methodFilter, setMethodFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 'card',
    reference: '',
    notes: '',
  })

  const filtered = payments.filter((p) => {
    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      p.paymentReference?.toLowerCase().includes(q) ||
      (p.guestName && p.guestName.toLowerCase().includes(q)) ||
      (p.folioNumber && p.folioNumber.toLowerCase().includes(q))
    return matchesMethod && matchesSearch
  })

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0)
  const upiTotal = payments
    .filter((p) => p.paymentMethod === 'upi' || p.paymentMethod?.toLowerCase().includes('upi'))
    .reduce((acc, p) => acc + p.amount, 0)
  const cardTotal = payments
    .filter((p) => p.paymentMethod === 'card' || p.paymentMethod === 'pos')
    .reduce((acc, p) => acc + p.amount, 0)
  const cashTotal = payments
    .filter((p) => p.paymentMethod === 'cash')
    .reduce((acc, p) => acc + p.amount, 0)

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(form.amount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setIsLoading(true)
    const res = await recordPayment({
      propertyId,
      amount: amountNum,
      paymentMethod: form.paymentMethod,
      paymentReference: form.reference,
      notes: form.notes,
    })
    setIsLoading(false)

    if (res.success) {
      toast.success('Payment recorded successfully')
      setIsRecordOpen(false)
      setForm({
        amount: '',
        paymentMethod: 'card',
        reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
        notes: '',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to record payment')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No transactions to export')
      return
    }
    const headers = ['Reference ID', 'Date', 'Guest / Account', 'Payment Method', 'Amount', 'Status']
    const rows = filtered.map((p) => [
      `"${p.paymentReference || p.id}"`,
      p.createdAt?.slice(0, 10),
      `"${p.guestName || p.folioNumber || 'Direct'}"`,
      p.paymentMethod,
      p.amount,
      p.status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `payments_${new Date().toISOString().slice(0, 10)}.csv`)
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
              Payment Transactions
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live settlement ledger, payment gateway logs, card terminals, and cash deposits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setForm({
                amount: '',
                paymentMethod: 'card',
                reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
                notes: '',
              })
              setIsRecordOpen(true)
            }}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Record Payment
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
          <span className="text-xs font-medium text-gray-600">Total Payments</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{formatCurrency(totalCollected)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{payments.length} transactions processed</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-600">UPI / QR Collections</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">{formatCurrency(upiTotal)}</p>
          <p className="text-[11px] text-purple-700 mt-0.5">Instant Bank Transfer</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-600">Cards &amp; POS</span>
          <p className="text-2xl font-medium text-blue-600 mt-2">{formatCurrency(cardTotal)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Electronic terminals</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-600">Cash Settlements</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(cashTotal)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Physical desk drawer</p>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ref ID, guest, folio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Method:</span>
          <div className="flex gap-1 flex-wrap">
            {['all', 'upi', 'cash', 'card', 'bank_transfer', 'pos'].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 text-xs rounded-md uppercase cursor-pointer transition-colors ${
                  methodFilter === m
                    ? 'bg-[#5e2b9d] text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m === 'all' ? 'All Methods' : m === 'upi' ? 'UPI / QR' : m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Payment Records Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Payment transactions will automatically appear here as guests make deposits or settle bills.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Ref ID</TableHead>
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-xs font-medium">Guest / Account</TableHead>
                <TableHead className="text-xs font-medium">Method</TableHead>
                <TableHead className="text-xs font-medium">Amount</TableHead>
                <TableHead className="text-xs font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pay) => (
                <TableRow key={pay.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {pay.paymentReference || pay.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(pay.createdAt)}</TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    <div>{pay.guestName || 'Guest'}</div>
                    {pay.folioNumber && (
                      <div className="text-[11px] text-gray-500 font-mono">{pay.folioNumber}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs capitalize text-gray-700">
                    {pay.paymentMethod.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-emerald-600 font-mono">
                    {formatCurrency(pay.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={pay.status === 'completed' ? 'success' : 'warning'}
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {pay.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Record Payment Ledger Entry</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Log direct guest deposit, POS settlement, or cash intake.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="upi">UPI / Instant QR (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash Settlement</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="pos">POS EDC Machine</option>
                  <option value="stripe">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Txn Reference</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                placeholder="Front desk deposit remarks..."
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
                onClick={() => setIsRecordOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isLoading ? 'Saving...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

