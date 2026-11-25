import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getGuestsReport } from '@/services/report.service'
import { GuestsReportClient } from './GuestsReportClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Guest Profiles & Loyalty Analytics | StayNext' }

export default async function GuestReportsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const analytics = propertyId
    ? await getGuestsReport(propertyId)
    : { totalGuests: 0, vipCount: 0, topGuests: [] }

  return <GuestsReportClient analytics={analytics} propertyId={propertyId} />
}
