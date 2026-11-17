import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getOccupancyReport } from '@/services/report.service'
import { OccupancyReportClient } from './OccupancyReportClient'

export const metadata = { title: 'Room Occupancy Yield Report | StayNext' }

export default async function OccupancyReportPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const data = propertyId ? await getOccupancyReport(propertyId) : []

  return <OccupancyReportClient data={data} propertyId={propertyId} />
}
