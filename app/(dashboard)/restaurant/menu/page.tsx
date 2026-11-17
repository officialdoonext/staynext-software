import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getMenuItems, getMenuCategories } from '@/services/restaurant.service'
import { MenuClient } from './MenuClient'

export const metadata = { title: 'Menu Items | StayNext' }

export default async function MenuPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const items = propertyId ? await getMenuItems(propertyId) : []
  const categories = propertyId ? await getMenuCategories(propertyId) : []

  return (
    <MenuClient
      initialItems={items}
      categories={categories}
      propertyId={propertyId}
    />
  )
}
