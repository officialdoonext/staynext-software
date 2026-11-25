import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getRestaurantTables } from '@/services/restaurant.service'
import { TablesClient } from './TablesClient'

export const metadata = { title: 'Tables Layout | StayNext' }

export default async function TablesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const tables = propertyId ? await getRestaurantTables(propertyId) : []

  return <TablesClient initialTables={tables} propertyId={propertyId} />
}
