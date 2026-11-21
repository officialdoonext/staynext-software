import React from 'react'
import { getStatutoryGuestRegister } from '@/services/compliance.service'
import StatutoryGuestRegisterClient from './StatutoryGuestRegisterClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Statutory Police Guest Register | StayNext Compliance',
  description: 'Official Indian Police Guest Register format for inspection & regulatory audit',
}

export default async function GuestRegisterPage() {
  const registerRecords = await getStatutoryGuestRegister()
  return <StatutoryGuestRegisterClient initialRecords={registerRecords} />
}
