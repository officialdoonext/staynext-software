import React from 'react'
import { getProperties } from '@/services/property.service'
import { getMenuItems, getMenuCategories } from '@/services/restaurant.service'
import { MenuClient } from './MenuClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Menu Items | StayNext' }

export default async function MenuPage() {
  const properties = await getProperties()
  const primaryProp = properties[0]
  const propertyId = primaryProp?.id || ''

  const items = await getMenuItems(propertyId)
  const categories = await getMenuCategories(propertyId)

  return (
    <MenuClient
      initialItems={items}
      categories={categories}
      propertyId={propertyId}
      properties={properties}
    />
  )
}
