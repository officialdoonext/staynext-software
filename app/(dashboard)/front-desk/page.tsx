import React from 'react'
import { getFrontDeskOperations } from '@/services/reservation.service'
import { getRooms } from '@/services/room.service'
import { getProperties } from '@/services/property.service'
import FrontDeskClient from '@/components/frontdesk/FrontDeskClient'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Front Desk Operations | StayNext' }

export default async function FrontDeskPage() {
  const properties = await getProperties()
  const primaryProp = properties[0]

  if (!primaryProp) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
        <Building2 className="h-8 w-8 text-[#5e2b9d] mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900">No Hotel Properties Found</h3>
        <p className="text-xs text-gray-500 mt-1">Please register a property branch first.</p>
        <div className="mt-4">
          <Link href="/properties/new">
            <Button size="sm" className="bg-[#5e2b9d] text-white text-xs rounded-md cursor-pointer">
              Register Property
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const [ops, { rooms: availableRooms }] = await Promise.all([
    getFrontDeskOperations(primaryProp.id),
    getRooms(primaryProp.id),
  ])

  return (
    <FrontDeskClient
      property={primaryProp}
      properties={properties}
      todayArrivals={ops.todayArrivals}
      todayDepartures={ops.todayDepartures}
      inHouseGuests={ops.inHouseGuests}
      availableRooms={availableRooms}
    />
  )
}
