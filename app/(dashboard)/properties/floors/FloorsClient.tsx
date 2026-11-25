'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Layers, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { FloorItem, BuildingItem, PropertyItem, createFloor, deleteFloor } from '@/services/property.service'

interface FloorsClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  buildings: BuildingItem[]
  initialFloors: FloorItem[]
}

export default function FloorsClient({
  property: initialProp,
  properties,
  buildings,
  initialFloors,
}: FloorsClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [floors, setFloors] = useState<FloorItem[]>(initialFloors)
  const [showAdd, setShowAdd] = useState(false)
  const [floorNumber, setFloorNumber] = useState(1)
  const [floorName, setFloorName] = useState('')
  const [buildingId, setBuildingId] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await createFloor({
      property_id: selectedPropertyId,
      building_id: buildingId || undefined,
      floor_number: Number(floorNumber),
      name: floorName.trim() || `Floor ${floorNumber}`,
    })

    if (res.success && res.data) {
      const bld = buildings.find((b) => b.id === buildingId)
      setFloors((prev) => [
        ...prev,
        {
          ...res.data,
          building_name: bld?.name || 'Main Building',
          total_rooms: 0,
        },
      ])
      setFloorName('')
      setFloorNumber((prev) => prev + 1)
      setShowAdd(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this floor?')) return
    const res = await deleteFloor(id)
    if (res.success) {
      setFloors((prev) => prev.filter((f) => f.id !== id))
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
              Floors Management
            </h1>
            <p className="text-xs text-gray-500">
              Configure floors and map them to building towers across your hotel branches.
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
            {showAdd ? 'Close' : 'Add Floor'}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="border-[#dfcef6] bg-[#f7f2fd]/40 rounded-md p-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Floor Number *</label>
              <input
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Floor Name</label>
              <input
                type="text"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder={`Floor ${floorNumber}`}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Building</label>
              <SearchableSelect
                value={buildingId}
                onChange={(val) => setBuildingId(val)}
                options={[
                  { value: '', label: 'Main Building' },
                  ...buildings.map((b) => ({ value: b.id, label: b.name })),
                ]}
                allowAdd={true}
                addNewLabel="Add Building Block"
              />
            </div>
            <Button type="submit" size="sm" className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer">
              Save Floor
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {floors.map((f) => (
          <Card key={f.id} className="border-gray-200 rounded-md shadow-2xs">
            <CardContent className="pt-4 flex items-start justify-between">
              <div>
                <div className="text-xs font-medium text-gray-900">{f.name || `Floor ${f.floor_number}`}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{f.building_name}</div>
                <div className="mt-2 text-xs text-gray-600">{f.total_rooms || 0} Rooms Assigned</div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
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

