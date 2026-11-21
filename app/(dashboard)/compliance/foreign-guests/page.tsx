import React from 'react'
import { getForeignGuests } from '@/services/compliance.service'
import ForeignGuestsClient from './ForeignGuestsClient'

export const metadata = {
  title: 'Foreign Guest Register (Rule 17) | StayNext Compliance',
  description: 'Statutory Foreign Guest Register under Rule 17 Immigration and Foreigners Rules 2025',
}

export default async function ForeignGuestsPage() {
  const foreignGuests = await getForeignGuests()
  return <ForeignGuestsClient initialGuests={foreignGuests} />
}
