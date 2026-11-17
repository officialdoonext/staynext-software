import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getRestaurantOrders } from '@/services/restaurant.service'
import { RestaurantReportsClient } from './RestaurantReportsClient'

export const metadata = { title: 'F&B Sales Reports | StayNext' }

export default async function RestaurantReportsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const orders = propertyId ? await getRestaurantOrders(propertyId) : []

  return <RestaurantReportsClient orders={orders} propertyId={propertyId} />
}
