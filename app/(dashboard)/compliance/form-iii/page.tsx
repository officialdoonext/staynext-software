import React from 'react'
import { getForeignGuests } from '@/services/compliance.service'
import FormIIIWorkflowClient from './FormIIIWorkflowClient'

export const metadata = {
  title: 'Form III 24h Filing Console | StayNext Compliance',
  description: 'Indian FRRO Form III Foreign Guest Arrival & Departure Mandatory 24h Submission Workflow',
}

interface PageProps {
  searchParams: Promise<{ guestId?: string }>
}

export default async function FormIIIPage({ searchParams }: PageProps) {
  const { guestId } = await searchParams
  const foreignGuests = await getForeignGuests()

  return (
    <FormIIIWorkflowClient
      foreignGuests={foreignGuests}
      initialSelectedGuestId={guestId}
    />
  )
}
