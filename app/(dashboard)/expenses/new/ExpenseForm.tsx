'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Receipt, Save, Plus, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ExpenseCategoryRecord,
  createExpense,
  createExpenseCategory,
} from '@/services/expense.service'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import { toast } from 'sonner'

interface ExpenseFormProps {
  categories: ExpenseCategoryRecord[]
  propertyId: string
}

const DEFAULT_PAYMENT_METHODS = [
  { value: 'card', label: 'Company Corporate Credit Card' },
  { value: 'wire', label: 'Bank Wire / ACH / UPI' },
  { value: 'cash', label: 'Front Desk Petty Cash' },
  { value: 'vendor_credit', label: 'Net 30 Vendor Credit Terms' },
]

const APPROVAL_STATUSES = [
  { value: 'approved', label: 'Approved (Ready for Ledger)' },
  { value: 'pending', label: 'Pending Audit / Verification' },
  { value: 'rejected', label: 'Rejected / Disputed' },
]

export function ExpenseForm({ categories: initialCategories, propertyId }: ExpenseFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>(initialCategories)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quick Add Category Modal state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
  })

  const [form, setForm] = useState({
    description: '',
    categoryId: initialCategories.length > 0 ? initialCategories[0].id : '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    paymentMethod: 'card',
    receiptUrl: '',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  })

  // Format category options for SearchableSelect
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.code ? `${c.name} (${c.code})` : c.name,
    description: c.budget > 0 ? `Budget: $${c.budget.toLocaleString()}` : undefined,
  }))

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryForm.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setIsCreatingCategory(true)
    const res = await createExpenseCategory({
      propertyId,
      name: newCategoryForm.name.trim(),
      code: newCategoryForm.code.trim() || undefined,
      description: newCategoryForm.description.trim() || undefined,
      budget: parseFloat(newCategoryForm.budget) || 0,
    })
    setIsCreatingCategory(false)

    if (res.success && res.data) {
      toast.success(`Category "${res.data.name}" created!`)
      setCategories((prev) => [...prev, res.data!])
      setForm((prev) => ({ ...prev, categoryId: res.data!.id }))
      setIsAddCategoryOpen(false)
      setNewCategoryForm({ name: '', code: '', description: '', budget: '' })
    } else {
      toast.error(res.error || 'Failed to create category')
    }
  }

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
    <div className="space-y-6 w-full pb-12">
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

              {/* Searchable Category with Add Feature */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Expense Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="text-[11px] text-[#5e2b9d] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Category</span>
                  </button>
                </div>
                <SearchableSelect
                  value={form.categoryId}
                  onChange={(val) => setForm({ ...form, categoryId: val })}
                  options={categoryOptions}
                  placeholder={categories.length === 0 ? "No categories setup — click to add" : "Select an expense category..."}
                  searchPlaceholder="Search or add category..."
                  allowAdd={true}
                  addNewLabel="Add New Category"
                  onAddClick={() => setIsAddCategoryOpen(true)}
                  onAddNew={(name) => {
                    setNewCategoryForm((prev) => ({ ...prev, name }))
                    setIsAddCategoryOpen(true)
                  }}
                  required
                />
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

              {/* Vendor / Payee with Custom Add */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vendor / Payee
                </label>
                <SearchableSelect
                  value={form.vendorName}
                  onChange={(val) => setForm({ ...form, vendorName: val })}
                  placeholder="Select or type vendor..."
                  searchPlaceholder="Search or type vendor name..."
                  allowAdd={true}
                  addNewLabel="Add Vendor / Payee"
                  options={[
                    { value: 'Pacific Linen Supply Co.', label: 'Pacific Linen Supply Co.' },
                    { value: 'Metro Commercial Laundry', label: 'Metro Commercial Laundry' },
                    { value: 'City Power & Electric Utility', label: 'City Power & Electric Utility' },
                    { value: 'Apex Hospitality Cleaners', label: 'Apex Hospitality Cleaners' },
                    { value: 'Sysco Food & Beverage Services', label: 'Sysco Food & Beverage Services' },
                  ]}
                />
              </div>

              {/* Payment Method with Add Feature */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <SearchableSelect
                  value={form.paymentMethod}
                  onChange={(val) => setForm({ ...form, paymentMethod: val })}
                  options={DEFAULT_PAYMENT_METHODS}
                  placeholder="Select payment method..."
                  allowAdd={true}
                  addNewLabel="Add Payment Method"
                />
              </div>

              {/* Custom Date Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expense Date *
                </label>
                <CustomDatePicker
                  value={form.expenseDate}
                  onChange={(date) => setForm({ ...form, expenseDate: date })}
                  placeholder="Select expense date..."
                />
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Approval Status
                </label>
                <SearchableSelect
                  value={form.status}
                  onChange={(val) => setForm({ ...form, status: val as any })}
                  options={APPROVAL_STATUSES}
                  placeholder="Select approval status..."
                />
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

      {/* QUICK ADD CATEGORY MODAL */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-[#5e2b9d]" />
              Create Expense Category
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add a cost center ledger category directly to your expense accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAddCategory} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Housekeeping & Guest Supplies"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code / Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. EXP-HK"
                  value={newCategoryForm.code}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={newCategoryForm.budget}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, budget: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Details of what charges belong in this category..."
                rows={2}
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingCategory}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isCreatingCategory ? 'Creating...' : 'Create & Select Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
