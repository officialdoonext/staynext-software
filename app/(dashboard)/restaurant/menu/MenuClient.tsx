'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  UtensilsCrossed,
  FolderPlus,
} from 'lucide-react'
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
  MenuItemRecord,
  MenuCategoryRecord,
  createMenuItem,
  createMenuCategory,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from '@/services/restaurant.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MenuClientProps {
  initialItems: MenuItemRecord[]
  categories: MenuCategoryRecord[]
  propertyId: string
}

export function MenuClient({ initialItems, categories, propertyId }: MenuClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<MenuItemRecord[]>(initialItems)
  const [selectedCat, setSelectedCat] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddCatOpen, setIsAddCatOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Item Form
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    price: '',
    description: '',
    isVeg: true,
  })

  // Category Form
  const [catName, setCatName] = useState('')

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCat === 'all' || item.categoryId === selectedCat
    const q = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || item.name.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  // Submit Add Item
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name.trim()) {
      toast.error('Please enter a dish name')
      return
    }
    const priceNum = parseFloat(itemForm.price)
    if (!priceNum || priceNum <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (!itemForm.categoryId) {
      toast.error('Please select or create a menu category')
      return
    }

    setIsSubmitting(true)
    const res = await createMenuItem({
      categoryId: itemForm.categoryId,
      name: itemForm.name.trim(),
      price: priceNum,
      description: itemForm.description.trim() || undefined,
      isVeg: itemForm.isVeg,
      isAvailable: true,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Menu item added successfully')
      setIsAddItemOpen(false)
      setItemForm({
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        price: '',
        description: '',
        isVeg: true,
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to add item')
    }
  }

  // Submit Add Category
  const handleAddCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setIsSubmitting(true)
    const res = await createMenuCategory({
      propertyId,
      name: catName.trim(),
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Category created')
      setIsAddCatOpen(false)
      setCatName('')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create category')
    }
  }

  // Toggle Availability
  const handleToggleAvail = async (itemId: string, current: boolean) => {
    const res = await toggleMenuItemAvailability(itemId, !current)
    if (res.success) {
      toast.success(!current ? 'Item marked Available' : 'Item marked 86/Sold Out')
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !current } : i))
      )
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to toggle')
    }
  }

  // Delete Item
  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteMenuItem(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Item deleted')
      setItems((prev) => prev.filter((i) => i.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/restaurant">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Menu Items &amp; Food Catalog
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live menu management, vegetarian indicators, pricing, and 86/sold-out toggles.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddCatOpen(true)}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <FolderPlus className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
            New Category
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddItemOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Dish / Drink
          </Button>
        </div>
      </div>

      {/* Categories Bar & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 text-xs rounded-md capitalize cursor-pointer transition-colors ${
              selectedCat === 'all'
                ? 'bg-[#5e2b9d] text-white font-medium'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize cursor-pointer transition-colors ${
                selectedCat === c.id
                  ? 'bg-[#5e2b9d] text-white font-medium'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Dishes Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Add starters, main courses, desserts, and beverages to make them available on the POS and Guest QR app.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsAddItemOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Dish
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-md p-4 shadow-2xs flex flex-col justify-between transition-all ${
                item.isAvailable ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      item.isVeg
                        ? 'border border-emerald-500 text-emerald-700 bg-emerald-50'
                        : 'border border-rose-500 text-rose-700 bg-rose-50'
                    }`}
                  >
                    ● {item.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(item.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <h3 className="text-sm font-medium text-gray-900 mt-2 font-sora">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {item.description || 'Freshly prepared specialty dish'}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-[#5e2b9d]">
                  {formatCurrency(item.price)}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleAvail(item.id, item.isAvailable)}
                  className={`text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    item.isAvailable
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {item.isAvailable ? 'In Stock' : '86 / Sold Out'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD DISH MODAL */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Add Menu Dish / Item</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Provide dish name, category, price, and dietary attributes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItemSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dish Name *</label>
              <input
                type="text"
                placeholder="e.g. Paneer Butter Masala, Grilled Salmon"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dietary Classification</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="veg"
                    checked={itemForm.isVeg}
                    onChange={() => setItemForm({ ...itemForm, isVeg: true })}
                    className="text-[#5e2b9d]"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="veg"
                    checked={!itemForm.isVeg}
                    onChange={() => setItemForm({ ...itemForm, isVeg: false })}
                    className="text-[#5e2b9d]"
                  />
                  <span>Non-Vegetarian</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                placeholder="Ingredients, accompaniments, preparation style..."
                rows={2}
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddItemOpen(false)}
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
                {isSubmitting ? 'Saving...' : 'Add to Menu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD CATEGORY MODAL */}
      <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">New Menu Category</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              e.g. Starters, Main Course, Breads, Beverages, Desserts
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCatSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Traditional Breads &amp; Rice"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCatOpen(false)}
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
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Menu Item</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to permanently delete this item from the restaurant catalog?
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

