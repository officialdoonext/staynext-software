import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getFolios } from '@/services/billing.service'
import { BillingClient } from './BillingClient'

export const metadata = { title: 'Billing & Folios | StayNext' }

export default async function BillingPage() {
  const supabase = await createClient()

  // 1. Get current tenant and default property
  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const folios = propertyId ? await getFolios(propertyId) : []

  // Compute today's collected payments
  let todayCollected = 0
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('property_id', propertyId)
      .gte('created_at', `${today}T00:00:00`)
      .eq('status', 'completed')

    todayCollected = (payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  } catch {}

  return (
    <BillingClient
      initialFolios={folios}
      propertyId={propertyId}
      todayCollected={todayCollected}
    />
  )
}
