'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DepartmentRecord, createEmployee } from '@/services/employee.service'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import { toast } from 'sonner'

interface EmployeeFormProps {
  departments: DepartmentRecord[]
  propertyId: string
}

export function EmployeeForm({ departments, propertyId }: EmployeeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'receptionist',
    departmentId: departments.length > 0 ? departments[0].id : '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Please enter first and last name')
      return
    }

    setIsSubmitting(true)
    const res = await createEmployee({
      propertyId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      role: form.role,
      departmentId: form.departmentId || undefined,
      hireDate: form.hireDate,
      salary: parseFloat(form.salary) || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Staff member onboarded successfully!')
      router.push('/employees')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to onboard employee')
    }
  }

  const roleOptions = [
    { value: 'receptionist', label: 'Front Desk Receptionist' },
    { value: 'housekeeper', label: 'Housekeeping Room Attendant' },
    { value: 'maintenance_tech', label: 'Engineering & Maintenance Tech' },
    { value: 'chef', label: 'Chef / Kitchen Staff' },
    { value: 'waiter', label: 'F&B Service / Waitstaff' },
    { value: 'duty_manager', label: 'Duty Manager' },
    { value: 'property_manager', label: 'Property General Manager' },
  ]

  const departmentOptions = departments.length === 0
    ? [{ value: '', label: 'General Hotel Operations' }]
    : departments.map((d) => ({ value: d.id, label: d.name }))

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
              Onboard New Staff Member
            </h1>
            <p className="text-xs text-gray-500">
              Create an operational staff profile, assign department, role duties, and compensation.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-gray-200 shadow-2xs rounded-md">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2 font-sora">
              <UserPlus className="h-4 w-4 text-[#5e2b9d]" />
              Staff Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Verma"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="r.verma@hotel.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Operational Role *</label>
                <SearchableSelect
                  value={form.role}
                  onChange={(val) => setForm({ ...form, role: val })}
                  options={roleOptions}
                  allowAdd={true}
                  addNewLabel="Add Custom Role"
                  placeholder="Select operational role..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <SearchableSelect
                  value={form.departmentId}
                  onChange={(val) => setForm({ ...form, departmentId: val })}
                  options={departmentOptions}
                  allowAdd={true}
                  addNewLabel="Add Department"
                  placeholder="Select department..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Joining / Hire Date</label>
                <CustomDatePicker
                  value={form.hireDate}
                  onChange={(d) => setForm({ ...form, hireDate: d })}
                  placeholder="Select hire date..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Salary ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 3500.00"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" type="button" className="text-xs cursor-pointer rounded-md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs font-medium cursor-pointer rounded-md"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSubmitting ? 'Onboarding...' : 'Save & Onboard'}
          </Button>
        </div>
      </form>
    </div>
  )
}

