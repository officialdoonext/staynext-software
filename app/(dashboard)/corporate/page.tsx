import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCorporateAccounts } from '@/services/corporate.service'
import { CorporateClient } from './CorporateClient'

export const metadata = { title: 'Corporate & Travel Partners | StayNext' }

export default async function CorporatePage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const accounts = propertyId ? await getCorporateAccounts(propertyId) : []

  return <CorporateClient initialAccounts={accounts} propertyId={propertyId} />
}
