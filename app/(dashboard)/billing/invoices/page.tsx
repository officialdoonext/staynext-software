import React from 'react'
import { getInvoices } from '@/services/billing.service'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { InvoicesClient } from './InvoicesClient'

export const metadata = { title: 'Tax Invoices & Receipts | StayNext' }

export default async function InvoicesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''
  const invoices = propertyId ? await getInvoices(propertyId) : []

  return <InvoicesClient initialInvoices={invoices} propertyId={propertyId} />
}
