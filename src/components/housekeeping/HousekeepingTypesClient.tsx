'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowLeft,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Zap,
  Power
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  HousekeepingTypeItem,
  HousekeepingTypesResult,
  createHousekeepingType,
  loadSampleHousekeepingTypes,
  deleteHousekeepingType,
  toggleHousekeepingTypeActive,
  getHousekeepingTypes
} from '@/services/housekeeping.service'
import { PropertyItem } from '@/services/property.service'
import { toast } from 'sonner'

interface HousekeepingTypesClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialResult: HousekeepingTypesResult
}

export default function HousekeepingTypesClient({
  property: initialProp,
  properties,
  initialResult,
}: HousekeepingTypesClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [typesResult, setTypesResult] = useState<HousekeepingTypesResult>(initialResult)
  const [currentPage, setCurrentPage] = useState(initialResult.page || 1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // Add Type Form State
  const [showAddForm, setShowAddForm] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_minutes: 30,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    is_active: true,
  })

  // Fetch paginated data from database (strictly 24 items)
  const fetchPage = async (page: number, search?: string, propId?: string) => {
    startTransition(async () => {
      try {
        const res = await getHousekeepingTypes({
          propertyId: propId || selectedPropertyId,
          page,
          pageSize: 24,
          search: search !== undefined ? search : searchQuery,
        })
        setTypesResult(res)
        setCurrentPage(res.page)
      } catch (err: any) {
        toast.error(err.message || 'Error fetching housekeeping types')
      }
    })
  }

  // Handle Add Type Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Please enter a type name (e.g. Deep Cleaning, Towel Replacement)')
      return
    }

    setFormSubmitting(true)
    try {
      const res = await createHousekeepingType({
        property_id: selectedPropertyId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        estimated_minutes: Number(formData.estimated_minutes) || 30,
        priority: formData.priority,
        is_active: formData.is_active,
      })

      if (!res.success) throw new Error(res.error || 'Failed to create housekeeping type')

      toast.success(`"${formData.name.trim()}" added to Housekeeping Types!`)
      setFormData({
        name: '',
        description: '',
        estimated_minutes: 30,
        priority: 'medium',
        is_active: true,
      })
      // Refresh current page
      await fetchPage(currentPage)
    } catch (err: any) {
      toast.error(err.message || 'Error saving type')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Load 8 Sample Types
  const handleLoadSamples = async () => {
    setSampleLoading(true)
    try {
      const res = await loadSampleHousekeepingTypes(selectedPropertyId)
      if (!res.success) throw new Error(res.error || 'Failed to load sample types')
      toast.success('Successfully loaded 8 standard housekeeping types!')
      await fetchPage(1)
    } catch (err: any) {
      toast.error(err.message || 'Error loading sample types')
    } finally {
      setSampleLoading(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete housekeeping type "${name}"?`)) return
    setActionLoadingId(id)
    try {
      const res = await deleteHousekeepingType(id)
      if (!res.success) throw new Error(res.error || 'Failed to delete')
      toast.success(`Housekeeping type deleted`)
      await fetchPage(currentPage)
    } catch (err: any) {
      toast.error(err.message || 'Error deleting type')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle Toggle Active
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id)
    try {
      const res = await toggleHousekeepingTypeActive(id, !currentStatus)
      if (!res.success) throw new Error(res.error || 'Failed to update status')
      toast.success(`Status updated to ${!currentStatus ? 'Active' : 'Inactive'}`)
      await fetchPage(currentPage)
    } catch (err: any) {
      toast.error(err.message || 'Error updating status')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPage(1, searchQuery)
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-purple-50 text-[#5e2b9d] border-[#dfcef6]'
    }
  }

  const { data: typesList, totalCount, totalPages, pageSize } = typesResult
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/housekeeping">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
                Housekeeping Types
              </h1>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-[#5e2b9d] border-[#dfcef6]">
                QR &amp; Staff Routines
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add and configure room cleaning types (e.g. Deep Clean, Linen Change). These appear dynamically on Room QR scans.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                const newPropId = e.target.value
                setSelectedPropertyId(newPropId)
                fetchPage(1, searchQuery, newPropId)
              }}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Load 8 Sample Types Button */}
          <Button
            size="sm"
            onClick={handleLoadSamples}
            disabled={sampleLoading || isPending}
            className="bg-[#f7f2fd] text-[#5e2b9d] hover:bg-[#eee4fa] border border-[#dfcef6] text-xs h-9 font-medium rounded-md cursor-pointer transition-all"
          >
            <Sparkles className={`h-4 w-4 mr-1.5 ${sampleLoading ? 'animate-spin' : 'text-[#5e2b9d]'}`} />
            {sampleLoading ? 'Generating 8 Types...' : 'Load 8 Sample Types'}
          </Button>

          <Button
            size="sm"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {showAddForm ? 'Hide Form' : 'Add New Type'}
          </Button>
        </div>
      </div>

      {/* 1. ADD NEW TYPE FORM */}
      {showAddForm && (
        <Card className="border border-[#dfcef6] bg-gradient-to-br from-white to-[#faf7fe] shadow-2xs rounded-md overflow-hidden">
          <CardHeader className="py-3 px-4 bg-[#f7f2fd]/60 border-b border-[#dfcef6] flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-[#5e2b9d] flex items-center gap-2 font-sora">
              <Sparkles className="h-4 w-4 text-[#5e2b9d]" />
              Create Housekeeping Type
            </CardTitle>
            <span className="text-[11px] text-gray-400">
              Will appear on Guest Room QR portal
            </span>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Type Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Cleaning &amp; Steaming"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                {/* Estimated Minutes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    Estimated Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    step="5"
                    value={formData.estimated_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    Default Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="low">Standard / Low (30-45 mins)</option>
                    <option value="medium">Prompt / Medium (20-30 mins)</option>
                    <option value="high">Priority / High (15-20 mins)</option>
                    <option value="urgent">Urgent / Immediate</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-700">
                  Description &amp; Task Checklist for Staff / Guests
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Surface vacuuming, 400-TC linen change, bathroom sanitization, fresh towels replenishment."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
                  />
                  <span>Publish to Room QR code immediately</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        name: '',
                        description: '',
                        estimated_minutes: 30,
                        priority: 'medium',
                        is_active: true,
                      })
                    }}
                    className="text-xs h-8 rounded-md cursor-pointer"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={formSubmitting}
                    className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 font-medium rounded-md cursor-pointer"
                  >
                    {formSubmitting ? 'Saving Type...' : 'Save Housekeeping Type'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. SEARCH & LIST TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search types by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="text-xs h-8 rounded-md cursor-pointer shrink-0"
          >
            Search
          </Button>
          {searchQuery && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery('')
                fetchPage(1, '')
              }}
              className="text-xs h-8 px-2 text-gray-500 cursor-pointer"
            >
              Clear
            </Button>
          )}
        </form>

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-semibold text-gray-900">{startItem}-{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalCount}</span> types{' '}
          <span className="text-gray-400 font-normal">(Fetched 24/page directly from DB)</span>
        </div>
      </div>

      {/* 3. TYPES LIST (SERVER-PAGINATED, 24 ITEMS) */}
      {isPending ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center text-xs text-gray-400">
          Loading page {currentPage}...
        </div>
      ) : typesList.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-2xs">
          <Sparkles className="h-8 w-8 text-[#5e2b9d] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-gray-900 font-sora">No Housekeeping Types Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No types matched "${searchQuery}". Try a different keyword.`
              : 'Get started by creating a type above or click "Load 8 Sample Types" to auto-populate standard hospital cleaning routines.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              size="sm"
              onClick={handleLoadSamples}
              disabled={sampleLoading}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Load 8 Standard Types Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {typesList.map((type) => {
            const isLoading = actionLoadingId === type.id
            return (
              <Card
                key={type.id}
                className={`border rounded-md shadow-2xs transition-all bg-white flex flex-col justify-between ${
                  type.is_active ? 'border-gray-200 hover:border-[#dfcef6]' : 'border-gray-200 opacity-60 bg-gray-50/50'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#f7f2fd] text-[#5e2b9d] flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-gray-900 line-clamp-1 font-sora">
                          {type.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{type.estimated_minutes} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-semibold tracking-wider shrink-0 ${priorityColor(
                        type.priority
                      )}`}
                    >
                      {type.priority}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 min-h-[32px]">
                    {type.description || 'Standard room turnover service and replenishment routine.'}
                  </p>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          type.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className={type.is_active ? 'text-emerald-700 font-medium' : 'text-gray-400'}>
                        {type.is_active ? 'Active on QR' : 'Inactive'}
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggleActive(type.id, type.is_active)}
                        title={type.is_active ? 'Disable Type' : 'Activate Type'}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        <Power className={`h-3.5 w-3.5 ${type.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleDelete(type.id, type.name)}
                        title="Delete Type"
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 4. SERVER-SIDE PAGINATION CONTROLS (24 items per page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 px-1">
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => fetchPage(currentPage - 1)}
              className="text-xs h-8 px-2.5 rounded-md cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1
              // Show only window around current page if many pages
              if (
                totalPages > 7 &&
                pNum !== 1 &&
                pNum !== totalPages &&
                Math.abs(pNum - currentPage) > 2
              ) {
                return null
              }

              return (
                <Button
                  key={pNum}
                  size="sm"
                  variant={pNum === currentPage ? 'default' : 'outline'}
                  disabled={isPending}
                  onClick={() => fetchPage(pNum)}
                  className={`text-xs h-8 w-8 p-0 rounded-md cursor-pointer font-medium ${
                    pNum === currentPage
                      ? 'bg-[#5e2b9d] text-white hover:bg-[#4d2282]'
                      : 'text-gray-600'
                  }`}
                >
                  {pNum}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => fetchPage(currentPage + 1)}
              className="text-xs h-8 px-2.5 rounded-md cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
