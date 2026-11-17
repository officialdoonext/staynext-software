'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Shield,
  User,
  Users as UsersIcon,
  Search,
  CheckCircle2,
  Phone,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  PropertyUserItem,
  inviteStaffMember,
} from '@/services/settings.service'
import { toast } from 'sonner'

interface UsersClientProps {
  propertyId: string
  users: PropertyUserItem[]
}

const roleDisplayMap: Record<string, string> = {
  hotel_owner: 'Hotel Owner / Executive',
  property_manager: 'Property General Manager',
  general_manager: 'Operations Manager',
  receptionist: 'Front Desk / Receptionist',
  accountant: 'Financial Auditor / Accountant',
  housekeeping_manager: 'Housekeeping Supervisor',
  housekeeping_staff: 'Housekeeping Associate',
  maintenance_staff: 'Chief Engineer / Maintenance',
  restaurant_manager: 'F&B / Restaurant Manager',
}

export function UsersClient({
  propertyId,
  users: initialUsers,
}: UsersClientProps) {
  const [users, setUsers] = useState<PropertyUserItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('receptionist')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) {
      toast.error('No property loaded')
      return
    }

    setIsSubmitting(true)
    const res = await inviteStaffMember(propertyId, {
      firstName,
      lastName,
      email,
      phone,
      role,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Staff member onboarded successfully')
      setIsAddOpen(false)
      const newUser: PropertyUserItem = {
        id: Math.random().toString(),
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        role,
        department: 'General Operations',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      setUsers([newUser, ...users])
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setRole('receptionist')
    } else {
      toast.error(res.error || 'Failed to onboard staff')
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sora">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900">
              Users &amp; Role-Based Access Control (RBAC)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control staff access privileges across Front Desk, Housekeeping, Financial Auditing, and Operations.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium px-4 cursor-pointer rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Invite Staff Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-md shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          <Input
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 rounded-md"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-56 h-9 px-3 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
        >
          <option value="ALL">All Roles ({users.length})</option>
          <option value="hotel_owner">Hotel Owner</option>
          <option value="property_manager">Property Manager</option>
          <option value="receptionist">Front Desk</option>
          <option value="accountant">Financial Auditor</option>
          <option value="housekeeping_staff">Housekeeping</option>
          <option value="maintenance_staff">Maintenance</option>
        </select>
      </div>

      {/* Staff Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900">No Staff Users Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Invite your team members to grant them access to front desk, billing, or maintenance.
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="mt-4 bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Invite Staff Member
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Staff Member</TableHead>
                <TableHead className="text-xs font-medium">RBAC Role</TableHead>
                <TableHead className="text-xs font-medium">Department</TableHead>
                <TableHead className="text-xs font-medium">Contact Phone</TableHead>
                <TableHead className="text-xs font-medium">Joined Date</TableHead>
                <TableHead className="text-xs font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-xs text-gray-900">
                    <div>{u.fullName}</div>
                    <div className="text-[11px] text-gray-400 font-normal">{u.email || '-'}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-[#5e2b9d]">
                    {roleDisplayMap[u.role] || u.role}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {u.department || 'Operations'}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-500">
                    {u.phone || '-'}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={u.isActive ? 'success' : 'outline'} className="text-[10px] rounded-sm">
                      {u.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite Staff Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[460px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="e.g. Ramesh"
                  className="text-xs rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="e.g. Sharma"
                  className="text-xs rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Work Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ramesh@hotel.com"
                className="text-xs rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="text-xs rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                System Role &amp; Permissions *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
              >
                <option value="receptionist">Front Desk Receptionist (Check-in/out, Folios)</option>
                <option value="property_manager">Property Manager (Full Access)</option>
                <option value="accountant">Financial Auditor (Billing, Invoices, Taxes)</option>
                <option value="housekeeping_manager">Housekeeping Supervisor (Rooms, Laundry)</option>
                <option value="housekeeping_staff">Housekeeping Staff (Room Status Updates)</option>
                <option value="maintenance_staff">Maintenance Staff (Work Orders, Asset Repairs)</option>
                <option value="restaurant_manager">Restaurant &amp; POS Manager (KOT, Menu)</option>
                <option value="hotel_owner">Hotel Owner (Executive Overrides)</option>
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="text-xs rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md font-medium cursor-pointer"
              >
                {isSubmitting ? 'Inviting...' : 'Confirm & Onboard'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

