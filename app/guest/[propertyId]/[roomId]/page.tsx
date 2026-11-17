import React from 'react'
import { validateGuestRoom, getGuestServiceCatalog } from '@/services/guest.service'
import GuestPortalClient from '@/components/guest/GuestPortalClient'

interface PageProps {
  params: Promise<{ propertyId: string; roomId: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { propertyId, roomId } = await params
  const context = await validateGuestRoom(propertyId, roomId)
  return {
    title: `${context.property?.name || 'Hotel'} - Room ${context.room?.room_number || ''} Guest Services`,
  }
}

export default async function GuestRoomPage({ params, searchParams }: PageProps) {
  const { propertyId, roomId } = await params
  const { token } = await searchParams

  const [context, catalog] = await Promise.all([
    validateGuestRoom(propertyId, roomId, token),
    getGuestServiceCatalog(propertyId),
  ])

  return (
    <GuestPortalClient
      context={context}
      catalog={catalog}
      qrToken={token}
    />
  )
}

