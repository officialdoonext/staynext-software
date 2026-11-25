import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getPayments } from '@/services/billing.service'
import { RevenueReportClient } from './RevenueReportClient'

export const metadata = { title: 'Gross Revenue Report | StayNext' }

export default async function RevenueReportPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const payments = propertyId ? await getPayments(propertyId) : []

  return <RevenueReportClient payments={payments} propertyId={propertyId} />
}
