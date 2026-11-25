import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getCorporateAccounts } from '@/services/corporate.service'
import { CorporateClient } from './CorporateClient'

export const metadata = { title: 'Corporate & Travel Partners | StayNext' }

export default async function CorporatePage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const accounts = propertyId ? await getCorporateAccounts(propertyId) : []

  return <CorporateClient initialAccounts={accounts} propertyId={propertyId} />
}
