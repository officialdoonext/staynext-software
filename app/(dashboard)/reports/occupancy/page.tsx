import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getOccupancyReport } from '@/services/report.service'
import { OccupancyReportClient } from './OccupancyReportClient'

export const metadata = { title: 'Room Occupancy Yield Report | StayNext' }

export default async function OccupancyReportPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const data = propertyId ? await getOccupancyReport(propertyId) : []

  return <OccupancyReportClient data={data} propertyId={propertyId} />
}
