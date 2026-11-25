'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Plus,
  Layers,
  BedDouble,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  BuildingItem,
  PropertyItem,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getBuildings,
} from '@/services/property.service'
import { toast } from 'sonner'

interface RoomBuildingsClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialBuildings: BuildingItem[]
}

export default function RoomBuildingsClient({
  property: initialProp,
  properties,
  initialBuildings,
}: RoomBuildingsClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<BuildingItem | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BuildingItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handlePropertyChange = async (propId: string) => {
    setSelectedPropertyId(propId)
    const fresh = await getBuildings(propId)
    setBuildings(fresh)
  }

  const openCreateModal = () => {
    setEditingBuilding(null)
    setName('')
    setCode('')
    setDescription('')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const openEditModal = (bld: BuildingItem) => {
    setEditingBuilding(bld)
    setName(bld.name)
    setCode(bld.code || '')
    setDescription(bld.description || '')
    setIsActive(bld.is_active)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Building name is required')
      return
    }

    setIsSubmitting(true)
    if (editingBuilding) {
      const res = await updateBuilding(editingBuilding.id, {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        is_active: isActive,
      })
      setIsSubmitting(false)

      if (res.success) {
        toast.success('Building block updated')
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === editingBuilding.id
              ? {
                  ...b,
                  name: name.trim(),
                  code: code.trim(),
                  description: description.trim(),
                  is_active: isActive,
                }
              : b
          )
        )
        setIsModalOpen(false)
      } else {
        toast.error(res.error || 'Failed to update building block')
      }
    } else {
      const res = await createBuilding({
        property_id: selectedPropertyId,
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      })
      setIsSubmitting(false)

      if (res.success && res.data) {
        toast.success('Building block created')
        setBuildings((prev) => [
          ...prev,
          {
            ...res.data,
            total_floors: 0,
            total_rooms: 0,
            is_active: true,
          },
        ])
        setIsModalOpen(false)
      } else {
        toast.error(res.error || 'Failed to create building block')
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const res = await deleteBuilding(deleteTarget.id)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Building block removed')
      setBuildings((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
    } else {
      toast.error(res.error || 'Failed to delete building')
    }
  }

  const filteredBuildings = buildings.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && b.is_active) ||
      (statusFilter === 'inactive' && !b.is_active)
    return matchesSearch && matchesStatus
  })

  const totalFloorsCount = buildings.reduce((acc, b) => acc + (b.total_floors || 0), 0)
  const totalRoomsCount = buildings.reduce((acc, b) => acc + (b.total_rooms || 0), 0)

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
                Building Blocks &amp; Wings
              </h1>
              <Badge variant="outline" className="text-[11px] rounded-sm font-mono">
                {buildings.length} {buildings.length === 1 ? 'Block' : 'Blocks'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage architectural wings, towers, blocks, and villas across your hotel properties.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <Link href="/rooms/floors">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 rounded-md cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Manage Floors
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium px-4 cursor-pointer rounded-md shadow-2xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Building Block
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Building Blocks / Wings</span>
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
            <span className="text-xs text-gray-500 font-medium">Total Linked Floors</span>
            <p className="text-2xl font-medium text-gray-900 mt-1 font-mono">
              {totalFloorsCount}
            </p>
          </div>
          <div className="p-2.5 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Configured Rooms</span>
            <p className="text-2xl font-medium text-gray-900 mt-1 font-mono">
              {totalRoomsCount}
            </p>
          </div>
          <div className="p-2.5 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
            <BedDouble className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search block name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 rounded-md"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Statuses ({buildings.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Buildings Cards Grid */}
      {filteredBuildings.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900">No Building Blocks Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Organize your hotel rooms into architectural towers, blocks, or wings (e.g. East Wing, Tower A).
          </p>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="mt-4 bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Building Block
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.map((b) => (
            <Card
              key={b.id}
              className="border-gray-200 shadow-2xs hover:border-[#5e2b9d]/40 transition-all rounded-md flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-medium text-gray-900">
                      {b.name}
                    </CardTitle>
                    {b.code && (
                      <Badge variant="outline" className="text-[10px] rounded-sm font-mono mt-1 text-gray-600">
                        Code: {b.code}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={b.is_active ? 'success' : 'outline'}
                    className="text-[10px] rounded-sm"
                  >
                    {b.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-gray-500 min-h-[32px] line-clamp-2 leading-relaxed">
                  {b.description || 'No description provided for this building wing.'}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-gray-400" /> Floors
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 font-mono">
                      {b.total_floors || 0} Levels
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <BedDouble className="h-3 w-3 text-gray-400" /> Rooms
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 font-mono">
                      {b.total_rooms || 0} Rooms
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <Link
                    href={`/rooms/floors?buildingId=${b.id}`}
                    className="text-xs text-[#5e2b9d] hover:text-[#4d2282] font-medium flex items-center gap-1"
                  >
                    View Floors &rarr;
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(b)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-[#5e2b9d] cursor-pointer rounded-md"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(b)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[460px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              {editingBuilding ? 'Edit Building Block / Wing' : 'Add Building Block / Wing'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Building / Wing Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. North Wing, Tower A, Palm Villas"
                className="text-xs rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Short Code / Acronym
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. NW, T-A, PV"
                className="text-xs rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description / Location Notes
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe facilities or architectural location of this block..."
                className="text-xs rounded-md"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isBuildingActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-[#5e2b9d] rounded border-gray-300 focus:ring-[#5e2b9d] cursor-pointer"
              />
              <label htmlFor="isBuildingActive" className="text-xs text-gray-700 cursor-pointer">
                Active &amp; Available for Room Assignments
              </label>
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
                {isSubmitting ? 'Saving...' : editingBuilding ? 'Update Building Block' : 'Create Building Block'}
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
              Delete Building Block
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900">{deleteTarget?.name}</strong>? Rooms and floors currently assigned will be unlinked.
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
              {isDeleting ? 'Deleting...' : 'Delete Building Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

