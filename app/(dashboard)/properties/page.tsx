import React from 'react'
import { Plus, Building2, MapPin, Phone, Mail, Globe, BedDouble, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = { title: 'Property Management | StayNext' }

const demoProperties = [
  {
    id: 'prop-1',
    name: 'Grand Horizon Resort & Spa',
    type: 'Resort',
    address: '8400 Oceanview Blvd, Palm Beach, FL 33480',
    phone: '+1 (561) 555-0199',
    email: 'info@grandhorizonresort.com',
    currency: 'USD',
    timezone: 'America/New_York',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    totalRooms: 64,
    occupiedRooms: 48,
    buildingsCount: 3,
    floorsCount: 4,
    status: 'active',
  },
  {
    id: 'prop-2',
    name: 'City Center Business Hotel',
    type: 'Hotel',
    address: '120 Financial Plaza, Chicago, IL 60601',
    phone: '+1 (312) 555-0144',
    email: 'contact@citycenterhotel.com',
    currency: 'USD',
    timezone: 'America/Chicago',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    totalRooms: 42,
    occupiedRooms: 36,
    buildingsCount: 1,
    floorsCount: 8,
    status: 'active',
  },
  {
    id: 'prop-3',
    name: 'Skyline Service Suites',
    type: 'Service Apartment',
    address: '450 Highland Avenue, Austin, TX 78701',
    phone: '+1 (512) 555-0182',
    email: 'stay@skylinesuites.com',
    currency: 'USD',
    timezone: 'America/Chicago',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    totalRooms: 20,
    occupiedRooms: 18,
    buildingsCount: 1,
    floorsCount: 5,
    status: 'active',
  },
]

export default function PropertiesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Property Portfolio
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage multi-property configurations, buildings, floors, and hotel facilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoProperties.map((prop) => {
          const occupancy = Math.round((prop.occupiedRooms / prop.totalRooms) * 100)
          return (
            <Card key={prop.id} className="border-gray-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{prop.name}</CardTitle>
                      <Badge variant="purple" className="mt-1 text-[10px]">
                        {prop.type}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 flex-1">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{prop.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{prop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{prop.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-[10px] text-gray-400 font-medium">Rooms</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{prop.totalRooms}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-[10px] text-gray-400 font-medium">Occupancy</p>
                    <p className="text-sm font-bold text-indigo-600 mt-0.5">{occupancy}%</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-[10px] text-gray-400 font-medium">Buildings</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{prop.buildingsCount}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100">
                  <span>Check-in: <strong>{prop.checkInTime}</strong></span>
                  <span>Check-out: <strong>{prop.checkOutTime}</strong></span>
                  <span>Currency: <strong>{prop.currency}</strong></span>
                </div>
              </CardContent>

              <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50 rounded-b-lg">
                <Link href={`/properties/settings?id=${prop.id}`} className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure</span>
                </Link>
                <Link href={`/rooms?propertyId=${prop.id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    View Rooms
                  </Button>
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

