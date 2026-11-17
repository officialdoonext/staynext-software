import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCorporateContracts, getCorporateAccounts } from '@/services/corporate.service'
import { ContractsClient } from './ContractsClient'

export const metadata = { title: 'Corporate Contracts | StayNext' }

export default async function ContractsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

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
