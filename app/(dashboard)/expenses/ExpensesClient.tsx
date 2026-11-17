'use client'

import React, { useState } from 'react'
import {
  Receipt,
  Plus,
  DollarSign,
  Tag,
  TrendingDown,
  Calendar,
  Download,
  Search,
  Trash2,
  FolderTree,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ExpenseRecord, deleteExpense } from '@/services/expense.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ExpensesClientProps {
  initialExpenses: ExpenseRecord[]
  propertyId: string
}

export function ExpensesClient({ initialExpenses, propertyId }: ExpensesClientProps) {
  const router = useRouter()
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = expenses.filter((exp) => {
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      exp.description.toLowerCase().includes(q) ||
      (exp.vendorName && exp.vendorName.toLowerCase().includes(q)) ||
      (exp.categoryName && exp.categoryName.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0)
  const approvedCount = expenses.filter((e) => e.status === 'approved').length

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    const res = await deleteExpense(deleteId)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Expense record deleted successfully')
      setExpenses((prev) => prev.filter((e) => e.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete expense')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No expense records to export')
      return
    }
    const headers = ['Date', 'Description', 'Category', 'Vendor', 'Payment Method', 'Amount', 'Status']
    const rows = filtered.map((e) => [
      e.expenseDate,
      `"${e.description}"`,
      `"${e.categoryName}"`,
      `"${e.vendorName || '-'}"`,
      e.paymentMethod,
      e.amount,
      e.status,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Expenses &amp; Operating Outlays
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track daily operating costs, supplier purchase orders, vendor invoices, and category budgets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/expenses/categories">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <FolderTree className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Categories &amp; Budgets
            </Button>
          </Link>
          <Link href="/expenses/new">
            <Button
              size="sm"
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Record Expense
            </Button>
          </Link>
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
          <div className="flex items-center gap-2 text-rose-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Total Outlay Logged</span>
          </div>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(totalSpent)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{expenses.length} operating disbursements</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Approved Expenses</span>
          </div>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{approvedCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Audited &amp; verified disbursements</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-[#5e2b9d]">
            <TrendingDown className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Average Expense</span>
          </div>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">
            {formatCurrency(expenses.length > 0 ? totalSpent / expenses.length : 0)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Per recorded transaction</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expense, vendor, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Status:</span>
          <div className="flex gap-1">
            {['all', 'approved', 'pending', 'rejected'].map((st) => (
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
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Expenses Recorded</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Log hotel utility bills, linen purchases, kitchen provisions, and supplier invoices to track outlays.
          </p>
          <div className="mt-6">
            <Link href="/expenses/new">
              <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md">
                <Plus className="h-4 w-4 mr-1.5" />
                Record First Expense
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-xs font-medium">Description</TableHead>
                <TableHead className="text-xs font-medium">Category</TableHead>
                <TableHead className="text-xs font-medium">Vendor / Payee</TableHead>
                <TableHead className="text-xs font-medium">Method</TableHead>
                <TableHead className="text-xs font-medium">Amount</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(exp.expenseDate)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900 max-w-xs truncate">
                    {exp.description}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-gray-100 text-gray-800 text-[11px]">
                      {exp.categoryName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{exp.vendorName || '-'}</TableCell>
                  <TableCell className="text-xs capitalize text-gray-500">
                    {exp.paymentMethod?.replace('_', ' ') || 'Cash'}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-rose-600 font-mono">
                    {formatCurrency(exp.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={exp.status === 'approved' ? 'success' : exp.status === 'pending' ? 'warning' : 'outline'}
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {exp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(exp.id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Expense Record</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this expense record? This operation permanently updates the financial ledger.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              className="text-xs cursor-pointer rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md font-medium"
            >
              {isDeleting ? 'Deleting...' : 'Delete Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
