import React from 'react'
import { CreditCard, DollarSign, Receipt, FileText, Download, Plus, ArrowUpRight } from 'lucide-react'
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

export const metadata = { title: 'Billing & Folios | StayNext' }

const folios = [
  { id: 'fol-1', folioNumber: 'FOL-2026-001', guest: 'Sophia Montgomery', room: '201', totalCharges: 4250.00, totalPayments: 4250.00, balance: 0.00, status: 'settled', lastUpdated: '2026-11-11' },
  { id: 'fol-2', folioNumber: 'FOL-2026-002', guest: 'Liam Gallagher', room: '102', totalCharges: 810.00, totalPayments: 660.00, balance: 150.00, status: 'open', lastUpdated: '2026-11-11' },
  { id: 'fol-3', folioNumber: 'FOL-2026-003', guest: 'Elena Rostova', room: '202', totalCharges: 1400.00, totalPayments: 500.00, balance: 900.00, status: 'open', lastUpdated: '2026-11-11' },
  { id: 'fol-4', folioNumber: 'FOL-2026-004', guest: 'David Chen', room: '304', totalCharges: 785.00, totalPayments: 785.00, balance: 0.00, status: 'settled', lastUpdated: '2026-11-10' },
  { id: 'fol-5', folioNumber: 'FOL-2026-005', guest: 'Lucas Meyer', room: '103', totalCharges: 840.00, totalPayments: 0.00, balance: 840.00, status: 'pending_invoice', lastUpdated: '2026-11-11' },
]

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Billing, Invoices &amp; Folios
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Automated room charge posting, POS incidentals, payment gateways, tax calculation, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9">
            <Download className="h-4 w-4 mr-1.5" />
            Financial Audit Export
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Post Payment
          </Button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-semibold">Collected Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(4890)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Stripe, Terminal, &amp; Cash</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-600">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs font-semibold">Outstanding Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(1890)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">3 in-house folios pending checkout</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-semibold">MTD Tax Accrual</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(3410)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">State Occupancy &amp; VAT (12%)</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-600">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-semibold">Invoices Dispatched</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">124</p>
          <p className="text-[11px] text-blue-600 mt-0.5">100% PDF delivery success</p>
        </div>
      </div>

      {/* Guest Folios Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Active Guest Folios &amp; Accounts</h3>
          <span className="text-xs text-gray-400">Real-time ledger updates</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio Number</TableHead>
              <TableHead>Guest Name</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Total Charges</TableHead>
              <TableHead>Payments Applied</TableHead>
              <TableHead>Balance Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folios.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">
                  {f.folioNumber}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  {f.guest}
                </TableCell>
                <TableCell>
                  <span className="font-mono px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-800">
                    #{f.room}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-semibold text-gray-900">
                  {formatCurrency(f.totalCharges)}
                </TableCell>
                <TableCell className="text-xs font-semibold text-emerald-600">
                  {formatCurrency(f.totalPayments)}
                </TableCell>
                <TableCell className="text-xs font-bold">
                  {f.balance > 0 ? (
                    <span className="text-rose-600">{formatCurrency(f.balance)}</span>
                  ) : (
                    <span className="text-emerald-600">Settled ($0.00)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={f.status === 'settled' ? 'success' : f.balance > 0 ? 'warning' : 'secondary'} className="capitalize text-[10px]">
                    {f.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      View Folio
                    </Button>
                    {f.balance > 0 && (
                      <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                        Collect
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

