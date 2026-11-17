'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingUp,
  PieChart,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { FinancialPnlData } from '@/services/report.service'
import { toast } from 'sonner'

interface FinancialReportClientProps {
  pnl: FinancialPnlData
  propertyId: string
}

export function FinancialReportClient({ pnl, propertyId }: FinancialReportClientProps) {
  const handleExportCSV = () => {
    const rows = [
      ['Financial Statement Line Item', 'Amount ($)'],
      ['Room Accommodation Revenue', pnl.roomRevenue],
      ['Food & Beverage Revenue', pnl.fbRevenue],
      ['Incidental & Service Revenue', pnl.otherRevenue],
      ['Total Gross Revenue', pnl.grossRevenue],
      ['Statutory GST Collected (12%)', pnl.taxCollected],
      ['--- Operating Expenses ---', '---'],
      ...pnl.expensesByCategory.map((e) => [e.category, e.amount]),
      ['Total Operating Expenses', pnl.totalExpenses],
      ['Net Operating Income (NOI)', pnl.netOperatingIncome],
      ['Net Profit Margin', `${pnl.profitMarginPercent}%`],
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `financial_pnl_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('P&L Statement CSV downloaded')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
              Profit &amp; Loss (P&amp;L) Statement
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Audited gross operational revenue, cost of goods, department expenses, and net profit margins.
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
            Export P&amp;L Statement
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Gross Operating Revenue</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2 font-mono">
            {formatCurrency(pnl.grossRevenue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Rooms + F&amp;B + Services</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Operating Expenses</span>
          <p className="text-2xl font-medium text-rose-600 mt-2 font-mono">
            {formatCurrency(pnl.totalExpenses)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Disbursements &amp; payroll</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Net Operating Income</span>
          <p
            className={`text-2xl font-medium mt-2 font-mono ${
              pnl.netOperatingIncome >= 0 ? 'text-[#5e2b9d]' : 'text-rose-600'
            }`}
          >
            {formatCurrency(pnl.netOperatingIncome)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Earnings before taxes</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Profit Margin</span>
          <p className="text-2xl font-medium text-gray-900 mt-2 font-mono">
            {pnl.profitMarginPercent}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Net margin percentage</p>
        </div>
      </div>

      {/* P&L Detailed Ledger Paper */}
      <div className="bg-white border border-gray-200 rounded-md p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h2 className="text-sm font-medium text-[#5e2b9d] uppercase tracking-wider font-sora">
            1. Operating Revenues (Top Line)
          </h2>
          <div className="mt-3 divide-y divide-gray-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-gray-700">Room Accommodation &amp; Stay Revenue</span>
              <span className="font-mono font-medium text-gray-900">
                {formatCurrency(pnl.roomRevenue)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-gray-700">Food &amp; Beverage (Restaurant &amp; Room Dining)</span>
              <span className="font-mono font-medium text-gray-900">
                {formatCurrency(pnl.fbRevenue)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-gray-700">Laundry, Spa &amp; Incidental Services</span>
              <span className="font-mono font-medium text-gray-900">
                {formatCurrency(pnl.otherRevenue)}
              </span>
            </div>
            <div className="py-3 flex justify-between font-medium text-emerald-700 bg-emerald-50/50 px-2 rounded-sm mt-1">
              <span>Total Gross Operating Revenue</span>
              <span className="font-mono">{formatCurrency(pnl.grossRevenue)}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-rose-600 uppercase tracking-wider font-sora">
            2. Operating Expenses &amp; Department Outlays
          </h2>
          <div className="mt-3 divide-y divide-gray-100 text-xs">
            {pnl.expensesByCategory.length === 0 ? (
              <div className="py-4 text-center text-gray-400">
                No departmental expenses logged yet.
              </div>
            ) : (
              pnl.expensesByCategory.map((exp, idx) => (
                <div key={idx} className="py-2.5 flex justify-between">
                  <span className="text-gray-700">{exp.category}</span>
                  <span className="font-mono font-medium text-rose-600">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>
              ))
            )}
            <div className="py-3 flex justify-between font-medium text-rose-700 bg-rose-50/50 px-2 rounded-sm mt-1">
              <span>Total Operating Expenses</span>
              <span className="font-mono">{formatCurrency(pnl.totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center bg-[#f7f2fd] p-4 rounded-md">
            <div>
              <h3 className="text-base font-medium text-[#5e2b9d] font-sora">
                Net Operating Income (NOI)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Statutory GST Collected: {formatCurrency(pnl.taxCollected)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-medium text-[#5e2b9d]">
                {formatCurrency(pnl.netOperatingIncome)}
              </span>
              <span className="block text-xs text-emerald-700 font-medium">
                {pnl.profitMarginPercent}% Operating Margin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
