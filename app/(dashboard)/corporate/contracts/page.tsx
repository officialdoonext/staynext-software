import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getCorporateContracts, getCorporateAccounts } from '@/services/corporate.service'
import { ContractsClient } from './ContractsClient'

export const metadata = { title: 'Corporate Contracts | StayNext' }

export default async function ContractsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const contracts = propertyId ? await getCorporateContracts(propertyId) : []
  const accounts = propertyId ? await getCorporateAccounts(propertyId) : []

  return (
    <ContractsClient
      initialContracts={contracts}
      accounts={accounts}
      propertyId={propertyId}
    />
  )
}
