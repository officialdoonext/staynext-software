import React from 'react'
import PropertyForm from '@/components/forms/PropertyForm'
import { getTenantPropertyStats } from '@/services/property.service'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Register New Property | StayNext' }

export default async function NewPropertyPage() {
  const propertyStats = await getTenantPropertyStats()
  return <PropertyForm propertyStats={propertyStats} />
}
