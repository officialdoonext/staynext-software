import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Shield, User, Key, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Users & Permissions | StayNext' }

const systemUsers = [
  { id: 'usr-1', name: 'Amanda Sterling', email: 'amanda.sterling@oceanbreeze.com', role: 'Property General Manager', access: 'All Properties (Full Admin)', twoFactor: true, lastLogin: '10 mins ago', status: 'active' },
  { id: 'usr-2', name: 'Lucas Bennett', email: 'lucas.b@oceanbreeze.com', role: 'Front Desk Lead', access: 'Front Office & Reservations', twoFactor: true, lastLogin: '25 mins ago', status: 'active' },
  { id: 'usr-3', name: 'Supervisor Elena', email: 'elena.hk@oceanbreeze.com', role: 'Housekeeping Lead', access: 'Housekeeping & Maintenance Only', twoFactor: false, lastLogin: '2 hours ago', status: 'active' },
  { id: 'usr-4', name: 'Sarah Lin, CPA', email: 'sarah.lin@oceanbreeze.com', role: 'Financial Auditor', access: 'Billing, Invoices & Reports', twoFactor: true, lastLogin: 'Yesterday', status: 'active' },
  { id: 'usr-5', name: 'David Miller', email: 'david.m@oceanbreeze.com', role: 'Chief Engineer', access: 'Maintenance & Work Orders', twoFactor: false, lastLogin: '3 days ago', status: 'active' },
]

export default function SettingsUsersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Users &amp; Role-Based Access Control (RBAC)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control staff login credentials, enforce Two-Factor Authentication (2FA), and scope property permissions.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Invite User
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Email</TableHead>
              <TableHead>Role Title</TableHead>
              <TableHead>Permission Boundary</TableHead>
              <TableHead>Two-Factor (2FA)</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold text-gray-900 text-xs">
                  <div>{u.name}</div>
                  <div className="text-[11px] text-gray-400 font-normal">{u.email}</div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-indigo-600">{u.role}</TableCell>
                <TableCell className="text-xs text-gray-600">{u.access}</TableCell>
                <TableCell>
                  <Badge variant={u.twoFactor ? 'success' : 'outline'} className="text-[10px]">
                    {u.twoFactor ? 'Enforced' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{u.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                    Edit Permissions
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
