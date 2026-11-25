import React from 'react'
import { getPropertySettings } from '@/services/settings.service'
import { getNotificationRecipients } from '@/services/notification-settings.service'
import { NotificationsClient } from './NotificationsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Staff Notification Channels | StayNext' }

export default async function NotificationsSettingsPage() {
  const property = await getPropertySettings()
  const propertyId = property?.id || ''
  const recipients = propertyId ? await getNotificationRecipients(propertyId) : []

  return <NotificationsClient propertyId={propertyId} initialRecipients={recipients} />
}
