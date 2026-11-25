import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getSeasonalRates } from '@/services/rate.service'
import { SeasonalClient } from './SeasonalClient'

export const metadata = { title: 'Seasonal Multipliers | StayNext' }

export default async function SeasonalPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const rates = propertyId ? await getSeasonalRates(propertyId) : []

  return <SeasonalClient initialRates={rates} propertyId={propertyId} />
}
