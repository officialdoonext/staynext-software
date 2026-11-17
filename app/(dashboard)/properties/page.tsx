import React from 'react'
import { getProperties } from '@/services/property.service'
import PropertiesListClient from '@/components/properties/PropertiesListClient'

export const metadata = { title: 'Property Management | StayNext' }

export default async function PropertiesPage() {
  const properties = await getProperties()

  return <PropertiesListClient initialProperties={properties} />
}
