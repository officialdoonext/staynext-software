import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getFolios } from '@/services/billing.service'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { BillingClient } from './BillingClient'

export const metadata = { title: 'Billing & Folios | StayNext' }

export default async function BillingPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''
  const folios = propertyId ? await getFolios(propertyId) : []

  // Compute today's collected payments
  let todayCollected = 0
  if (propertyId) {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('property_id', propertyId)
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'completed')

      todayCollected = (payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
    } catch {}
  }

  return (
    <BillingClient
      initialFolios={folios}
      propertyId={propertyId}
      todayCollected={todayCollected}
    />
  )
}
