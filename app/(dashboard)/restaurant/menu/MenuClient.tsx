'use client'

import React, { useState, useEffect } from 'react'
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
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  FileText,
  AlertCircle,
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
  bulkUploadMenuItems,
  BulkUploadMenuItemInput,
  getMenuItems,
  getMenuCategories,
} from '@/services/restaurant.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MenuClientProps {
  initialItems: MenuItemRecord[]
  categories: MenuCategoryRecord[]
  propertyId: string
  properties?: Array<{ id: string; name: string }>
}

export function MenuClient({ initialItems, categories, propertyId, properties = [] }: MenuClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<MenuItemRecord[]>(initialItems)
  const [allCategories, setAllCategories] = useState<MenuCategoryRecord[]>(categories)
  const [currentPropertyId, setCurrentPropertyId] = useState(propertyId)
  const [selectedCat, setSelectedCat] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    setAllCategories(categories)
  }, [categories])

  useEffect(() => {
    setCurrentPropertyId(propertyId)
  }, [propertyId])

  const handlePropertyChange = async (newPropId: string) => {
    setCurrentPropertyId(newPropId)
    try {
      const freshItems = await getMenuItems(newPropId)
      const freshCats = await getMenuCategories(newPropId)
      setItems(freshItems)
      setAllCategories(freshCats)
      setSelectedCat('all')
    } catch (e) {
      console.error(e)
    }
  }

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

  // Bulk Upload State
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkActiveTab, setBulkActiveTab] = useState<'file' | 'paste'>('file')
  const [bulkRawText, setBulkRawText] = useState('')
  const [bulkItems, setBulkItems] = useState<BulkUploadMenuItemInput[]>([])
  const [bulkFileName, setBulkFileName] = useState('')
  const [isBulkUploading, setIsBulkUploading] = useState(false)

  // Sample dishes list
  const sampleDishes: BulkUploadMenuItemInput[] = [
    {
      name: 'Paneer Tikka',
      categoryName: 'Starters',
      price: 280,
      isVeg: true,
      description: 'Charcoal grilled cottage cheese cubes with peppers and mint dip',
    },
    {
      name: 'Chicken Malai Tikka',
      categoryName: 'Starters',
      price: 340,
      isVeg: false,
      description: 'Tender chicken marinated in cream, cheese and royal spices',
    },
    {
      name: 'Dal Makhani',
      categoryName: 'Main Course',
      price: 260,
      isVeg: true,
      description: 'Slow-cooked black lentils in churned butter and fresh cream',
    },
    {
      name: 'Butter Chicken',
      categoryName: 'Main Course',
      price: 380,
      isVeg: false,
      description: 'Roasted tandoori chicken cooked in smooth buttery tomato gravy',
    },
    {
      name: 'Butter Naan',
      categoryName: 'Breads',
      price: 45,
      isVeg: true,
      description: 'Fresh clay-oven baked flatbread glazed with melted butter',
    },
    {
      name: 'Gulab Jamun (2 pcs)',
      categoryName: 'Desserts',
      price: 120,
      isVeg: true,
      description: 'Warm soft milk solid dumplings soaked in cardamom syrup',
    },
    {
      name: 'Fresh Lime Soda',
      categoryName: 'Beverages',
      price: 90,
      isVeg: true,
      description: 'Chilled soda with freshly squeezed lime, mint and rock salt',
    },
    {
      name: 'Cold Coffee with Ice Cream',
      categoryName: 'Beverages',
      price: 150,
      isVeg: true,
      description: 'Thick blended espresso shake topped with vanilla ice cream',
    },
  ]

  // Parse CSV / Delimited Text
  const parseCsvText = (text: string): BulkUploadMenuItemInput[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) return []

    const parsed: BulkUploadMenuItemInput[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip CSV header line if present
      if (
        i === 0 &&
        (line.toLowerCase().includes('dish') ||
          line.toLowerCase().includes('name') ||
          line.toLowerCase().includes('category') ||
          line.toLowerCase().includes('price'))
      ) {
        continue
      }

      // Split by tab or comma (handling quoted commas)
      const delimiter = line.includes('\t') ? '\t' : ','
      const tokens = line.split(delimiter).map((t) => t.trim().replace(/^["']|["']$/g, ''))

      if (tokens.length >= 2) {
        const name = tokens[0]
        const categoryName = tokens[1] || 'Main Course'
        const priceNum = parseFloat(tokens[2] || '0')
        const vegText = (tokens[3] || 'veg').toLowerCase()
        const isVeg = !(vegText.includes('non') || vegText === 'n' || vegText === 'false')
        const description = tokens.slice(4).join(' ') || undefined

        if (name) {
          parsed.push({
            name,
            categoryName,
            price: isNaN(priceNum) ? 0 : priceNum,
            isVeg,
            description,
          })
        }
      }
    }
    return parsed
  }

  // Handle Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const headers = 'Dish Name,Category,Price,Veg/Non-Veg,Description\n'
    const rows = sampleDishes
      .map(
        (d) =>
          `"${d.name}","${d.categoryName}",${d.price},"${d.isVeg ? 'Veg' : 'Non-Veg'}","${d.description || ''}"`
      )
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'staynext_menu_sample_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Sample CSV template downloaded')
  }

  // Handle Load Sample Dishes
  const handleLoadSampleDishes = () => {
    setBulkItems(sampleDishes)
    setBulkRawText(
      sampleDishes
        .map(
          (d) =>
            `${d.name},${d.categoryName},${d.price},${d.isVeg ? 'Veg' : 'Non-Veg'},${d.description || ''}`
        )
        .join('\n')
    )
    toast.success('Loaded 8 sample dishes across 5 categories!')
  }

  // Handle File Input Change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBulkFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setBulkRawText(text)
        const itemsParsed = parseCsvText(text)
        setBulkItems(itemsParsed)
        if (itemsParsed.length > 0) {
          toast.success(`Parsed ${itemsParsed.length} dishes from ${file.name}`)
        } else {
          toast.error('Could not detect any valid rows in file')
        }
      }
    }
    reader.readAsText(file)
  }

  // Handle Bulk Submit
  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      toast.error('No valid menu items to upload')
      return
    }

    setIsBulkUploading(true)
    const activeProp = currentPropertyId || propertyId
    const res = await bulkUploadMenuItems({
      propertyId: activeProp,
      items: bulkItems,
    })
    setIsBulkUploading(false)

    if (res.success) {
      toast.success(
        `Successfully imported ${res.importedCount} menu items!${
          res.createdCategoriesCount && res.createdCategoriesCount > 0
            ? ` Auto-created ${res.createdCategoriesCount} new categories: ${res.createdCategoryNames?.join(', ')}`
            : ''
        }`
      )
      setIsBulkOpen(false)
      setBulkItems([])
      setBulkRawText('')
      setBulkFileName('')
      const freshItems = await getMenuItems(activeProp)
      const freshCats = await getMenuCategories(activeProp)
      setItems(freshItems)
      setAllCategories(freshCats)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to upload items')
    }
  }

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
    const activeProp = currentPropertyId || propertyId
    const res = await createMenuItem({
      categoryId: itemForm.categoryId || undefined,
      propertyId: activeProp,
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
        categoryId: allCategories.length > 0 ? allCategories[0].id : '',
        price: '',
        description: '',
        isVeg: true,
      })
      const freshItems = await getMenuItems(activeProp)
      setItems(freshItems)
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
    const activeProp = currentPropertyId || propertyId
    const res = await createMenuCategory({
      propertyId: activeProp,
      name: catName.trim(),
    })
    setIsSubmitting(false)

    if (res.success && res.categoryId) {
      toast.success('Category created')
      setIsAddCatOpen(false)
      const freshCats = await getMenuCategories(activeProp)
      setAllCategories(freshCats)
      setItemForm((prev) => ({ ...prev, categoryId: res.categoryId! }))
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
        <div className="flex flex-wrap items-center gap-2">
          {properties && properties.length > 1 && (
            <select
              value={currentPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2.5 py-2 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsBulkOpen(true)
              if (bulkItems.length === 0) {
                setBulkItems(sampleDishes)
                setBulkRawText(
                  sampleDishes
                    .map(
                      (d) =>
                        `${d.name},${d.categoryName},${d.price},${d.isVeg ? 'Veg' : 'Non-Veg'},${d.description || ''}`
                    )
                    .join('\n')
                )
              }
            }}
            className="text-xs h-9 cursor-pointer rounded-md font-medium border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" />
            Bulk Upload Menu
          </Button>
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
          {allCategories.map((c) => (
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
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const activeProp = currentPropertyId || propertyId
                setIsSubmitting(true)
                const res = await bulkUploadMenuItems({
                  propertyId: activeProp,
                  items: sampleDishes,
                })
                setIsSubmitting(false)
                if (res.success) {
                  toast.success('Loaded 8 sample dishes across 5 categories!')
                  const freshItems = await getMenuItems(activeProp)
                  const freshCats = await getMenuCategories(activeProp)
                  setItems(freshItems)
                  setAllCategories(freshCats)
                  router.refresh()
                } else {
                  toast.error(res.error || 'Failed to load samples')
                }
              }}
              disabled={isSubmitting}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md text-xs"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Load 8 Sample Dishes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddItemOpen(true)}
              className="font-medium cursor-pointer rounded-md text-xs border-gray-300"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Single Dish
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
                  {allCategories.length === 0 && (
                    <option value="">No categories created yet</option>
                  )}
                  {allCategories.map((c) => (
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

      {/* BULK UPLOAD MODAL */}
      <Dialog open={isBulkOpen} onOpenChange={(open) => !open && setIsBulkOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#5e2b9d]" />
              Bulk Upload Menu Items
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Import multiple dishes and drinks in seconds. If any items belong to a new category, that category will be automatically created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Action Bar: Download template & load samples */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#f7f2fd]/60 border border-[#dfcef6] rounded-md">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSampleCsv}
                  className="text-xs h-7 px-2.5 cursor-pointer bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Download className="h-3.5 w-3.5 mr-1 text-[#5e2b9d]" />
                  Download Sample CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleDishes}
                  className="text-xs h-7 px-2.5 cursor-pointer bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Load 8 Sample Dishes
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setBulkActiveTab('file')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    bulkActiveTab === 'file'
                      ? 'bg-[#5e2b9d] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActiveTab('paste')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    bulkActiveTab === 'paste'
                      ? 'bg-[#5e2b9d] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Paste Text / CSV
                </button>
              </div>
            </div>

            {/* Tab 1: File Upload */}
            {bulkActiveTab === 'file' && (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-[#5e2b9d] transition-colors bg-gray-50/50">
                <FileSpreadsheet className="h-8 w-8 text-[#5e2b9d] mx-auto mb-2 opacity-80" />
                <div className="text-xs font-medium text-gray-900 mb-1">
                  Upload CSV, TSV, or spreadsheet export
                </div>
                <div className="text-[11px] text-gray-500 mb-3">
                  Format: Dish Name, Category, Price, Veg/Non-Veg, Description
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5e2b9d] text-white text-xs font-medium rounded-md cursor-pointer hover:bg-[#4d2282] transition-colors">
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".csv, .tsv, .txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
                {bulkFileName && (
                  <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {bulkFileName}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Paste Raw Text */}
            {bulkActiveTab === 'paste' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-gray-700">Paste Rows (CSV or Tab Separated)</label>
                  <span className="text-[11px] text-gray-400">
                    Dish Name, Category, Price, Veg/Non-Veg, Description
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={bulkRawText}
                  onChange={(e) => {
                    setBulkRawText(e.target.value)
                    const parsed = parseCsvText(e.target.value)
                    setBulkItems(parsed)
                  }}
                  placeholder="Paneer Butter Masala, Main Course, 360, Veg, Rich tomato and butter gravy&#10;Chicken Biryani, Main Course, 420, Non-Veg, Basmati rice layered with spiced chicken"
                  className="w-full p-2.5 text-xs font-mono bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            )}

            {/* Auto Category Creation Banner */}
            {(() => {
              const existingLower = new Set(categories.map((c) => c.name.toLowerCase().trim()))
              const newCats = Array.from(
                new Set(
                  bulkItems
                    .map((i) => (i.categoryName || 'Main Course').trim())
                    .filter((c) => !existingLower.has(c.toLowerCase()))
                )
              )

              if (newCats.length === 0) return null

              return (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Auto-Creating {newCats.length} New Categories:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {newCats.map((nc) => (
                      <span
                        key={nc}
                        className="bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        + {nc}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Items Preview Table */}
            {bulkItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Preview ({bulkItems.length} dishes ready to import)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkItems([])
                      setBulkRawText('')
                      setBulkFileName('')
                    }}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="border border-gray-200 rounded-md max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Dish Name</th>
                        <th className="px-3 py-1.5">Category</th>
                        <th className="px-3 py-1.5">Price</th>
                        <th className="px-3 py-1.5">Type</th>
                        <th className="px-3 py-1.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bulkItems.map((item, idx) => {
                        const existingLower = new Set(categories.map((c) => c.name.toLowerCase().trim()))
                        const isNewCategory = !existingLower.has((item.categoryName || '').toLowerCase().trim())

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-3 py-1.5 text-gray-400 text-[11px]">{idx + 1}</td>
                            <td className="px-3 py-1.5 font-medium text-gray-900">{item.name}</td>
                            <td className="px-3 py-1.5">
                              <span className="inline-flex items-center gap-1 font-medium text-[#5e2b9d]">
                                {item.categoryName}
                                {isNewCategory && (
                                  <span className="text-[9px] bg-purple-100 text-[#5e2b9d] px-1 py-0.2 rounded font-semibold">
                                    NEW
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 font-semibold text-gray-900">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-3 py-1.5">
                              {item.isVeg ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                  Veg
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-700 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-red-600" />
                                  Non-Veg
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-gray-500 text-[11px] max-w-xs truncate">
                              {item.description || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isBulkUploading || bulkItems.length === 0}
                onClick={handleBulkSubmit}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isBulkUploading ? (
                  'Importing Menu...'
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                    Import {bulkItems.length} Items Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

