import React from 'react'
import { getGuests } from '@/services/crm.service'
import GuestsListClient from '@/components/guests/GuestsListClient'

export const metadata = { title: 'Guests CRM Directory | StayNext' }

export default async function GuestsPage() {
  const { guests } = await getGuests()

  return <GuestsListClient initialGuests={guests} />
}
