import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getGuestsReport } from '@/services/report.service'
import { GuestsReportClient } from './GuestsReportClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Guest Profiles & Loyalty Analytics | StayNext' }

export default async function GuestReportsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const analytics = propertyId
    ? await getGuestsReport(propertyId)
    : { totalGuests: 0, vipCount: 0, topGuests: [] }

  return <GuestsReportClient analytics={analytics} propertyId={propertyId} />
}
