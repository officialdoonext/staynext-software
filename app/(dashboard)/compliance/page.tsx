import React from 'react'
import { getComplianceOverview, getForeignGuests, getPropertyLicenses } from '@/services/compliance.service'
import ComplianceOverviewClient from './ComplianceOverviewClient'

export const metadata = {
  title: 'Statutory Compliance & Form III FRRO | StayNext',
  description: 'Indian Hospitality Regulatory Compliance, Foreign Guest FRRO Form III, and Property Licenses Console',
}

export default async function CompliancePage() {
  const [overview, foreignGuests, licenses] = await Promise.all([
    getComplianceOverview(),
    getForeignGuests(),
    getPropertyLicenses(),
  ])

  return (
    <ComplianceOverviewClient
      overview={overview}
      foreignGuests={foreignGuests}
      licenses={licenses}
    />
  )
}
