import React from 'react'
import { getReservations } from '@/services/reservation.service'
import { getRooms } from '@/services/room.service'
import { getProperties } from '@/services/property.service'
import ReservationCalendarClient from '@/components/reservations/ReservationCalendarClient'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = { title: 'Reservation Calendar Matrix | StayNext' }

export default async function ReservationCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ propertyId?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const properties = await getProperties()
  
  const currentPropertyId = resolvedParams.propertyId || properties[0]?.id
  const currentProp = properties.find((p) => p.id === currentPropertyId) || properties[0]

  if (!currentProp) {
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

  const [{ reservations }, { rooms }] = await Promise.all([
    getReservations(currentProp.id, { limit: 500 }),
    getRooms(currentProp.id),
  ])

  return (
    <ReservationCalendarClient
      property={currentProp}
      properties={properties}
      rooms={rooms}
      reservations={reservations}
    />
  )
}
