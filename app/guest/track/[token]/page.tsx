import React from 'react'
import { getGuestRequestStatus, getGuestOrderStatus } from '@/services/guest.service'
import GuestTrackingClient from '@/components/guest/GuestTrackingClient'

interface PageProps {
  params: Promise<{ token: string }>
}

export const metadata = {
  title: 'Track Request | In-Room Guest Services | StayNext',
}

export default async function GuestTrackingPage({ params }: PageProps) {
  const { token } = await params

  const [requestData, orderData] = await Promise.all([
    getGuestRequestStatus(token),
    getGuestOrderStatus(token),
  ])

  return (
    <GuestTrackingClient
      requestData={requestData}
      orderData={orderData}
    />
  )
}

