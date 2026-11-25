import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getRatePlans } from '@/services/rate.service'
import { RatesClient } from './RatesClient'

export const metadata = { title: 'Yield & Rate Management | StayNext' }

export default async function RatesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const plans = propertyId ? await getRatePlans(propertyId) : []

  return <RatesClient initialPlans={plans} propertyId={propertyId} />
}
