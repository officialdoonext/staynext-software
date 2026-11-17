import React from 'react'
import { getPropertySettings, getPropertyUsers } from '@/services/settings.service'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Users & Permissions | StayNext' }

export default async function SettingsUsersPage() {
  const property = await getPropertySettings()
  const propertyId = property?.id || ''
  const users = propertyId ? await getPropertyUsers(propertyId) : []

  return <UsersClient propertyId={propertyId} users={users} />
}
