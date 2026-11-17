'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Receipt, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ExpenseCategoryRecord, createExpense } from '@/services/expense.service'
import { toast } from 'sonner'

interface ExpenseFormProps {
  categories: ExpenseCategoryRecord[]
  propertyId: string
}

export function ExpenseForm({ categories, propertyId }: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    description: '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    paymentMethod: 'card',
    receiptUrl: '',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.description.trim()) {
      toast.error('Please enter an expense description')
      return
    }

    const amountNum = parseFloat(form.amount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid expense amount')
      return
    }

    setIsSubmitting(true)
    const res = await createExpense({
      propertyId,
      categoryId: form.categoryId || undefined,
      description: form.description.trim(),
      amount: amountNum,
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod,
      vendorName: form.vendorName.trim() || undefined,
      receiptUrl: form.receiptUrl.trim() || undefined,
      status: form.status,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Expense recorded successfully!')
      router.push('/expenses')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to record expense')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/expenses">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
              Record Operational Expense
            </h1>
            <p className="text-xs text-gray-500">
              Log hotel procurement, utility charges, vendor payments, or maintenance costs.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2 font-sora">
              <Receipt className="h-4 w-4 text-[#5e2b9d]" />
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expense Title / Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Commercial Laundry Detergent &amp; Fabric Softener"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expense Category *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  required
                >
                  {categories.length === 0 ? (
                    <option value="">General Expenses</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Total Amount ($) *
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vendor / Payee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pacific Linen Supply Co."
                  value={form.vendorName}
                  onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="card">Company Corporate Credit Card</option>
                  <option value="wire">Bank Wire / ACH / UPI</option>
                  <option value="cash">Front Desk Petty Cash</option>
                  <option value="vendor_credit">Net 30 Vendor Credit Terms</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Approval Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Audit</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Receipt URL or Bill Reference
                </label>
                <input
                  type="text"
                  placeholder="https://... or Invoice #BILL-2026-90"
                  value={form.receiptUrl}
                  onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/expenses">
            <Button variant="outline" size="sm" type="button" className="text-xs cursor-pointer rounded-md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs font-medium cursor-pointer rounded-md"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSubmitting ? 'Saving Expense...' : 'Save & Record Expense'}
          </Button>
        </div>
      </form>
    </div>
  )
}

