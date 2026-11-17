import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getPurchaseOrders, getSuppliers } from '@/services/inventory.service'
import { PurchaseOrdersClient } from './PurchaseOrdersClient'

export const metadata = { title: 'Purchase Orders | StayNext' }

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

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
