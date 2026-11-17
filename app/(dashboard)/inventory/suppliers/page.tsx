import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getSuppliers } from '@/services/inventory.service'
import { SuppliersClient } from './SuppliersClient'

export const metadata = { title: 'Suppliers Directory | StayNext' }

export default async function SuppliersPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const suppliers = propertyId ? await getSuppliers(propertyId) : []

  return <SuppliersClient initialSuppliers={suppliers} propertyId={propertyId} />
}
