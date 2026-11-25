'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BedDouble,
  Layers,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoomItem, RoomTypeItem, createRoom, updateRoom } from '@/services/room.service'
import { BuildingItem, FloorItem } from '@/services/property.service'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface RoomFormProps {
  propertyId: string
  roomTypes: RoomTypeItem[]
  buildings: BuildingItem[]
  floors: FloorItem[]
  initialData?: RoomItem
  isEdit?: boolean
}

export default function RoomForm({
  propertyId,
  roomTypes,
  buildings,
  floors,
  initialData,
  isEdit = false,
}: RoomFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    room_number: initialData?.room_number || '',
    room_type_id: initialData?.room_type_id || (roomTypes[0]?.id || ''),
    building_id: initialData?.building_id || '',
    floor_id: initialData?.floor_id || '',
    status: initialData?.status || 'available',
    is_smoking: initialData?.is_smoking || false,
    notes: initialData?.notes || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.room_number.trim()) {
      setErrorMsg('Room number is required.')
      return
    }

    if (!formData.room_type_id) {
      setErrorMsg('Please select a room type.')
      return
    }

    setLoading(true)

    try {
      if (isEdit && initialData?.id) {
        const res = await updateRoom(initialData.id, {
          room_number: formData.room_number.trim(),
          room_type_id: formData.room_type_id,
          building_id: formData.building_id || undefined,
          floor_id: formData.floor_id || undefined,
          status: formData.status as any,
          is_smoking: formData.is_smoking,
          notes: formData.notes,
        })
        if (!res.success) throw new Error(res.error || 'Failed to update room')

        setSuccessMsg('Room updated successfully!')
        setTimeout(() => {
          router.push('/rooms')
          router.refresh()
        }, 1200)
      } else {
        const res = await createRoom({
          property_id: propertyId,
          room_number: formData.room_number.trim(),
          room_type_id: formData.room_type_id,
          building_id: formData.building_id || undefined,
          floor_id: formData.floor_id || undefined,
          status: formData.status,
          is_smoking: formData.is_smoking,
          notes: formData.notes,
        })

        if (!res.success) throw new Error(res.error || 'Failed to create room')

        setSuccessMsg(`Room ${formData.room_number} registered successfully!`)
        setTimeout(() => {
          router.push('/rooms')
          router.refresh()
        }, 1200)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving the room.')
    } finally {
      setLoading(false)
    }
  }

  const roomTypeOptions = roomTypes.map((rt) => ({
    value: rt.id,
    label: `${rt.name} — ₹${rt.base_rate}/night (${rt.max_occupancy} guests)`,
  }))

  const buildingOptions = [
    { value: '', label: 'Main Building' },
    ...buildings.map((b) => ({ value: b.id, label: b.name })),
  ]

  const floorOptions = [
    { value: '', label: 'Select Floor' },
    ...floors.map((f) => ({
      value: f.id,
      label: `${f.name || `Floor ${f.floor_number}`} (${f.building_name})`,
    })),
  ]

  const statusOptions = [
    { value: 'available', label: 'Available (Clean & Inspected)' },
    { value: 'dirty', label: 'Dirty (Requires Cleaning)' },
    { value: 'cleaning', label: 'Cleaning in Progress' },
    { value: 'maintenance', label: 'Maintenance / Work Order' },
    { value: 'out_of_order', label: 'Out of Order' },
    { value: 'blocked', label: 'Blocked' },
  ]

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rooms">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              {isEdit ? `Edit Room ${initialData?.room_number}` : 'Add New Room Unit'}
            </h1>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Update room inventory properties and category mapping.' : 'Register a new room unit into sellable property inventory.'}
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-[#5e2b9d]" />
              Room Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  placeholder="e.g. 101, 204, V-12"
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Room Category / Type *
                </label>
                <SearchableSelect
                  value={formData.room_type_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, room_type_id: val }))}
                  options={roomTypeOptions}
                  placeholder="Select room type..."
                  allowAdd={true}
                  addNewLabel="Add Room Type"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Building Block / Wing
                </label>
                <SearchableSelect
                  value={formData.building_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, building_id: val }))}
                  options={buildingOptions}
                  placeholder="Select building..."
                  allowAdd={true}
                  addNewLabel="Add Building Block"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Floor
                </label>
                <SearchableSelect
                  value={formData.floor_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, floor_id: val }))}
                  options={floorOptions}
                  placeholder="Select floor..."
                  allowAdd={true}
                  addNewLabel="Add Floor"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Initial Room Status
                </label>
                <SearchableSelect
                  value={formData.status}
                  onChange={(val) => setFormData((prev) => ({ ...prev, status: val as any }))}
                  options={statusOptions}
                  placeholder="Select status..."
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="is_smoking"
                    checked={formData.is_smoking}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
                  />
                  <span>Smoking Room Allowed</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Internal Housekeeping &amp; Setup Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. Garden view, connecting door to 102, extra luggage rack fitted."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Link href="/rooms">
            <Button variant="outline" type="button" className="text-xs h-9 rounded-md cursor-pointer">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs h-9 rounded-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving Room...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                {isEdit ? 'Update Room' : 'Save Room to Inventory'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

