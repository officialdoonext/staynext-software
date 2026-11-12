import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Plus, CreditCard, DollarSign, CheckCircle2, RefreshCw } from 'lucide-react'
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

export const metadata = { title: 'Payment Transactions | StayNext' }

const payments = [
  { id: 'pay-001', txnId: 'ch_3N8zXpLkd', date: '2026-11-11 09:45 AM', guest: 'Sophia Montgomery', method: 'Credit Card (Stripe)', cardLast4: '4242', amount: 3900.00, folio: 'FOL-2026-001', status: 'completed' },
  { id: 'pay-002', txnId: 'pos_terminal_04', date: '2026-11-11 10:15 AM', guest: 'Liam Gallagher', method: 'Terminal / Chip & PIN', cardLast4: '8812', amount: 660.00, folio: 'FOL-2026-002', status: 'completed' },
  { id: 'pay-003', txnId: 'csh_00912', date: '2026-11-11 10:40 AM', guest: 'Walk-in Guest (Lobby)', method: 'Cash (Front Desk Till)', cardLast4: '—', amount: 180.00, folio: 'FOL-2026-008', status: 'completed' },
  { id: 'pay-004', txnId: 'ch_3N8zYkMop', date: '2026-11-10 03:22 PM', guest: 'David Chen', method: 'Apple Pay (Direct)', cardLast4: '1099', amount: 785.00, folio: 'FOL-2026-004', status: 'completed' },
  { id: 'pay-005', txnId: 'wire_9921', date: '2026-11-09 11:00 AM', guest: 'Global Tech Consulting', method: 'Bank Wire Transfer', cardLast4: '—', amount: 8940.00, folio: 'CORP-881', status: 'completed' },
  { id: 'pay-006', txnId: 'ch_fail_091', date: '2026-11-09 02:14 PM', guest: 'Lucas Meyer', method: 'Credit Card (Declined)', cardLast4: '5511', amount: 840.00, folio: 'FOL-2026-005', status: 'failed' },
]

export default function PaymentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Payment Gateway &amp; Transaction Logs
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live processing records across Stripe, point-of-sale terminals, wire deposits, and cash register audits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9">
            <Download className="h-4 w-4 mr-1.5" />
            Export Payments CSV
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Process Manual Charge
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Collected Today</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(4890)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">3 successful transactions</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Card Processor Rate</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">98.2%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Stripe Gateway healthy</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Cash in Till</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(640)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Front desk register #1</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Total Month-to-Date</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(62500)}</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Target: $75,000</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Guest / Payer</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Folio Ref</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{p.txnId}</TableCell>
                <TableCell className="font-mono text-xs text-gray-600">{p.date}</TableCell>
                <TableCell className="font-semibold text-gray-900 text-xs">{p.guest}</TableCell>
                <TableCell className="text-xs text-gray-700">
                  {p.method} {p.cardLast4 !== '—' && <span className="font-mono text-gray-400">•••• {p.cardLast4}</span>}
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{p.folio}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'completed' ? 'success' : 'destructive'} className="text-[10px]">
                    {p.status === 'completed' ? 'Settled' : 'Card Declined'}
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
