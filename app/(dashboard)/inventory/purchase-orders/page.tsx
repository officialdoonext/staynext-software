import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getPurchaseOrders, getSuppliers } from '@/services/inventory.service'
import { PurchaseOrdersClient } from './PurchaseOrdersClient'

export const metadata = { title: 'Purchase Orders | StayNext' }

export default async function PurchaseOrdersPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const orders = propertyId ? await getPurchaseOrders(propertyId) : []
  const suppliers = propertyId ? await getSuppliers(propertyId) : []

  return (
    <PurchaseOrdersClient
      initialOrders={orders}
      suppliers={suppliers}
      propertyId={propertyId}
    />
  )
}
