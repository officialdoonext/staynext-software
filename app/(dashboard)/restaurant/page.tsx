import React from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  getRestaurantOrders,
  getRestaurantTables,
  getMenuItems,
} from '@/services/restaurant.service'
import { RestaurantClient } from './RestaurantClient'

export const metadata = { title: 'Restaurant & POS | StayNext' }

export default async function RestaurantPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const orders = propertyId ? await getRestaurantOrders(propertyId) : []
  const tables = propertyId ? await getRestaurantTables(propertyId) : []
  const menuItems = propertyId ? await getMenuItems(propertyId) : []

  // Fetch rooms for room delivery
  let rooms: Array<{ id: string; roomNumber: string }> = []
  try {
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id, room_number')
      .eq('property_id', propertyId)
      .order('room_number', { ascending: true })

    if (roomsData) {
      rooms = roomsData.map((r: any) => ({ id: r.id, roomNumber: r.room_number }))
    }
  } catch {}

  return (
    <RestaurantClient
      initialOrders={orders}
      tables={tables}
      menuItems={menuItems}
      propertyId={propertyId}
      rooms={rooms}
    />
  )
}
