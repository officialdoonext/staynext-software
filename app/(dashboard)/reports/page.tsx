import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getExecutiveReport } from '@/services/report.service'
import { ReportsClient } from './ReportsClient'

export const metadata = { title: 'Reports & Business Intelligence | StayNext' }

export default async function ReportsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const report = propertyId
    ? await getExecutiveReport(propertyId)
    : {
        totalRooms: 0,
        occupiedRooms: 0,
        occupancyPercent: 0,
        totalRevenue: 0,
        roomRevenue: 0,
        fbRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        adr: 0,
        revPar: 0,
        totalReservations: 0,
        completedCheckouts: 0,
        directBookingRatio: 0,
      }

  return <ReportsClient report={report} propertyId={propertyId} />
}
