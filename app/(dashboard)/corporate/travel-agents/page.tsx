import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getTravelAgents } from '@/services/corporate.service'
import { TravelAgentsClient } from './TravelAgentsClient'

export const metadata = { title: 'Travel Agents | StayNext' }

export default async function TravelAgentsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const agents = propertyId ? await getTravelAgents(propertyId) : []

  return <TravelAgentsClient initialAgents={agents} propertyId={propertyId} />
}
