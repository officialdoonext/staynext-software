'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedTenantId } from '@/services/tenant.service'

export interface GuestItem {
  id: string
  first_name: string
  last_name: string
  name: string
  email: string
  phone: string
  nationality: string
  id_type: string
  id_number: string
  address?: string
  city?: string
  country?: string
  is_vip: boolean
  vip_tier: string
  total_stays: number
  total_spent: number
  preferences?: string
  notes?: string
  created_at: string

  // Indian PMS & Compliance Fields
  guest_code?: string
  guest_category?: 'Indian' | 'Foreign' | 'OCI' | string
  salutation?: string
  gender?: string
  dob?: string
  whatsapp_number?: string
  state?: string
  district?: string
  pincode?: string
  company_name?: string
  company_gstin?: string
  is_blacklisted?: boolean
  blacklist_reason?: string
  preferred_meal_plan?: string
  preferred_language?: string
}

export interface GuestFilterOptions {
  search?: string
  vipStatus?: string
  page?: number
  limit?: number
}

/**
 * Fetch guest directory with filters and stay counts
 */
export async function getGuests(options?: GuestFilterOptions): Promise<{ guests: GuestItem[]; totalCount: number }> {
  const tenantId = await getAuthenticatedTenantId()
  if (!tenantId) {
    return { guests: [], totalCount: 0 }
  }

  const supabase = await createClient()

  let query = supabase
    .from('guests')
    .select(`
      *,
      reservations:reservations(id, total_amount, status)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (options?.vipStatus && options.vipStatus !== 'all') {
    if (options.vipStatus === 'vip') {
      query = query.eq('is_vip', true)
    } else if (options.vipStatus === 'regular') {
      query = query.eq('is_vip', false)
    }
  }

  if (options?.search) {
    const s = options.search
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,id_number.ilike.%${s}%`)
  }

  const page = options?.page || 1
  const limit = options?.limit || 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error || !data) {
    return { guests: [], totalCount: 0 }
  }

  const list: GuestItem[] = data.map((g: any) => {
    const stays = (g.reservations || []).filter((r: any) => r.status !== 'cancelled')
    const calculatedSpent = stays.reduce((acc: number, r: any) => acc + (parseFloat(r.total_amount) || 0), 0)

    return {
      id: g.id,
      first_name: g.first_name || '',
      last_name: g.last_name || '',
      name: `${g.salutation ? g.salutation + ' ' : ''}${g.first_name || ''} ${g.last_name || ''}`.trim() || 'Guest',
      email: g.email || 'N/A',
      phone: g.phone || 'N/A',
      nationality: g.nationality || 'India',
      id_type: g.id_type || 'aadhaar',
      id_number: g.id_number || '',
      address: g.address || '',
      city: g.city || '',
      country: g.country || 'India',
      is_vip: g.is_vip ?? false,
      vip_tier: g.vip_tier || (g.is_vip ? 'Gold VIP' : 'Standard'),
      total_stays: stays.length || g.total_stays || 0,
      total_spent: calculatedSpent || parseFloat(g.total_spent) || 0,
      preferences: g.preferences || 'None',
      notes: g.notes || '',
      guest_code: g.guest_code || `GST-${g.id.substring(0, 6).toUpperCase()}`,
      guest_category: g.guest_category || (g.nationality && g.nationality.toLowerCase() !== 'india' ? 'Foreign' : 'Indian'),
      salutation: g.salutation || '',
      gender: g.gender || '',
      dob: g.dob || '',
      whatsapp_number: g.whatsapp_number || g.phone || '',
      state: g.state || '',
      district: g.district || '',
      pincode: g.pincode || '',
      company_name: g.company_name || '',
      company_gstin: g.company_gstin || '',
      is_blacklisted: g.is_blacklisted ?? false,
      blacklist_reason: g.blacklist_reason || '',
      preferred_meal_plan: g.preferred_meal_plan || 'EP',
      preferred_language: g.preferred_language || 'English',
      created_at: g.created_at,
    }
  })

  return { guests: list, totalCount: count || list.length }
}

/**
 * Fetch guest profile with full stay history
 */
export async function getGuestById(id: string) {
  const tenantId = await getAuthenticatedTenantId()
  if (!tenantId || !id) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      reservations:reservations(
        id,
        reservation_number,
        check_in_date,
        check_out_date,
        total_amount,
        status,
        room_type:room_types(name)
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error || !data) return null

  return {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Guest',
    reservations: data.reservations || [],
  }
}

/**
 * Create a guest profile in Supabase
 */
export async function createGuest(payload: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  nationality?: string
  id_type?: string
  id_number?: string
  address?: string
  city?: string
  country?: string
  is_vip?: boolean
  vip_tier?: string
  preferences?: string
  salutation?: string
  gender?: string
  dob?: string
  whatsapp_number?: string
  guest_category?: string
  state?: string
  district?: string
  pincode?: string
  company_name?: string
  company_gstin?: string
  preferred_meal_plan?: string
  preferred_language?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const tenantId = await getAuthenticatedTenantId()
    if (!tenantId) {
      return { success: false, error: 'Unauthorized tenant session' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('guests')
      .insert({
        tenant_id: tenantId,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email: payload.email?.trim().toLowerCase() || null,
        phone: payload.phone?.trim() || null,
        nationality: payload.nationality || 'India',
        id_type: payload.id_type || 'aadhaar',
        id_number: payload.id_number || '',
        address: payload.address || '',
        city: payload.city || '',
        country: payload.country || 'India',
        is_vip: payload.is_vip || false,
        vip_tier: payload.vip_tier || (payload.is_vip ? 'Gold VIP' : 'Standard'),
        preferences: payload.preferences || '',
        salutation: payload.salutation || 'Mr',
        gender: payload.gender || 'Male',
        dob: payload.dob || null,
        whatsapp_number: payload.whatsapp_number || payload.phone || null,
        guest_category: payload.guest_category || 'Indian',
        state: payload.state || '',
        district: payload.district || '',
        pincode: payload.pincode || '',
        company_name: payload.company_name || null,
        company_gstin: payload.company_gstin || null,
        preferred_meal_plan: payload.preferred_meal_plan || 'EP',
        preferred_language: payload.preferred_language || 'English',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/guests')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Update guest VIP status
 */
export async function toggleGuestVip(
  guestId: string,
  isVip: boolean,
  vipTier: string = 'Gold VIP'
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await getAuthenticatedTenantId()
    if (!tenantId) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()

    const { error } = await supabase
      .from('guests')
      .update({ is_vip: isVip, vip_tier: isVip ? vipTier : 'Standard' })
      .eq('id', guestId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    revalidatePath('/guests')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Flag or Blacklist a guest with mandatory audit reason
 */
export async function toggleGuestBlacklist(
  guestId: string,
  isBlacklisted: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await getAuthenticatedTenantId()
    if (!tenantId) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()

    const { error } = await supabase
      .from('guests')
      .update({
        is_blacklisted: isBlacklisted,
        blacklist_reason: isBlacklisted ? reason || 'Security / behavioral incident flagged by management' : null,
      })
      .eq('id', guestId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    revalidatePath('/guests')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

