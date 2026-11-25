'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  BedDouble
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createMaintenanceWorkOrder } from '@/services/maintenance.service'
import { RoomItem } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface MaintenanceFormProps {
  property: PropertyItem
  properties: PropertyItem[]
  rooms: RoomItem[]
}

export default function MaintenanceForm({
  property: initialProp,
  properties,
  rooms,
}: MaintenanceFormProps) {
  const router = useRouter()
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    room_id: rooms[0]?.id || '',
    title: '',
    description: '',
    category: 'hvac',
    priority: 'medium',
    estimated_cost: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.title.trim()) {
      setErrorMsg('Ticket title is required.')
      return
    }

    if (!formData.description.trim()) {
      setErrorMsg('Description is required.')
      return
    }

    setLoading(true)

    try {
      const res = await createMaintenanceWorkOrder({
        property_id: selectedPropertyId,
        room_id: formData.room_id || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        estimated_cost: Number(formData.estimated_cost),
      })

      if (!res.success) throw new Error(res.error || 'Failed to log maintenance request')

      setSuccessMsg('Maintenance ticket logged successfully and engineering notified!')
      setTimeout(() => {
        router.push('/maintenance')
        router.refresh()
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating work order')
    } finally {
      setLoading(false)
    }
  }

  const roomOptions = [
    { value: '', label: 'Public Area / Non-Room Facility' },
    ...rooms.map((r) => ({
      value: r.id,
      label: `Room ${r.room_number} (${r.floor_name}) - Current: ${r.status}`,
    })),
  ]

  const categoryOptions = [
    { value: 'hvac', label: 'HVAC & Air Conditioning' },
    { value: 'plumbing', label: 'Plumbing & Water Heater / Geyser' },
    { value: 'electrical', label: 'Electrical & Lighting' },
    { value: 'furniture', label: 'Furniture & Carpentry' },
    { value: 'tv_entertainment', label: 'TV & Entertainment / WiFi' },
    { value: 'door_lock', label: 'Keycard & Door Lock Mechanism' },
    { value: 'appliances', label: 'Mini-fridge & Appliances' },
    { value: 'general', label: 'General Facility Maintenance' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low (Standard preventive maintenance)' },
    { value: 'medium', label: 'Medium (Routine turnover fix)' },
    { value: 'high', label: 'High (Impacting guest stay)' },
    { value: 'urgent', label: 'Urgent / Emergency (Lock room out of inventory)' },
  ]

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/maintenance">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Log Maintenance Work Order
            </h1>
            <p className="text-xs text-gray-500">
              Dispatch engineering technicians, mark room out of inventory, and track parts cost.
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
              <Wrench className="h-4 w-4 text-[#5e2b9d]" />
              Work Order Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target Location / Room Unit
                </label>
                <SearchableSelect
                  value={formData.room_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, room_id: val }))}
                  options={roomOptions}
                  placeholder="Select room unit..."
                  allowAdd={true}
                  addNewLabel="Add Target Location"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Issue Category *
                </label>
                <SearchableSelect
                  value={formData.category}
                  onChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                  options={categoryOptions}
                  placeholder="Select category..."
                  allowAdd={true}
                  addNewLabel="Add Maintenance Category"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Priority Level *
                </label>
                <SearchableSelect
                  value={formData.priority}
                  onChange={(val) => setFormData((prev) => ({ ...prev, priority: val }))}
                  options={priorityOptions}
                  placeholder="Select priority..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estimated Repair Cost (₹)
                </label>
                <input
                  type="number"
                  name="estimated_cost"
                  value={formData.estimated_cost}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Issue Summary / Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Master bathroom faucet dripping continuously"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Provide complete breakdown of the malfunction, technician notes, or parts required..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Link href="/maintenance">
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
                Dispatching Work Order...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Dispatch Work Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

