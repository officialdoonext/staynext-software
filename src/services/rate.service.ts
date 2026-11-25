'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTenantPropertyIds } from '@/services/tenant.service'

export interface RatePlanRecord {
  id: string
  propertyId: string
  name: string
  code: string
  description?: string
  mealPlan: 'ep' | 'cp' | 'map' | 'ap'
  cancellationPolicy?: string
  isRefundable: boolean
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export interface SeasonalRateRecord {
  id: string
  propertyId: string
  name: string
  startDate: string
  endDate: string
  multiplier: number
  isActive: boolean
  createdAt: string
}

export interface RatePromotionRecord {
  id: string
  propertyId: string
  code: string
  name: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validFrom?: string | null
  validUntil?: string | null
  minBookingAmount: number
  usageLimit?: number | null
  usedCount: number
  isActive: boolean
  createdAt: string
}

/**
 * Fetch rate plans for property
 */
export async function getRatePlans(propertyId: string): Promise<RatePlanRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('rate_plans')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !data) return []

    return data.map((rp: any) => ({
      id: rp.id,
      propertyId: rp.property_id,
      name: rp.name,
      code: rp.code || 'BAR',
      description: rp.description,
      mealPlan: rp.meal_plan || 'ep',
      cancellationPolicy: rp.cancellation_policy,
      isRefundable: Boolean(rp.is_refundable),
      isDefault: Boolean(rp.is_default),
      isActive: Boolean(rp.is_active),
      createdAt: rp.created_at,
    }))
  } catch (err) {
    console.error('getRatePlans error:', err)
    return []
  }
}

/**
 * Create a rate plan
 */
export async function createRatePlan(data: {
  propertyId: string
  name: string
  code?: string
  description?: string
  mealPlan: 'ep' | 'cp' | 'map' | 'ap'
  cancellationPolicy?: string
  isRefundable?: boolean
  isDefault?: boolean
}): Promise<{ success: boolean; planId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: plan, error } = await supabase
      .from('rate_plans')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        code: data.code || `RATE-${data.name.slice(0, 3).toUpperCase()}`,
        description: data.description || null,
        meal_plan: data.mealPlan,
        cancellation_policy: data.cancellationPolicy || null,
        is_refundable: data.isRefundable ?? true,
        is_default: data.isDefault ?? false,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/rates')
    return { success: true, planId: plan?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create rate plan' }
  }
}

/**
 * Delete a rate plan
 */
export async function deleteRatePlan(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('rate_plans').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/rates')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete rate plan' }
  }
}

/**
 * Fetch seasonal rates
 */
export async function getSeasonalRates(propertyId: string): Promise<SeasonalRateRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('seasonal_rates')
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: true })

    if (error || !data) return []

    return data.map((sr: any) => ({
      id: sr.id,
      propertyId: sr.property_id,
      name: sr.name,
      startDate: sr.start_date,
      endDate: sr.end_date,
      multiplier: Number(sr.multiplier || 1.0),
      isActive: Boolean(sr.is_active),
      createdAt: sr.created_at,
    }))
  } catch (err) {
    console.error('getSeasonalRates error:', err)
    return []
  }
}

/**
 * Create seasonal rate
 */
export async function createSeasonalRate(data: {
  propertyId: string
  name: string
  startDate: string
  endDate: string
  multiplier: number
}): Promise<{ success: boolean; rateId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: rate, error } = await supabase
      .from('seasonal_rates')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        multiplier: data.multiplier,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/rates/seasonal')
    return { success: true, rateId: rate?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create seasonal rate' }
  }
}

/**
 * Delete seasonal rate
 */
export async function deleteSeasonalRate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('seasonal_rates').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/rates/seasonal')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete seasonal rate' }
  }
}

/**
 * Fetch rate promotions
 */
export async function getRatePromotions(propertyId: string): Promise<RatePromotionRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('rate_promotions')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map((rp: any) => ({
      id: rp.id,
      propertyId: rp.property_id,
      code: rp.code,
      name: rp.name,
      discountType: rp.discount_type || 'percentage',
      discountValue: Number(rp.discount_value || 0),
      validFrom: rp.valid_from,
      validUntil: rp.valid_until,
      minBookingAmount: Number(rp.min_booking_amount || 0),
      usageLimit: rp.usage_limit,
      usedCount: Number(rp.used_count || 0),
      isActive: Boolean(rp.is_active),
      createdAt: rp.created_at,
    }))
  } catch (err) {
    console.error('getRatePromotions error:', err)
    return []
  }
}

/**
 * Create rate promotion / coupon
 */
export async function createRatePromotion(data: {
  propertyId: string
  code: string
  name: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validFrom?: string
  validUntil?: string
  minBookingAmount?: number
  usageLimit?: number
}): Promise<{ success: boolean; promoId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: promo, error } = await supabase
      .from('rate_promotions')
      .insert({
        property_id: data.propertyId,
        code: data.code.toUpperCase().trim(),
        name: data.name,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        valid_from: data.validFrom || null,
        valid_until: data.validUntil || null,
        min_booking_amount: data.minBookingAmount || 0,
        usage_limit: data.usageLimit || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/rates/promotions')
    revalidatePath('/booking-engine/promotions')
    return { success: true, promoId: promo?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create promotion' }
  }
}

/**
 * Delete rate promotion
 */
export async function deleteRatePromotion(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('rate_promotions').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/rates/promotions')
    revalidatePath('/booking-engine/promotions')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete promotion' }
  }
}

