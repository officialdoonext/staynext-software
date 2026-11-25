'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  UserCog,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  CalendarCheck,
  Users,
  Search,
  Download,
  Trash2,
  FolderTree,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { EmployeeRecord, deleteEmployee } from '@/services/employee.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface EmployeesClientProps {
  initialEmployees: EmployeeRecord[]
  propertyId: string
}

export function EmployeesClient({ initialEmployees, propertyId }: EmployeesClientProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeRecord[]>(initialEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = employees.filter((e) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      e.fullName.toLowerCase().includes(q) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.phone && e.phone.toLowerCase().includes(q)) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(q)) ||
      e.role.toLowerCase().includes(q)
    )
  })

  const activeCount = employees.filter((e) => e.isActive).length

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    const res = await deleteEmployee(deleteId)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Staff record removed')
      setEmployees((prev) => prev.filter((e) => e.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete employee')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No staff members to export')
      return
    }
    const headers = ['Full Name', 'Department', 'Role', 'Email', 'Phone', 'Hire Date', 'Status']
    const rows = filtered.map((e) => [
      `"${e.fullName}"`,
      `"${e.departmentName || '-'}"`,
      `"${e.role}"`,
      `"${e.email || '-'}"`,
      `"${e.phone || '-'}"`,
      e.hireDate || '-',
      e.isActive ? 'Active' : 'Inactive',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `employees_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Employee &amp; Staff Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Departmental rosters, role permissions, shift schedules, and staff attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/employees/departments">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <FolderTree className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Departments
            </Button>
          </Link>
          <Link href="/employees/schedules">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <CalendarCheck className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Shift Schedules
            </Button>
          </Link>
          <Link href="/employees/new">
            <Button
              size="sm"
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Staff Member
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Staff Registered</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{employees.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Hotel team roster</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Active Personnel</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{activeCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">On active payroll</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Operational Readiness</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">100%</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Shifts covered</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff, department, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Staff Members Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No employees match your search query.'
              : 'Add receptionists, housekeepers, kitchen staff, and managers to your property team.'}
          </p>
          <div className="mt-6">
            <Link href="/employees/new">
              <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md">
                <Plus className="h-4 w-4 mr-1.5" />
                Add First Staff Member
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Name</TableHead>
                <TableHead className="text-xs font-medium">Role &amp; Permissions</TableHead>
                <TableHead className="text-xs font-medium">Department</TableHead>
                <TableHead className="text-xs font-medium">Contact Details</TableHead>
                <TableHead className="text-xs font-medium">Hire Date</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-xs text-gray-900">
                    {emp.fullName}
                  </TableCell>
                  <TableCell className="text-xs capitalize text-gray-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-gray-100 text-gray-800 text-[11px] capitalize">
                      {emp.role.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{emp.departmentName}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    <div>{emp.email || '-'}</div>
                    <div className="text-[11px] text-gray-400">{emp.phone || '-'}</div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {emp.hireDate ? formatDate(emp.hireDate) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.isActive ? 'success' : 'outline'}
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(emp.id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Remove Staff Member</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove this employee from your property directory?
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
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md font-medium"
            >
              {isDeleting ? 'Removing...' : 'Remove Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

