import React from 'react'
import { getPropertySettings } from '@/services/settings.service'
import { GeneralSettingsClient } from './GeneralSettingsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'System & Property Settings | StayNext' }

export default async function SettingsPage() {
  const property = await getPropertySettings()

  return <GeneralSettingsClient initialProperty={property} />
}
