import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Wrench, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Create Maintenance Request | StayNext' }

export default function NewMaintenanceRequestPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/maintenance">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Log Maintenance Work Order
            </h1>
            <p className="text-xs text-gray-500">
              Dispatch engineering technicians, mark room out of inventory, and track parts cost.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-600" />
              Ticket Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Location / Room *</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="101">Room 101 (Deluxe King)</option>
                  <option value="103">Room 103 (Executive Double)</option>
                  <option value="204">Room 204 (Deluxe Twin)</option>
                  <option value="302">Room 302 (Ocean Villa)</option>
                  <option value="lobby">Ground Floor Main Lobby</option>
                  <option value="elevator">Guest Elevator #2</option>
                  <option value="pool">Rooftop Pool &amp; Pump</option>
                  <option value="kitchen">Main Commercial Kitchen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Issue Category *</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="hvac">HVAC &amp; Air Conditioning</option>
                  <option value="plumbing">Plumbing &amp; Water Heater</option>
                  <option value="electrical">Electrical &amp; Lighting</option>
                  <option value="carpentry">Furniture &amp; Carpentry</option>
                  <option value="appliance">Smart TV &amp; Minibar</option>
                  <option value="lock">Keycard Lock Mechanism</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority Level</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="urgent">Urgent - Affects Guest Stay</option>
                  <option value="high">High - Same Day Resolution</option>
                  <option value="medium">Medium - Within 48 Hours</option>
                  <option value="low">Low - Routine Scheduled Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assign Technician</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="tech-1">Dave Miller (Chief Engineer)</option>
                  <option value="tech-2">Sam Thorne (HVAC Technician)</option>
                  <option value="tech-3">Ali Hassan (Electrician)</option>
                  <option value="contractor">External Certified Contractor</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Issue Description &amp; Symptoms *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the failure, error codes, leaking components, or guest complaint..."
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="Air conditioning unit rattling loudly on high fan setting and cooling intermittently."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Cost / Parts ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  defaultValue="150"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="blockRoom"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="blockRoom" className="text-xs font-medium text-gray-700">
                  Place room into Out of Order status automatically
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/maintenance">
            <Button variant="outline" type="button" className="text-xs h-9">
              Cancel
            </Button>
          </Link>
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
            <Save className="h-4 w-4 mr-1.5" />
            Dispatch Work Order
          </Button>
        </div>
      </form>
    </div>
  )
}
