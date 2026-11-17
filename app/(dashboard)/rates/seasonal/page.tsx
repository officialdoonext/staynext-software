import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getSeasonalRates } from '@/services/rate.service'
import { SeasonalClient } from './SeasonalClient'

export const metadata = { title: 'Seasonal Multipliers | StayNext' }

export default async function SeasonalPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const rates = propertyId ? await getSeasonalRates(propertyId) : []

  return <SeasonalClient initialRates={rates} propertyId={propertyId} />
}
