import React from 'react'
import { getRooms, getRoomTypes } from '@/services/room.service'
import { getBuildings, getFloors, getProperties } from '@/services/property.service'
import RoomsListClient from '@/components/rooms/RoomsListClient'

export const metadata = { title: 'Rooms Management | StayNext' }

export default async function RoomsPage() {
  const properties = await getProperties()
  const primaryProp = properties[0]

  const [{ rooms }, roomTypes, buildings, floors] = await Promise.all([
    getRooms(primaryProp?.id),
    getRoomTypes(primaryProp?.id),
    getBuildings(primaryProp?.id),
    getFloors(primaryProp?.id),
  ])

  return (
    <RoomsListClient
      initialRooms={rooms}
      roomTypes={roomTypes}
      buildings={buildings}
      floors={floors}
      properties={properties}
    />
  )
}
