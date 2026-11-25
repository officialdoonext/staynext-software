'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Plus, Layers, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { BuildingItem, PropertyItem, createBuilding, deleteBuilding } from '@/services/property.service'

interface BuildingsClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialBuildings: BuildingItem[]
}

export default function BuildingsClient({
  property: initialProp,
  properties,
  initialBuildings,
}: BuildingsClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const res = await createBuilding({
      property_id: selectedPropertyId,
      name: name.trim(),
      code: code.trim() || undefined,
    })

    if (res.success && res.data) {
      setBuildings((prev) => [...prev, { ...res.data, total_floors: 0, total_rooms: 0 }])
      setName('')
      setCode('')
      setShowAdd(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this building block?')) return
    const res = await deleteBuilding(id)
    if (res.success) {
      setBuildings((prev) => prev.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Building Blocks &amp; Wings
            </h1>
            <p className="text-xs text-gray-500">
              Manage architectural blocks, towers, and wings across your properties.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <div className="w-52">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={(val) => setSelectedPropertyId(val)}
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select property..."
              />
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {showAdd ? 'Close' : 'Add Building'}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="border-[#dfcef6] bg-[#f7f2fd]/40 rounded-md p-4">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Building Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tower A, Heritage Block, East Wing"
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                required
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">Building Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BLD-A"
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>
            <Button type="submit" size="sm" className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer">
              Save Building
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buildings.map((b) => (
          <Card key={b.id} className="border-gray-200 rounded-md shadow-2xs">
            <CardContent className="pt-4 flex items-start justify-between">
              <div>
                <div className="text-xs font-medium text-gray-900">{b.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Code: {b.code || 'N/A'}</div>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                  <span>{b.total_floors || 0} Floors</span>
                  <span>•</span>
                  <span>{b.total_rooms || 0} Rooms</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(b.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md cursor-pointer transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

