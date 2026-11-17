import React from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  getInventoryItems,
  getInventoryCategories,
  getSuppliers,
} from '@/services/inventory.service'
import { InventoryClient } from './InventoryClient'

export const metadata = { title: 'Inventory Management | StayNext' }

export default async function InventoryPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const items = propertyId ? await getInventoryItems(propertyId) : []
  const categories = propertyId ? await getInventoryCategories(propertyId) : []
  const suppliers = propertyId ? await getSuppliers(propertyId) : []

  return (
    <InventoryClient
      initialItems={items}
      categories={categories}
      suppliers={suppliers}
      propertyId={propertyId}
    />
  )
}
