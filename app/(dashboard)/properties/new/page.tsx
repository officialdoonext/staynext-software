import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Add Property | StayNext' }

export default function NewPropertyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Register New Property
            </h1>
            <p className="text-xs text-gray-500">
              Configure property profile, operational timings, and localization settings.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              General Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Property Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Vista Resort &amp; Spa"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="Ocean Breeze Boutique Hotel"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Property Type</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="hotel">Boutique / Luxury Hotel</option>
                  <option value="resort">Resort &amp; Spa</option>
                  <option value="lodge">Lodge / Guest House</option>
                  <option value="apartment">Serviced Apartments</option>
                  <option value="motel">Motel / Highway Inn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email *</label>
                <input
                  type="email"
                  placeholder="frontdesk@property.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="contact@oceanbreeze.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="+1 (555) 987-6543"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="1200 Coastal Highway, Suite 100"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="450 Pacific Coast Hwy"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City &amp; Country</label>
                <input
                  type="text"
                  placeholder="Santa Monica, CA, United States"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="Santa Monica, USA"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Timings */}
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900">
              Check-in &amp; Check-out Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Standard Check-in Time</label>
                <input
                  type="time"
                  defaultValue="15:00"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Standard Check-out Time</label>
                <input
                  type="time"
                  defaultValue="11:00"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Room Capacity</label>
                <input
                  type="number"
                  defaultValue="40"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/properties">
            <Button variant="outline" type="button" className="text-xs h-9">
              Cancel
            </Button>
          </Link>
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
            <Save className="h-4 w-4 mr-1.5" />
            Create Property
          </Button>
        </div>
      </form>
    </div>
  )
}
