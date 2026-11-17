import React from 'react'
import { getPropertySettings, getIntegrations } from '@/services/settings.service'
import { IntegrationsClient } from './IntegrationsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Integrations & API Gateways | StayNext' }

export default async function IntegrationsSettingsPage() {
  const property = await getPropertySettings()
  const propertyId = property?.id || ''
  const integrations = propertyId ? await getIntegrations(propertyId) : []

  return <IntegrationsClient propertyId={propertyId} integrations={integrations} />
}
