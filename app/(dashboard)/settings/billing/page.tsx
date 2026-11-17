import React from 'react'
import { getPropertySettings, getTaxRates } from '@/services/settings.service'
import { TaxesAndBillingClient } from './TaxesAndBillingClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Statutory Taxes & SaaS Subscription | StayNext' }

export default async function SettingsBillingPage() {
  const property = await getPropertySettings()
  const taxRates = property ? await getTaxRates(property.id) : []

  return <TaxesAndBillingClient property={property} taxRates={taxRates} />
}
