'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Layers,
  Plus,
  BedDouble,
  Users,
  Sparkles,
  Edit2,
  Trash2,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RoomTypeItem, createRoomType, updateRoomType, deleteRoomType } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'

interface RoomTypesClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialTypes: RoomTypeItem[]
}

export default function RoomTypesClient({
  property: initialProp,
  properties,
  initialTypes,
}: RoomTypesClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [types, setTypes] = useState<RoomTypeItem[]>(initialTypes)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingType, setEditingType] = useState<RoomTypeItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    base_rate: 2500,
    max_occupancy: 3,
    base_occupancy: 2,
    default_adult_count: 2,
    default_child_count: 1,
    bed_type: 'King Bed',
    size_sqft: 320,
    extra_adult_rate: 500,
    extra_child_rate: 300,
    extra_bed_allowed: true,
    default_meal_plan: 'EP',
    gst_rate: 12,
    description: '',
    amenities: 'High-speed WiFi, Air Conditioning, Flat-screen TV, Electric Kettle, Mini Bar',
  })

  const openCreateModal = () => {
    setEditingType(null)
    setFormData({
      name: '',
      code: '',
      base_rate: 2500,
      max_occupancy: 3,
      base_occupancy: 2,
      default_adult_count: 2,
      default_child_count: 1,
      bed_type: 'King Bed',
      size_sqft: 320,
      extra_adult_rate: 500,
      extra_child_rate: 300,
      extra_bed_allowed: true,
      default_meal_plan: 'EP',
      gst_rate: 12,
      description: '',
      amenities: 'High-speed WiFi, Air Conditioning, Flat-screen TV, Electric Kettle, Mini Bar',
    })
    setErrorMsg('')
    setShowAddModal(true)
  }

  const openEditModal = (t: RoomTypeItem) => {
    setEditingType(t)
    setFormData({
      name: t.name,
      code: t.code || '',
      base_rate: t.base_rate,
      max_occupancy: t.max_occupancy,
      base_occupancy: t.base_occupancy || 2,
      default_adult_count: t.default_adult_count || 2,
      default_child_count: t.default_child_count || 1,
      bed_type: t.bed_type || 'King Bed',
      size_sqft: t.size_sqft || 320,
      extra_adult_rate: t.extra_adult_rate || 500,
      extra_child_rate: t.extra_child_rate || 300,
      extra_bed_allowed: t.extra_bed_allowed ?? true,
      default_meal_plan: t.default_meal_plan || 'EP',
      gst_rate: t.gst_rate || 12,
      description: t.description || '',
      amenities: t.amenities.join(', '),
    })
    setErrorMsg('')
    setShowAddModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.name.trim()) {
      setErrorMsg('Category name is required.')
      return
    }

    setLoading(true)

    try {
      const amenitiesArray = formData.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      if (editingType) {
        const res = await updateRoomType(editingType.id, {
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
          base_rate: Number(formData.base_rate),
          max_occupancy: Number(formData.max_occupancy),
          base_occupancy: Number(formData.base_occupancy),
          extra_adult_rate: Number(formData.extra_adult_rate),
          extra_child_rate: Number(formData.extra_child_rate),
          extra_bed_allowed: Boolean(formData.extra_bed_allowed),
          default_meal_plan: formData.default_meal_plan,
          gst_rate: Number(formData.gst_rate),
          bed_type: formData.bed_type,
          size_sqft: Number(formData.size_sqft),
          description: formData.description,
          amenities: amenitiesArray,
        })
        if (!res.success) throw new Error(res.error || 'Failed to update category')

        setTypes((prev) =>
          prev.map((t) =>
            t.id === editingType.id
              ? {
                  ...t,
                  name: formData.name.trim(),
                  code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
                  base_rate: Number(formData.base_rate),
                  max_occupancy: Number(formData.max_occupancy),
                  base_occupancy: Number(formData.base_occupancy),
                  extra_adult_rate: Number(formData.extra_adult_rate),
                  extra_child_rate: Number(formData.extra_child_rate),
                  extra_bed_allowed: Boolean(formData.extra_bed_allowed),
                  default_meal_plan: formData.default_meal_plan,
                  gst_rate: Number(formData.gst_rate),
                  bed_type: formData.bed_type,
                  size_sqft: Number(formData.size_sqft),
                  description: formData.description,
                  amenities: amenitiesArray,
                }
              : t
          )
        )
        setSuccessMsg('Room category updated successfully!')
      } else {
        const res = await createRoomType({
          property_id: selectedPropertyId,
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
          base_rate: Number(formData.base_rate),
          max_occupancy: Number(formData.max_occupancy),
          base_occupancy: Number(formData.base_occupancy),
          extra_adult_rate: Number(formData.extra_adult_rate),
          extra_child_rate: Number(formData.extra_child_rate),
          extra_bed_allowed: Boolean(formData.extra_bed_allowed),
          default_meal_plan: formData.default_meal_plan,
          gst_rate: Number(formData.gst_rate),
          bed_type: formData.bed_type,
          size_sqft: Number(formData.size_sqft),
          description: formData.description,
          amenities: amenitiesArray,
        })
        if (!res.success) throw new Error(res.error || 'Failed to create category')

        setTypes((prev) => [
          ...prev,
          {
            ...res.data,
            base_rate: Number(formData.base_rate),
            max_occupancy: Number(formData.max_occupancy),
            base_occupancy: Number(formData.base_occupancy),
            extra_adult_rate: Number(formData.extra_adult_rate),
            extra_child_rate: Number(formData.extra_child_rate),
            extra_bed_allowed: Boolean(formData.extra_bed_allowed),
            default_meal_plan: formData.default_meal_plan,
            gst_rate: Number(formData.gst_rate),
            total_rooms: 0,
            amenities: amenitiesArray,
          },
        ])
        setSuccessMsg('New room category registered!')
      }

      setTimeout(() => {
        setShowAddModal(false)
        setSuccessMsg('')
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return
    const res = await deleteRoomType(id)
    if (res.success) {
      setTypes((prev) => prev.filter((t) => t.id !== id))
    } else {
      alert(res.error || 'Could not delete category.')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rooms">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Room Categories &amp; Pricing Tiers
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure room types, default rack rates, occupancy limits, bedding, and features.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Room Category
          </Button>
        </div>
      </div>

      {/* Modal / Form Panel */}
      {showAddModal && (
        <Card className="border-[#dfcef6] bg-[#f7f2fd]/30 rounded-md shadow-sm">
          <CardHeader className="pb-3 border-b border-[#eee4fa]">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center justify-between">
              <span>{editingType ? `Edit Category: ${editingType.name}` : 'Create New Room Category'}</span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {errorMsg && (
              <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Deluxe Lakeview Room"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="DLX"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Rate / Night (₹) *</label>
                  <input
                    type="number"
                    value={formData.base_rate}
                    onChange={(e) => setFormData({ ...formData, base_rate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Occupancy</label>
                  <input
                    type="number"
                    value={formData.base_occupancy}
                    onChange={(e) => setFormData({ ...formData, base_occupancy: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({ ...formData, max_occupancy: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default Meal Plan</label>
                  <select
                    value={formData.default_meal_plan}
                    onChange={(e) => setFormData({ ...formData, default_meal_plan: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="EP">EP - Room Only (European Plan)</option>
                    <option value="CP">CP - Bed &amp; Breakfast (Continental)</option>
                    <option value="MAP">MAP - Half Board / Breakfast + Meal</option>
                    <option value="AP">AP - Full Board / All Meals (American)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GST Tax Slab</label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="12">12% GST (Room tariff &le; ₹7,500)</option>
                    <option value="18">18% GST (Luxury tariff &gt; ₹7,500)</option>
                    <option value="5">5% GST (No ITC eligible)</option>
                    <option value="0">0% GST (Exempt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Extra Adult Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.extra_adult_rate}
                    onChange={(e) => setFormData({ ...formData, extra_adult_rate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Extra Child Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.extra_child_rate}
                    onChange={(e) => setFormData({ ...formData, extra_child_rate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Extra Bed Allowed</label>
                  <select
                    value={formData.extra_bed_allowed ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, extra_bed_allowed: e.target.value === 'yes' })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="yes">Yes - Rollaway bed permitted</option>
                    <option value="no">No extra bed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bed Configuration</label>
                  <input
                    type="text"
                    value={formData.bed_type}
                    onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                    placeholder="1 King Bed or 2 Twin Beds"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Room Area (sqft)</label>
                  <input
                    type="number"
                    value={formData.size_sqft}
                    onChange={(e) => setFormData({ ...formData, size_sqft: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amenities (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="High-speed WiFi, AC, Smart TV, Rain Shower, Balcony"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs h-8 rounded-md cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {editingType ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {types.map((type) => (
          <Card
            key={type.id}
            className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{type.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[10px] text-gray-400 font-medium">{type.code}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-purple-200 text-purple-700 bg-purple-50">
                      {type.default_meal_plan || 'EP'} Plan
                    </Badge>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-gray-200 text-gray-600">
                      GST {type.gst_rate || 12}%
                    </Badge>
                  </div>
                </div>
                <Badge variant="purple" className="text-xs font-medium rounded-sm">
                  {formatCurrency(type.base_rate)} / night
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-3.5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Rooms:</span>
                  <span className="font-medium text-gray-900">{type.total_rooms} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Occupancy:</span>
                  <span className="font-medium text-gray-900">
                    Base: {type.base_occupancy || 2} &bull; Max: {type.max_occupancy} Guests
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Extra Adult / Child:</span>
                  <span className="font-medium text-gray-900">
                    +{formatCurrency(type.extra_adult_rate || 500)} / +{formatCurrency(type.extra_child_rate || 300)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Bedding:</span>
                  <span className="font-medium text-gray-900">{type.bed_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Extra Bed Allowed:</span>
                  <span className="font-medium text-gray-900">
                    {type.extra_bed_allowed ?? true ? 'Yes (Rollaway)' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Area:</span>
                  <span className="font-medium text-gray-900">{type.size_sqft} sqft</span>
                </div>

                {type.amenities.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                    {type.amenities.slice(0, 4).map((a, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-xs"
                      >
                        {a}
                      </span>
                    ))}
                    {type.amenities.length > 4 && (
                      <span className="text-[10px] text-gray-400">+{type.amenities.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(type)}
                  className="h-7 px-2.5 text-xs text-gray-700 hover:text-[#5e2b9d] rounded-sm cursor-pointer border-gray-200"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(type.id, type.name)}
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 rounded-sm cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

