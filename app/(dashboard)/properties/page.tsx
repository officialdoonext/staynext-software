import React from 'react'
import { getProperties, getTenantPropertyStats } from '@/services/property.service'
import PropertiesListClient from '@/components/properties/PropertiesListClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Property Management | StayNext' }

export default async function PropertiesPage() {
  const [properties, propertyStats] = await Promise.all([
    getProperties(),
    getTenantPropertyStats(),
  ])

  return (
    <PropertiesListClient
      initialProperties={properties}
      propertyStats={propertyStats}
    />
  )
}
