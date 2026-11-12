import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileSpreadsheet, DollarSign, PieChart, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'P&L & Financial Audit Ledger | StayNext' }

const plSummary = [
  { category: 'Gross Room Revenues', mtd: 48900.00, ytd: 512000.00, type: 'revenue' },
  { category: 'Restaurant & Bar Sales', mtd: 12400.00, ytd: 135000.00, type: 'revenue' },
  { category: 'Spa & Incidentals', mtd: 7120.00, ytd: 77300.00, type: 'revenue' },
  { category: 'Total Operating Revenues (A)', mtd: 68420.00, ytd: 724300.00, type: 'total_rev' },
  { category: 'Cost of Sales (F&B Provisions & Amenities)', mtd: -4850.00, ytd: -52100.00, type: 'expense' },
  { category: 'Payroll & Employee Compensation', mtd: -18500.00, ytd: -198000.00, type: 'expense' },
  { category: 'Utilities & Building Maintenance', mtd: -6470.00, ytd: -68200.00, type: 'expense' },
  { category: 'OTA Commissions & Merchant Processing', mtd: -7200.00, ytd: -76400.00, type: 'expense' },
  { category: 'Total Operating Expenses (B)', mtd: -37020.00, ytd: -394700.00, type: 'total_exp' },
  { category: 'Net Operating Profit / EBITDA (A - B)', mtd: 31400.00, ytd: 329600.00, type: 'net_income' },
]

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Profit &amp; Loss Statement (P&amp;L) &amp; Financial Ledger
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Comprehensive GAAP income statement, EBITDA margins, departmental operating costs, and tax liability audits.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export Certified P&amp;L
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Executive Income Statement (P&amp;L)</h3>
          <span className="text-xs font-mono text-gray-400">Fiscal Year 2026 &bull; USD ($)</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Line Item / Accounting Category</TableHead>
              <TableHead>Month-to-Date (MTD)</TableHead>
              <TableHead className="text-right">Year-to-Date (YTD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plSummary.map((row, idx) => {
              const isHighlight = row.type === 'total_rev' || row.type === 'total_exp' || row.type === 'net_income'
              const isNet = row.type === 'net_income'

              return (
                <TableRow
                  key={idx}
                  className={
                    isNet
                      ? 'bg-indigo-50/70 font-bold'
                      : isHighlight
                      ? 'bg-gray-50/80 font-semibold'
                      : ''
                  }
                >
                  <TableCell className={`text-xs ${isNet ? 'text-indigo-900 text-sm font-bold' : isHighlight ? 'text-gray-900 font-bold' : 'text-gray-700 pl-6'}`}>
                    {row.category}
                  </TableCell>
                  <TableCell className={`font-mono text-xs ${isNet ? 'text-indigo-700 text-sm font-bold' : isHighlight ? 'text-gray-900 font-bold' : row.mtd < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                    {formatCurrency(row.mtd)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs ${isNet ? 'text-indigo-700 text-sm font-bold' : isHighlight ? 'text-gray-900 font-bold' : row.ytd < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                    {formatCurrency(row.ytd)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
