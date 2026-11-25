'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Layers,
  Plus,
  BedDouble,
  Building2,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  FloorItem,
  BuildingItem,
  PropertyItem,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloors,
  getBuildings,
} from '@/services/property.service'
import { toast } from 'sonner'

interface RoomFloorsClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  buildings: BuildingItem[]
  initialFloors: FloorItem[]
}

export default function RoomFloorsClient({
  property: initialProp,
  properties,
  buildings: initialBuildings,
  initialFloors,
}: RoomFloorsClientProps) {
  const searchParams = useSearchParams()
  const initialBuildingParam = searchParams.get('buildingId') || 'all'

  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings)
  const [floors, setFloors] = useState<FloorItem[]>(initialFloors)
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState(initialBuildingParam)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState<FloorItem | null>(null)
  const [floorNumber, setFloorNumber] = useState<number | ''>('')
  const [floorName, setFloorName] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<FloorItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handlePropertyChange = async (propId: string) => {
    setSelectedPropertyId(propId)
    const [freshFloors, freshBuildings] = await Promise.all([
      getFloors(propId),
      getBuildings(propId),
    ])
    setFloors(freshFloors)
    setBuildings(freshBuildings)
  }

  const openCreateModal = () => {
    setEditingFloor(null)
    setFloorNumber('')
    setFloorName('')
    setBuildingId(buildings.length > 0 ? buildings[0].id : '')
    setIsModalOpen(true)
  }

  const openEditModal = (f: FloorItem) => {
    setEditingFloor(f)
    setFloorNumber(f.floor_number)
    setFloorName(f.name || `Floor ${f.floor_number}`)
    setBuildingId(f.building_id || '')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    if (editingFloor) {
      const res = await updateFloor(editingFloor.id, {
        floor_number: Number(floorNumber),
        name: floorName.trim() || `Floor ${floorNumber}`,
        building_id: buildingId || undefined,
      })
      setIsSubmitting(false)

      if (res.success) {
        toast.success('Floor updated')
        const bld = buildings.find((b) => b.id === buildingId)
        setFloors((prev) =>
          prev.map((f) =>
            f.id === editingFloor.id
              ? {
                  ...f,
                  floor_number: Number(floorNumber),
                  name: floorName.trim() || `Floor ${floorNumber}`,
                  building_id: buildingId || undefined,
                  building_name: bld?.name || 'Main Building',
                }
              : f
          )
        )
        setIsModalOpen(false)
      } else {
        toast.error(res.error || 'Failed to update floor')
      }
    } else {
      const res = await createFloor({
        property_id: selectedPropertyId,
        building_id: buildingId || undefined,
        floor_number: Number(floorNumber),
        name: floorName.trim() || `Floor ${floorNumber}`,
      })
      setIsSubmitting(false)

      if (res.success && res.data) {
        toast.success('Floor created')
        const bld = buildings.find((b) => b.id === buildingId)
        setFloors((prev) => [
          ...prev,
          {
            ...res.data,
            building_name: bld?.name || 'Main Building',
            total_rooms: 0,
            is_active: true,
          },
        ])
        setIsModalOpen(false)
      } else {
        toast.error(res.error || 'Failed to create floor')
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const res = await deleteFloor(deleteTarget.id)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Floor removed')
      setFloors((prev) => prev.filter((f) => f.id !== deleteTarget.id))
      setDeleteTarget(null)
    } else {
      toast.error(res.error || 'Failed to delete floor')
    }
  }

  const filteredFloors = floors.filter((f) => {
    const matchesSearch =
      (f.name && f.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.building_name && f.building_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.floor_number.toString().includes(searchTerm)
    const matchesBuilding =
      selectedBuildingFilter === 'all' || f.building_id === selectedBuildingFilter
    return matchesSearch && matchesBuilding
  })

  const totalRoomsCount = floors.reduce((acc, f) => acc + (f.total_rooms || 0), 0)

  return (
    <div className="space-y-6 w-full pb-16 font-sora">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/rooms">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer rounded-md border-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-gray-900">
                Floor Levels &amp; Layout
              </h1>
              <Badge variant="outline" className="text-[11px] rounded-sm font-mono">
                {floors.length} {floors.length === 1 ? 'Floor' : 'Floors'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure floors, elevation levels, and building block associations for room assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <div className="w-52">
              <SearchableSelect
                value={selectedPropertyId}
                onChange={(val) => handlePropertyChange(val)}
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select property..."
              />
            </div>
          )}

          <Link href="/rooms/buildings">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 rounded-md cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Manage Building Blocks
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium px-4 cursor-pointer rounded-md shadow-2xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Floor
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Registered Floors</span>
            <p className="text-2xl font-medium text-gray-900 mt-1 font-mono">
              {floors.length}
            </p>
          </div>
          <div className="p-2.5 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Associated Building Blocks</span>
            <p className="text-2xl font-medium text-gray-900 mt-1 font-mono">
              {buildings.length}
            </p>
          </div>
          <div className="p-2.5 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Rooms Allocated</span>
            <p className="text-2xl font-medium text-gray-900 mt-1 font-mono">
              {totalRoomsCount}
            </p>
          </div>
          <div className="p-2.5 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
            <BedDouble className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search floor name or level number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 rounded-md"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-56">
          <SearchableSelect
            value={selectedBuildingFilter}
            onChange={(val) => setSelectedBuildingFilter(val)}
            options={[
              { value: 'all', label: `All Building Blocks (${buildings.length})` },
              ...buildings.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
      </div>

      {/* Floors Table */}
      {filteredFloors.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900">No Floors Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Configure hotel floor levels to organize room inventory and housekeeping routes.
          </p>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="mt-4 bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Floor
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Floor Number</TableHead>
                <TableHead className="text-xs font-medium">Floor Title / Name</TableHead>
                <TableHead className="text-xs font-medium">Building Block / Wing</TableHead>
                <TableHead className="text-xs font-medium">Configured Rooms</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFloors.map((f) => (
                <TableRow key={f.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#f7f2fd] text-[#5e2b9d] font-mono text-xs font-medium">
                      {f.floor_number}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-xs text-gray-900">
                    {f.name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      {f.building_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-gray-900">
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <BedDouble className="h-3.5 w-3.5 text-gray-400" />
                      {f.total_rooms || 0} {f.total_rooms === 1 ? 'Room' : 'Rooms'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={f.is_active ? 'success' : 'outline'}
                      className="text-[10px] rounded-sm"
                    >
                      {f.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(f)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-[#5e2b9d] cursor-pointer rounded-md"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(f)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[440px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              {editingFloor ? 'Edit Floor Level' : 'Add Floor Level'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Floor Elevation Number *
              </label>
              <Input
                type="number"
                value={floorNumber}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value) || 0
                  setFloorNumber(val)
                  if (!editingFloor && val !== '') setFloorName(`Floor ${val}`)
                }}
                placeholder="e.g. 1"
                required
                className="text-xs rounded-md font-mono"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Use 0 for Ground Floor, 1 for 1st Floor, -1 for Basement, etc.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Floor Title / Label *
              </label>
              <Input
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                required
                placeholder="e.g. Ground Floor, 1st Floor - Club Wing"
                className="text-xs rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Assigned Building Block / Wing
              </label>
              <SearchableSelect
                value={buildingId}
                onChange={(val) => setBuildingId(val)}
                options={[
                  { value: '', label: 'Main Building / Unassigned' },
                  ...buildings.map((b) => ({
                    value: b.id,
                    label: `${b.name} ${b.code ? `(${b.code})` : ''}`,
                  })),
                ]}
                allowAdd={true}
                addNewLabel="Add Building Block"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md font-medium cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingFloor ? 'Update Floor' : 'Create Floor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              Delete Floor Level
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900">{deleteTarget?.name}</strong>? Rooms located on this floor will be unlinked.
          </p>
          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="text-xs rounded-md cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-md font-medium cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Floor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

