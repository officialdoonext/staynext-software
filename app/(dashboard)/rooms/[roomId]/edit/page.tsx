import React from 'react'
import { notFound } from 'next/navigation'
import { getRoomById, getRoomTypes } from '@/services/room.service'
import { getBuildings, getFloors } from '@/services/property.service'
import RoomForm from '@/components/forms/RoomForm'

interface PageProps {
  params: Promise<{ roomId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { roomId } = await params
  const room = await getRoomById(roomId)
  return {
    title: room ? `Edit Room ${room.room_number} | StayNext` : 'Edit Room | StayNext',
  }
}

export default async function EditRoomPage({ params }: PageProps) {
  const { roomId } = await params
  const room = await getRoomById(roomId)

  if (!room) {
    notFound()
  }

  const [roomTypes, buildings, floors] = await Promise.all([
    getRoomTypes(room.property_id),
    getBuildings(room.property_id),
    getFloors(room.property_id),
  ])

  return (
    <RoomForm
      propertyId={room.property_id}
      roomTypes={roomTypes}
      buildings={buildings}
      floors={floors}
      initialData={room}
      isEdit={true}
    />
  )
}

