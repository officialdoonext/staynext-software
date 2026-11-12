import React from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Save, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Onboard Employee | StayNext' }

export default function NewEmployeePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Onboard Staff Member
            </h1>
            <p className="text-xs text-gray-500">
              Create an employee profile, assign operational departments, roles, and software permissions.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-600" />
              Personal &amp; Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Maria"
                  defaultValue="Lucas"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Santos"
                  defaultValue="Bennett"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  placeholder="lucas.b@staynext-resort.com"
                  defaultValue="lucas.bennett@hotel.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  defaultValue="+1 (555) 772-9102"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="front_desk">Front Desk &amp; Concierge</option>
                  <option value="housekeeping">Housekeeping Operations</option>
                  <option value="maintenance">Maintenance &amp; Engineering</option>
                  <option value="fb">Food &amp; Beverage / Restaurant</option>
                  <option value="management">Executive &amp; General Management</option>
                  <option value="finance">Finance &amp; Accounting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">System Role &amp; Access Tier *</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="receptionist">Receptionist / Front Desk Agent</option>
                  <option value="manager">Property Duty Manager</option>
                  <option value="housekeeper">Housekeeping Room Attendant</option>
                  <option value="accountant">Financial Accountant / Auditor</option>
                  <option value="admin">Tenant Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hourly Rate or Salary ($)</label>
                <input
                  type="text"
                  placeholder="$24.00 / hr"
                  defaultValue="$26.50 / hr"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  defaultValue="2026-11-15"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/employees">
            <Button variant="outline" type="button" className="text-xs h-9">
              Cancel
            </Button>
          </Link>
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
            <Save className="h-4 w-4 mr-1.5" />
            Save &amp; Send Invite Email
          </Button>
        </div>
      </form>
    </div>
  )
}
