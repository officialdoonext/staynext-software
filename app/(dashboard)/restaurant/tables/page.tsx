import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getRestaurantTables } from '@/services/restaurant.service'
import { TablesClient } from './TablesClient'

export const metadata = { title: 'Tables Layout | StayNext' }

export default async function TablesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const tables = propertyId ? await getRestaurantTables(propertyId) : []

  return <TablesClient initialTables={tables} propertyId={propertyId} />
}
