import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getRatePlans } from '@/services/rate.service'
import { RatesClient } from './RatesClient'

export const metadata = { title: 'Yield & Rate Management | StayNext' }

export default async function RatesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const plans = propertyId ? await getRatePlans(propertyId) : []

  return <RatesClient initialPlans={plans} propertyId={propertyId} />
}
