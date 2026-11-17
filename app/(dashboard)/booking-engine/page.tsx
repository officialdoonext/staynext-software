import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { BookingEngineClient } from './BookingEngineClient'

export const metadata = { title: 'Direct Booking Engine & Channels | StayNext' }

export default async function BookingEnginePage() {
  const supabase = await createClient()

  let property: any = null
  try {
    const { data: props } = await supabase.from('properties').select('*').limit(1)
    if (props && props.length > 0) {
      property = props[0]
    }
  } catch {}

  return <BookingEngineClient property={property} channelsCount={5} />
}
