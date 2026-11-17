import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getRatePromotions } from '@/services/rate.service'
import { PromotionsClient } from './PromotionsClient'

export const metadata = { title: 'Promotions & Coupons | StayNext' }

export default async function PromotionsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const promotions = propertyId ? await getRatePromotions(propertyId) : []

  return <PromotionsClient initialPromotions={promotions} propertyId={propertyId} />
}
