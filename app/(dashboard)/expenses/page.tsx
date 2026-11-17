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
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Expense Management | StayNext' }

export default async function ExpensesPage() {
  const supabase = await createClient()

  let expenses: any[] = []
  let totalExpenses = 0

  try {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (data) {
      expenses = data.map((exp: any) => ({
        id: exp.id,
        description: exp.description,
        category: exp.category || 'General',
        amount: Number(exp.amount || 0),
        date: exp.expense_date,
        vendor: exp.vendor_name || 'Vendor',
        paymentMethod: exp.payment_method || 'Cash',
        status: exp.status || 'approved',
      }))

      totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
    }
  } catch {}

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
          <Link href="/expenses/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              Record Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-semibold">Total Expenses Logged</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Expenses Recorded</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Log hotel utility bills, linen purchases, kitchen provisions, and supplier invoices to track outlays.
          </p>
          <div className="mt-6">
            <Link href="/expenses/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Record First Expense
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Expenses Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-xs text-gray-500">{formatDate(exp.date)}</TableCell>
                  <TableCell className="text-sm font-semibold text-gray-900">{exp.description}</TableCell>
                  <TableCell className="text-xs text-gray-600">{exp.category}</TableCell>
                  <TableCell className="text-xs text-gray-600">{exp.vendor}</TableCell>
                  <TableCell className="text-xs text-gray-600 capitalize">{exp.paymentMethod}</TableCell>
                  <TableCell className="text-xs font-bold text-rose-600">{formatCurrency(exp.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={exp.status === 'approved' ? 'success' : 'warning'}>
                      {exp.status}
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
