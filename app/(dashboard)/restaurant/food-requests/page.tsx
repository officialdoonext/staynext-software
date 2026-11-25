import React from 'react'
import { getProperties } from '@/services/property.service'
import { getFoodRequests } from '@/services/restaurant.service'
import { FoodRequestsClient } from './FoodRequestsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Food Requests & In-Room Dining | StayNext' }

export default async function FoodRequestsPage() {
  const properties = await getProperties()
  const primaryProp = properties[0]
  const propertyId = primaryProp?.id || ''

  const initialRequests = await getFoodRequests(propertyId)

  return (
    <FoodRequestsClient
      initialRequests={initialRequests}
      propertyId={propertyId}
      properties={properties}
    />
  )
}
