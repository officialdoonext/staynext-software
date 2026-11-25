import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getRatePromotions } from '@/services/rate.service'
import { PromotionsClient } from './PromotionsClient'

export const metadata = { title: 'Promotions & Coupons | StayNext' }

export default async function PromotionsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const promotions = propertyId ? await getRatePromotions(propertyId) : []

  return <PromotionsClient initialPromotions={promotions} propertyId={propertyId} />
}
