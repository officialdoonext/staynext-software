import React from 'react'
import { getPayments } from '@/services/billing.service'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { PaymentsClient } from './PaymentsClient'

export const metadata = { title: 'Payment Transactions | StayNext' }

export default async function PaymentsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''
  const payments = propertyId ? await getPayments(propertyId) : []

  return <PaymentsClient initialPayments={payments} propertyId={propertyId} />
}
