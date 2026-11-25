import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import {
  getInventoryItems,
  getInventoryCategories,
  getSuppliers,
} from '@/services/inventory.service'
import { InventoryClient } from './InventoryClient'

export const metadata = { title: 'Inventory Management | StayNext' }

export default async function InventoryPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

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
