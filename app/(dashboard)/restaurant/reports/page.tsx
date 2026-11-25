import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getRestaurantOrders } from '@/services/restaurant.service'
import { RestaurantReportsClient } from './RestaurantReportsClient'

export const metadata = { title: 'F&B Sales Reports | StayNext' }

export default async function RestaurantReportsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const orders = propertyId ? await getRestaurantOrders(propertyId) : []

  return <RestaurantReportsClient orders={orders} propertyId={propertyId} />
}
