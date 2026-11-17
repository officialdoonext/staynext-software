'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, FolderTree, Tag, DollarSign, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import {
  ExpenseCategoryRecord,
  createExpenseCategory,
  deleteExpenseCategory,
} from '@/services/expense.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ExpenseCategoriesClientProps {
  initialCategories: ExpenseCategoryRecord[]
  propertyId: string
}

export function ExpenseCategoriesClient({
  initialCategories,
  propertyId,
}: ExpenseCategoriesClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>(initialCategories)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setIsSubmitting(true)
    const res = await createExpenseCategory({
      propertyId,
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      budget: parseFloat(form.budget) || 0,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Category created successfully')
      setIsAddOpen(false)
      setForm({ name: '', code: '', description: '', budget: '' })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create category')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteExpenseCategory(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Category deleted')
      setCategories((prev) => prev.filter((c) => c.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete category')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/expenses">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Expense Categories &amp; Cost Centers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Organize hotel operating expenditure into ledger categories with monthly budget caps.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium cursor-pointer rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <FolderTree className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Categories Setup</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Create cost center categories such as Housekeeping Supplies, Kitchen Provisions, Utilities, and Maintenance.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Category
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const percentSpent = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0
            return (
              <div
                key={cat.id}
                className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] text-gray-600 bg-gray-50 rounded-sm">
                      {cat.code}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{cat.transactionCount} transactions</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(cat.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-base font-medium text-gray-900 mt-2 font-sora">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description || 'General ledger category'}</p>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">
                        Spent: <strong className="text-gray-900 font-mono font-medium">{formatCurrency(cat.spent)}</strong>
                      </span>
                      <span className="text-gray-400">
                        Budget: <span className="font-mono font-medium">{formatCurrency(cat.budget)}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${percentSpent > 90 ? 'bg-rose-500' : 'bg-[#5e2b9d]'}`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{cat.budget > 0 ? `${percentSpent}% of budget used` : 'No budget limit'}</span>
                  {cat.budget > 0 && (
                    <span
                      className={`font-medium ${
                        cat.budget >= cat.spent ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {cat.budget >= cat.spent
                        ? `${formatCurrency(cat.budget - cat.spent)} left`
                        : `${formatCurrency(cat.spent - cat.budget)} over`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Create Expense Category</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Define a cost center code, monthly budget ceiling, and tracking ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Housekeeping &amp; Guest Supplies"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code / Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. EXP-HK"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Details of what charges belong in this category..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Category</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this expense category? Existing expenses will be preserved.
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
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md font-medium"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

