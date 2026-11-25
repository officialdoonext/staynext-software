'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  FolderTree,
  Users,
  Trash2,
  Building,
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
  DepartmentRecord,
  createDepartment,
  deleteDepartment,
} from '@/services/employee.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DepartmentsClientProps {
  initialDepartments: DepartmentRecord[]
  propertyId: string
}

export function DepartmentsClient({ initialDepartments, propertyId }: DepartmentsClientProps) {
  const router = useRouter()
  const [departments, setDepartments] = useState<DepartmentRecord[]>(initialDepartments)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter a department name')
      return
    }

    setIsSubmitting(true)
    const res = await createDepartment({
      propertyId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Department created successfully')
      setIsAddOpen(false)
      setForm({ name: '', description: '' })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create department')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteDepartment(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Department deleted')
      setDepartments((prev) => prev.filter((d) => d.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete department')
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Departments &amp; Functional Divisions
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Organize hotel teams into Front Office, Housekeeping, F&amp;B Service, Kitchen, and Maintenance.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <FolderTree className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Departments Configured</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Set up organizational units like Front Office, Housekeeping, Food &amp; Beverage, and Security.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Department
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md">
                      <FolderTree className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 font-sora">{dept.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(dept.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                  {dept.description || 'Hotel operational division'}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span>{dept.employeeCount || 0} Assigned Staff</span>
                </span>
                <Badge variant="outline" className="text-[10px] rounded-sm">
                  Active
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Create Department</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Define operational team unit and supervisory scope.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department Name *</label>
              <input
                type="text"
                placeholder="e.g. Front Desk &amp; Concierge"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Scope of work and responsibilities..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
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
                {isSubmitting ? 'Saving...' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Department</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this department? Staff members will remain in the employee directory.
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

