import React from 'react'
import { getPropertySettings } from '@/services/settings.service'
import { getProperties } from '@/services/property.service'
import { GeneralSettingsClient } from './GeneralSettingsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'System & Property Settings | StayNext' }

export default async function SettingsPage() {
  const properties = await getProperties()
  const primaryId = properties[0]?.id
  const property = await getPropertySettings(primaryId)

  return <GeneralSettingsClient initialProperty={property} properties={properties} />
}
