import React from 'react'
import { getProperties } from '@/services/property.service'
import { BookingEngineClient } from './BookingEngineClient'

export const metadata = { title: 'Direct Booking Engine & Channels | StayNext' }

export default async function BookingEnginePage() {
  const properties = await getProperties()
  const property = properties[0] || null

  return <BookingEngineClient property={property} channelsCount={5} />
}
