import React from 'react'
import { getPropertySettings, getNotificationPreferences } from '@/services/settings.service'
import { NotificationsClient } from './NotificationsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notification Rules & Alerts | StayNext' }

export default async function NotificationsSettingsPage() {
  const property = await getPropertySettings()
  const propertyId = property?.id || ''
  const prefs = propertyId
    ? await getNotificationPreferences(propertyId)
    : {
        bookingConfirmation: true,
        preArrivalWelcome: true,
        checkoutFolioPdf: true,
        postStayReview: true,
        urgentMaintenanceAlert: true,
        vipArrivalAlert: true,
        lowInventoryAlert: true,
      }

  return <NotificationsClient propertyId={propertyId} initialPreferences={prefs} />
}
