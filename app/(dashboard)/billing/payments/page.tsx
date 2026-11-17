import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getPayments } from '@/services/billing.service'
import { PaymentsClient } from './PaymentsClient'

export const metadata = { title: 'Payment Transactions | StayNext' }

export default async function PaymentsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const payments = propertyId ? await getPayments(propertyId) : []

  return <PaymentsClient initialPayments={payments} propertyId={propertyId} />
}
