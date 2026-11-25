import React from 'react'
import { getPropertySettings } from '@/services/settings.service'
import { getWhatsAppConfig, getImageKitConfig } from '@/services/integration-settings.service'
import { IntegrationsClient } from './IntegrationsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Third-Party Integrations | StayNext' }

export default async function IntegrationsSettingsPage() {
  const property = await getPropertySettings()
  const propertyId = property?.id || ''

  const [whatsAppConfig, imageKitConfig] = await Promise.all([
    propertyId ? getWhatsAppConfig(propertyId) : Promise.resolve({
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      isEnabled: false,
    }),
    propertyId ? getImageKitConfig(propertyId) : Promise.resolve({
      publicKey: '',
      privateKey: '',
      urlEndpoint: '',
      isEnabled: false,
    }),
  ])

  return (
    <IntegrationsClient
      propertyId={propertyId}
      initialWhatsAppConfig={whatsAppConfig}
      initialImageKitConfig={imageKitConfig}
    />
  )
}
