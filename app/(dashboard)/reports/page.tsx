import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getExecutiveReport } from '@/services/report.service'
import { ReportsClient } from './ReportsClient'

export const metadata = { title: 'Reports & Business Intelligence | StayNext' }

export default async function ReportsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

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
