import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProperties } from '@/services/property.service'
import {
  getRestaurantOrders,
  getRestaurantTables,
  getMenuItems,
} from '@/services/restaurant.service'
import { RestaurantClient } from './RestaurantClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Restaurant & POS | StayNext' }

export default async function RestaurantPage() {
  const properties = await getProperties()
  const primaryProp = properties[0]
  const propertyId = primaryProp?.id || ''

  const orders = propertyId ? await getRestaurantOrders(propertyId) : []
  const tables = propertyId ? await getRestaurantTables(propertyId) : []
  const menuItems = await getMenuItems(propertyId)

  // Fetch rooms for room delivery
  let rooms: Array<{ id: string; roomNumber: string }> = []
  if (propertyId) {
    try {
      const admin = createAdminClient()
      const { data: roomsData } = await admin
        .from('rooms')
        .select('id, room_number')
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true })

      if (roomsData) {
        rooms = roomsData.map((r: any) => ({ id: r.id, roomNumber: r.room_number }))
      }
    } catch {}
  }

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
