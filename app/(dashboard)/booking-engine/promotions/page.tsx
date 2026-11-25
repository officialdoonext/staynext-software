import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getRatePromotions } from '@/services/rate.service'
import { PromotionsClient } from '../../rates/promotions/PromotionsClient'

export const metadata = { title: 'Direct Booking Engine Promotions | StayNext' }

export default async function BookingEnginePromotionsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const promotions = propertyId ? await getRatePromotions(propertyId) : []

  return <PromotionsClient initialPromotions={promotions} propertyId={propertyId} />
}
