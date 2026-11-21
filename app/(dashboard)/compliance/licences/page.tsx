import React from 'react'
import { getPropertyLicenses } from '@/services/compliance.service'
import PropertyLicensesClient from './PropertyLicensesClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Property Licenses & Statutory Permits | StayNext Compliance',
  description: 'Hotel Trade, Fire NOC, FSSAI, Pollution & Municipal Permits Tracker',
}

export default async function LicencesPage() {
  const licenses = await getPropertyLicenses()
  return <PropertyLicensesClient initialLicenses={licenses} />
}
