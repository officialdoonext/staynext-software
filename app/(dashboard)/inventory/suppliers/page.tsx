import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getSuppliers } from '@/services/inventory.service'
import { SuppliersClient } from './SuppliersClient'

export const metadata = { title: 'Suppliers Directory | StayNext' }

export default async function SuppliersPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const suppliers = propertyId ? await getSuppliers(propertyId) : []

  return <SuppliersClient initialSuppliers={suppliers} propertyId={propertyId} />
}
