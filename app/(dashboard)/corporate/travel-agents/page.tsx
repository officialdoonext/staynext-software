import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTravelAgents } from '@/services/corporate.service'
import { TravelAgentsClient } from './TravelAgentsClient'

export const metadata = { title: 'Travel Agents | StayNext' }

export default async function TravelAgentsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const agents = propertyId ? await getTravelAgents(propertyId) : []

  return <TravelAgentsClient initialAgents={agents} propertyId={propertyId} />
}
