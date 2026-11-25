'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  BedDouble,
  Layers,
  Sparkles,
  FileText,
  Settings,
  Plus,
  CheckCircle2,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  PropertyItem,
  BuildingItem,
  FloorItem,
  FacilityItem,
  createBuilding,
  deleteBuilding,
  createFloor,
  deleteFloor,
  togglePropertyFacility
} from '@/services/property.service'

interface PropertyDetailClientProps {
  property: PropertyItem
  buildings: BuildingItem[]
  floors: FloorItem[]
  facilities: FacilityItem[]
  rooms: any[]
}

export default function PropertyDetailClient({
  property,
  buildings: initialBuildings,
  floors: initialFloors,
  facilities: initialFacilities,
  rooms,
}: PropertyDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'floors' | 'rooms' | 'facilities' | 'policies'>('overview')
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings)
  const [floors, setFloors] = useState<FloorItem[]>(initialFloors)
  const [facilities, setFacilities] = useState<FacilityItem[]>(initialFacilities)

  // Building modal / inline state
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [newBuildingName, setNewBuildingName] = useState('')
  const [newBuildingCode, setNewBuildingCode] = useState('')

  // Floor modal / inline state
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [newFloorNumber, setNewFloorNumber] = useState<number | string>('')
  const [newFloorName, setNewFloorName] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBuildingName.trim()) return

    const res = await createBuilding({
      property_id: property.id,
      name: newBuildingName.trim(),
      code: newBuildingCode.trim() || undefined,
    })

    if (res.success && res.data) {
      setBuildings((prev) => [...prev, { ...res.data, total_floors: 0, total_rooms: 0 }])
      setNewBuildingName('')
      setNewBuildingCode('')
      setShowAddBuilding(false)
    }
  }

  const handleDeleteBuilding = async (id: string) => {
    if (!confirm('Are you sure you want to delete this building block?')) return
    const res = await deleteBuilding(id)
    if (res.success) {
      setBuildings((prev) => prev.filter((b) => b.id !== id))
    }
  }

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await createFloor({
      property_id: property.id,
      building_id: selectedBuildingId || undefined,
      floor_number: Number(newFloorNumber) || 1,
      name: newFloorName.trim() || `Floor ${newFloorNumber}`,
    })

    if (res.success && res.data) {
      const bld = buildings.find((b) => b.id === selectedBuildingId)
      setFloors((prev) => [
        ...prev,
        {
          ...res.data,
          building_name: bld?.name || 'Main Building',
          total_rooms: 0,
        },
      ])
      setNewFloorName('')
      setNewFloorNumber('')
      setShowAddFloor(false)
    }
  }

  const handleDeleteFloor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this floor?')) return
    const res = await deleteFloor(id)
    if (res.success) {
      setFloors((prev) => prev.filter((f) => f.id !== id))
    }
  }

  const handleToggleFacility = async (facilityId: string, currentStatus: boolean) => {
    const res = await togglePropertyFacility(property.id, facilityId, !currentStatus)
    if (res.success) {
      setFacilities((prev) =>
        prev.map((f) => (f.id === facilityId ? { ...f, is_available: !currentStatus } : f))
      )
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-gray-900">
                {property.name}
              </h1>
              <Badge variant={property.is_active ? 'default' : 'secondary'} className="text-[10px] rounded-md">
                {property.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {property.city}, {property.country} • Currency: {property.currency} • Star Rating: {property.star_rating} ★
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/properties/${property.id}/edit`}>
            <Button variant="outline" size="sm" className="text-xs h-8 rounded-md cursor-pointer border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]">
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit Property
            </Button>
          </Link>
          <Link href="/rooms/new">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'buildings', label: `Buildings (${buildings.length})`, icon: Layers },
          { id: 'floors', label: `Floors (${floors.length})`, icon: Layers },
          { id: 'rooms', label: `Rooms (${rooms.length})`, icon: BedDouble },
          { id: 'facilities', label: 'Facilities & Amenities', icon: Sparkles },
          { id: 'policies', label: 'Policies & Tax', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#5e2b9d] text-[#5e2b9d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-gray-200 rounded-md shadow-2xs">
              <CardContent className="pt-4">
                <div className="text-[11px] text-gray-500">Total Rooms</div>
                <div className="text-xl font-medium text-gray-900 mt-1">{property.total_rooms || rooms.length}</div>
                <div className="text-[10px] text-gray-400 mt-1">Configured in inventory</div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md shadow-2xs">
              <CardContent className="pt-4">
                <div className="text-[11px] text-gray-500">Occupied Rooms</div>
                <div className="text-xl font-medium text-emerald-600 mt-1">{property.occupied_rooms || 0}</div>
                <div className="text-[10px] text-gray-400 mt-1">Checked-in guests</div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md shadow-2xs">
              <CardContent className="pt-4">
                <div className="text-[11px] text-gray-500">Total Buildings</div>
                <div className="text-xl font-medium text-gray-900 mt-1">{buildings.length}</div>
                <div className="text-[10px] text-gray-400 mt-1">Wings &amp; Blocks</div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md shadow-2xs">
              <CardContent className="pt-4">
                <div className="text-[11px] text-gray-500">Total Floors</div>
                <div className="text-xl font-medium text-gray-900 mt-1">{floors.length}</div>
                <div className="text-[10px] text-gray-400 mt-1">Vertical layout</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-xs font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#5e2b9d]" />
                  Address &amp; Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[10px]">Street Address:</span>
                  <span className="font-medium text-gray-800">{property.address || 'Not specified'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">City &amp; State:</span>
                    <span className="font-medium text-gray-800">{property.city}, {property.state || ''}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Country &amp; Postal:</span>
                    <span className="font-medium text-gray-800">{property.country} {property.postal_code}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Phone:</span>
                    <span className="font-medium text-gray-800">{property.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Email:</span>
                    <span className="font-medium text-gray-800">{property.email || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-xs font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#5e2b9d]" />
                  Operations &amp; Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs text-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Standard Check-In:</span>
                    <span className="font-medium text-gray-800">{property.check_in_time}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Standard Check-Out:</span>
                    <span className="font-medium text-gray-800">{property.check_out_time}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Timezone:</span>
                    <span className="font-medium text-gray-800">{property.timezone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Currency:</span>
                    <span className="font-medium text-gray-800">{property.currency}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 block text-[10px]">GSTIN / Tax ID:</span>
                  <span className="font-medium text-gray-800">{property.gstin || 'Not registered'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BUILDINGS */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Building Wings &amp; Towers</h3>
              <p className="text-xs text-gray-500">Organize your property into wings, towers, or blocks.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddBuilding(!showAddBuilding)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {showAddBuilding ? 'Close Form' : 'Add Building'}
            </Button>
          </div>

          {showAddBuilding && (
            <Card className="border-[#dfcef6] bg-[#f7f2fd]/40 rounded-md p-4">
              <form onSubmit={handleAddBuilding} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Building Name *</label>
                  <input
                    type="text"
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    placeholder="e.g. Tower A, East Wing, Heritage Block"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Building Code</label>
                  <input
                    type="text"
                    value={newBuildingCode}
                    onChange={(e) => setNewBuildingCode(e.target.value)}
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
                    onClick={() => handleDeleteBuilding(b.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FLOORS */}
      {activeTab === 'floors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Property Floors</h3>
              <p className="text-xs text-gray-500">Manage floor numbering and assign them to buildings.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddFloor(!showAddFloor)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {showAddFloor ? 'Close Form' : 'Add Floor'}
            </Button>
          </div>

          {showAddFloor && (
            <Card className="border-[#dfcef6] bg-[#f7f2fd]/40 rounded-md p-4">
              <form onSubmit={handleAddFloor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    value={newFloorNumber}
                    onChange={(e) => setNewFloorNumber(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Floor Name</label>
                  <input
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder={newFloorNumber ? `e.g. Floor ${newFloorNumber}` : 'e.g. Floor 1'}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Building Mapping</label>
                  <SearchableSelect
                    value={selectedBuildingId}
                    onChange={(val) => setSelectedBuildingId(val)}
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
                    onClick={() => handleDeleteFloor(f.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ROOMS LIST */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Rooms in this Property</h3>
              <p className="text-xs text-gray-500">All room units registered under {property.name}.</p>
            </div>
            <Link href="/rooms/new">
              <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 rounded-md cursor-pointer">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Room
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {rooms.map((r: any) => (
              <Card key={r.id} className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all">
                <CardContent className="p-3 text-center">
                  <div className="text-sm font-medium text-gray-900">{r.room_number}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">{r.room_type_name || 'Standard'}</div>
                  <Badge variant="outline" className="mt-2 text-[9px] capitalize rounded-sm">
                    {r.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FACILITIES */}
      {activeTab === 'facilities' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Facilities &amp; Amenities</h3>
            <p className="text-xs text-gray-500">Toggle hotel facilities available to guests at this property.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {facilities.map((fac) => (
              <Card
                key={fac.id}
                onClick={() => handleToggleFacility(fac.id, !!fac.is_available)}
                className={`border rounded-md cursor-pointer transition-all ${
                  fac.is_available
                    ? 'border-[#dfcef6] bg-[#f7f2fd]/40 shadow-xs'
                    : 'border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                <CardContent className="p-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#5e2b9d]" />
                      {fac.name}
                    </div>
                    {fac.description && (
                      <div className="text-[10px] text-gray-500 line-clamp-1">{fac.description}</div>
                    )}
                  </div>
                  <Badge
                    variant={fac.is_available ? 'purple' : 'secondary'}
                    className="text-[9px] rounded-sm shrink-0"
                  >
                    {fac.is_available ? 'Available' : 'Disabled'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: POLICIES & TAX */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <Card className="border-gray-200 rounded-md">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-xs font-medium text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#5e2b9d]" />
                Tax Registration &amp; Billing Prefixes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-400 block text-[10px]">GSTIN:</span>
                  <span className="font-medium text-gray-800">{property.gstin || 'Not registered'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">PAN:</span>
                  <span className="font-medium text-gray-800">{property.pan_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">License:</span>
                  <span className="font-medium text-gray-800">{property.business_reg_no || 'N/A'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px]">Invoice Prefix:</span>
                  <span className="font-medium text-gray-800">{property.invoice_prefix || 'INV'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Receipt Prefix:</span>
                  <span className="font-medium text-gray-800">{property.receipt_prefix || 'REC'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 rounded-md">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-xs font-medium text-gray-900">Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-gray-600">
              {property.cancellation_policy || 'Standard cancellation policy applies.'}
            </CardContent>
          </Card>

          <Card className="border-gray-200 rounded-md">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-xs font-medium text-gray-900">Terms &amp; Conditions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-gray-600">
              {property.terms_and_conditions || 'Standard guest terms apply.'}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

