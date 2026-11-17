import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getInvoices } from '@/services/billing.service'
import { InvoicesClient } from './InvoicesClient'

export const metadata = { title: 'Tax Invoices & Receipts | StayNext' }

export default async function InvoicesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const invoices = propertyId ? await getInvoices(propertyId) : []

  return <InvoicesClient initialInvoices={invoices} propertyId={propertyId} />
}
