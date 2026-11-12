import React from 'react'
import { Receipt, Plus, DollarSign, Tag, TrendingDown, Calendar, Download } from 'lucide-react'
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

export const metadata = { title: 'Expense Management | StayNext' }

const demoExpenses = [
  { id: 'exp-1', description: 'Fresh Produce & Dairy Supplies', category: 'F&B Provisions', amount: 840.50, date: '2026-11-11', vendor: 'Sysco Metro Wholesale', paymentMethod: 'Corporate Card', status: 'approved' },
  { id: 'exp-2', description: 'Monthly Laundry Detergent & Softeners', category: 'Housekeeping', amount: 320.00, date: '2026-11-10', vendor: 'Ecolab Commercial', paymentMethod: 'Bank Transfer', status: 'approved' },
  { id: 'exp-3', description: 'HVAC Replacement Blower Motor #204', category: 'Maintenance & Repairs', amount: 260.00, date: '2026-11-10', vendor: 'Carrier HVAC Parts Co', paymentMethod: 'Cash Voucher', status: 'approved' },
  { id: 'exp-4', description: 'Fiber Optic Commercial Internet Bandwidth', category: 'Utilities', amount: 450.00, date: '2026-11-08', vendor: 'AT&T Business', paymentMethod: 'Direct Debit', status: 'approved' },
  { id: 'exp-5', description: 'Front Desk Keycard Envelopes & Pens', category: 'Admin & Supplies', amount: 95.00, date: '2026-11-06', vendor: 'Staples Advantage', paymentMethod: 'Corporate Card', status: 'pending' },
]

export default function ExpensesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Expenses &amp; Operating Outlays
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track daily operating costs, supplier purchase orders, vendor invoices, and category budgets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9">
            <Download className="h-4 w-4 mr-1.5" />
            Daily Closing Report
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Record Expense
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-600">
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-semibold">Today&apos;s Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(840.50)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">1 posted transaction today</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <TrendingDown className="h-5 w-5" />
            <span className="text-xs font-semibold">MTD Operating Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(4120.00)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">&darr; 8% below monthly target</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <Tag className="h-5 w-5" />
            <span className="text-xs font-semibold">Largest Category</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">F&amp;B Provisions</p>
          <p className="text-[11px] text-gray-500 mt-0.5">42% of total operational spend</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-semibold">Operating Margin</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">68.4%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">High profitability ratio</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Recent Operating Outlays</h3>
          <span className="text-xs text-gray-400">Expense Ledger</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor / Payee</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Approval Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoExpenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="text-xs text-gray-500">
                  {formatDate(exp.date)}
                </TableCell>
                <TableCell className="font-medium text-gray-900 text-xs">
                  {exp.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {exp.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {exp.vendor}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {exp.paymentMethod}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">
                  {formatCurrency(exp.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={exp.status === 'approved' ? 'success' : 'warning'} className="capitalize text-[10px]">
                    {exp.status}
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

