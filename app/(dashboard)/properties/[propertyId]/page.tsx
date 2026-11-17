import React from 'react'
import { notFound } from 'next/navigation'
import {
  getPropertyById,
  getBuildings,
  getFloors,
  getFacilitiesWithPropertyStatus,
} from '@/services/property.service'
import { getRooms } from '@/services/room.service'
import PropertyDetailClient from '@/components/properties/PropertyDetailClient'

interface PageProps {
  params: Promise<{ propertyId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { propertyId } = await params
  const property = await getPropertyById(propertyId)
  return {
    title: property ? `${property.name} | StayNext` : 'Property Details | StayNext',
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { propertyId } = await params
  const property = await getPropertyById(propertyId)

  if (!property) {
    notFound()
  }

  const [buildings, floors, facilities, { rooms }] = await Promise.all([
    getBuildings(propertyId),
    getFloors(propertyId),
    getFacilitiesWithPropertyStatus(propertyId),
    getRooms(propertyId),
  ])

  return (
    <PropertyDetailClient
      property={property}
      buildings={buildings}
      floors={floors}
      facilities={facilities}
      rooms={rooms}
    />
  )
}

