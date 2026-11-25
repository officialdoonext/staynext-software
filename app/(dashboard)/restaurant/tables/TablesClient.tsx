'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  Users,
  CheckCircle2,
  Trash2,
  UtensilsCrossed,
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
import {
  TableRecord,
  createRestaurantTable,
  updateTableStatus,
  deleteRestaurantTable,
} from '@/services/restaurant.service'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TablesClientProps {
  initialTables: TableRecord[]
  propertyId: string
}

export function TablesClient({ initialTables, propertyId }: TablesClientProps) {
  const router = useRouter()
  const [tables, setTables] = useState<TableRecord[]>(initialTables)
  const [sectionFilter, setSectionFilter] = useState('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    tableNumber: '',
    capacity: 4,
    section: 'Main Dining',
  })

  const sections = Array.from(new Set(tables.map((t) => t.section))).filter(Boolean)

  const filteredTables = tables.filter((t) => {
    return sectionFilter === 'all' || t.section === sectionFilter
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tableNumber.trim()) {
      toast.error('Please enter a table number or label')
      return
    }

    setIsSubmitting(true)
    const res = await createRestaurantTable({
      propertyId,
      tableNumber: form.tableNumber.trim(),
      capacity: Number(form.capacity) || 4,
      section: form.section,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Dining table added successfully')
      setIsAddOpen(false)
      setForm({ tableNumber: '', capacity: 4, section: 'Main Dining' })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to add table')
    }
  }

  const handleStatusChange = async (tableId: string, status: any) => {
    const res = await updateTableStatus(tableId, status)
    if (res.success) {
      toast.success('Table status updated')
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)))
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update status')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteRestaurantTable(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Table removed')
      setTables((prev) => prev.filter((t) => t.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete table')
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
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
              Dining Table Layout &amp; Floor Seating
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure restaurant sections, table capacities, and live seating states.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Table
        </Button>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSectionFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-md capitalize cursor-pointer transition-colors ${
            sectionFilter === 'all'
              ? 'bg-[#5e2b9d] text-white font-medium'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Sections ({tables.length})
        </button>
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSectionFilter(sec)}
            className={`px-3 py-1.5 text-xs rounded-md capitalize cursor-pointer transition-colors ${
              sectionFilter === sec
                ? 'bg-[#5e2b9d] text-white font-medium'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {sec} ({tables.filter((t) => t.section === sec).length})
          </button>
        ))}
      </div>

      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Tables in Layout</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Add tables for Main Dining, Outdoor Patio, or Bar Lounge with seating capacities.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Table
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-md border text-center transition-all flex flex-col justify-between ${
                t.status === 'occupied'
                  ? 'bg-rose-50/50 border-rose-200'
                  : t.status === 'reserved'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    {t.section}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(t.id)}
                    className="h-5 w-5 p-0 text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="my-2">
                  <h3 className="text-lg font-medium text-gray-900 font-sora">{t.tableNumber}</h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>{t.capacity} seats</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className={`w-full text-[11px] py-1 px-1.5 rounded-sm border focus:outline-none cursor-pointer capitalize font-medium ${
                    t.status === 'occupied'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : t.status === 'reserved'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TABLE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Add Dining Table</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Define the table number, seating capacity, and restaurant section.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Table Number / Label *
              </label>
              <input
                type="text"
                placeholder="e.g. Table 1, T-12, Booth 4, Patio 2"
                value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Capacity (Seats)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                <SearchableSelect
                  value={form.section}
                  onChange={(val) => setForm({ ...form, section: val })}
                  options={[
                    { value: 'Main Dining', label: 'Main Dining' },
                    { value: 'Outdoor Patio', label: 'Outdoor Patio' },
                    { value: 'Rooftop Bar', label: 'Rooftop Bar' },
                    { value: 'Private Dining', label: 'Private Dining' },
                    { value: 'Poolside Lounge', label: 'Poolside Lounge' },
                  ]}
                  allowAdd={true}
                  addNewLabel="Add Restaurant Section"
                  placeholder="Select or add section..."
                />
              </div>
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
                {isSubmitting ? 'Adding...' : 'Add Table'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Table</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove this table from the dining floor plan?
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

