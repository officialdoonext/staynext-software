'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface PropertyItem {
  id: string
  tenant_id?: string
  name: string
  property_type: string
  address: string
  city: string
  state?: string
  country: string
  postal_code?: string
  phone?: string
  email?: string
  website?: string
  currency: string
  timezone: string
  check_in_time: string
  check_out_time: string
  logo_url?: string
  description?: string
  is_active: boolean
  gstin?: string
  pan_number?: string
  business_reg_no?: string
  tax_id?: string
  latitude?: number
  longitude?: number
  star_rating?: number
  invoice_prefix?: string
  receipt_prefix?: string
  terms_and_conditions?: string
  cancellation_policy?: string
  total_rooms?: number
  occupied_rooms?: number
  created_at: string
}

export interface BuildingItem {
  id: string
  property_id: string
  name: string
  code?: string
  description?: string
  is_active: boolean
  total_floors?: number
  total_rooms?: number
  created_at: string
}

export interface FloorItem {
  id: string
  property_id: string
  building_id?: string
  building_name?: string
  floor_number: number
  name?: string
  is_active: boolean
  total_rooms?: number
  created_at: string
}

export interface FacilityItem {
  id: string
  name: string
  icon?: string
  category?: string
  description?: string
  is_available?: boolean
  notes?: string
}

export interface TenantPropertyStats {
  currentCount: number
  allowedCount: number
  canAdd: boolean
  plan: string
}

/**
 * Get tenant property limit and current count
 */
export async function getTenantPropertyStats(): Promise<TenantPropertyStats> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { currentCount: 0, allowedCount: 1, canAdd: false, plan: 'starter' }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const tenantId = tenantUser?.tenant_id
    if (!tenantId) return { currentCount: 0, allowedCount: 1, canAdd: false, plan: 'starter' }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('allowed_properties_count, subscription_plan')
      .eq('id', tenantId)
      .maybeSingle()

    const allowedCount = tenant?.allowed_properties_count ?? 1
    const plan = tenant?.subscription_plan ?? 'starter'

    const { count: currentCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const curr = currentCount ?? 0
    return {
      currentCount: curr,
      allowedCount,
      canAdd: curr < allowedCount,
      plan,
    }
  } catch (err) {
    console.error('getTenantPropertyStats error:', err)
    return { currentCount: 0, allowedCount: 1, canAdd: true, plan: 'starter' }
  }
}

/**
 * Fetch all properties for the authenticated tenant with room counts
 */
export async function getProperties(search?: string, propertyType?: string, status?: string): Promise<PropertyItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select(`
      *,
      rooms:rooms(id, status)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`)
  }

  if (propertyType && propertyType !== 'all') {
    query = query.eq('property_type', propertyType)
  }

  if (status && status !== 'all') {
    query = query.eq('is_active', status === 'active')
  }

  let { data, error } = await query

  if (error || !data || data.length === 0) {
    try {
      const admin = createAdminClient()
      let adminQuery = admin
        .from('properties')
        .select(`
          *,
          rooms:rooms(id, status)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        adminQuery = adminQuery.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`)
      }
      if (propertyType && propertyType !== 'all') {
        adminQuery = adminQuery.eq('property_type', propertyType)
      }
      if (status && status !== 'all') {
        adminQuery = adminQuery.eq('is_active', status === 'active')
      }

      const adminRes = await adminQuery
      if (adminRes.data && adminRes.data.length > 0) {
        data = adminRes.data
        error = null
      }
    } catch (adminErr) {
      console.error('getProperties admin fallback error:', adminErr)
    }
  }

  if (error || !data) {
    return []
  }

  const list = data.map((p: any) => {
    const rooms = p.rooms || []
    const totalRooms = rooms.length
    const occupiedRooms = rooms.filter((r: any) => r.status === 'occupied').length

    return {
      id: p.id,
      tenant_id: p.tenant_id,
      name: p.name,
      property_type: p.property_type || 'hotel',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      country: p.country || 'India',
      postal_code: p.postal_code || '',
      phone: p.phone || '',
      email: p.email || '',
      website: p.website || '',
      currency: p.currency || 'INR',
      timezone: p.timezone || 'Asia/Kolkata',
      check_in_time: p.check_in_time || '14:00',
      check_out_time: p.check_out_time || '11:00',
      logo_url: p.logo_url || '',
      description: p.description || '',
      is_active: p.is_active ?? true,
      gstin: p.gstin || '',
      pan_number: p.pan_number || '',
      business_reg_no: p.business_reg_no || '',
      tax_id: p.tax_id || '',
      latitude: p.latitude,
      longitude: p.longitude,
      star_rating: p.star_rating || 3,
      invoice_prefix: p.invoice_prefix || 'INV',
      receipt_prefix: p.receipt_prefix || 'REC',
      terms_and_conditions: p.terms_and_conditions || '',
      cancellation_policy: p.cancellation_policy || '',
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      created_at: p.created_at,
    }
  })

  // Prioritize properties with rooms/active data first, then earliest created
  return list.sort((a, b) => {
    if ((b.total_rooms || 0) !== (a.total_rooms || 0)) {
      return (b.total_rooms || 0) - (a.total_rooms || 0)
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

/**
 * Fetch a single property by ID
 */
export async function getPropertyById(propertyId: string): Promise<PropertyItem | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms:rooms(id, status)
    `)
    .eq('id', propertyId)
    .single()

  if (error || !data) return null

  const rooms = data.rooms || []
  return {
    ...data,
    total_rooms: rooms.length,
    occupied_rooms: rooms.filter((r: any) => r.status === 'occupied').length,
  }
}

/**
 * Create a new property under current tenant
 */
export async function createProperty(payload: Partial<PropertyItem>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // Retrieve active tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const tenantId = tenantUser?.tenant_id
    if (!tenantId) throw new Error('No tenant associated with user')

    // Verify allowed properties limit before inserting
    const { data: tenant } = await supabase
      .from('tenants')
      .select('allowed_properties_count')
      .eq('id', tenantId)
      .maybeSingle()

    const allowedCount = tenant?.allowed_properties_count ?? 1

    const { count: currentCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if ((currentCount ?? 0) >= allowedCount) {
      return {
        success: false,
        error: `Property limit reached. Your subscription plan allows a maximum of ${allowedCount} property(ies) (currently active: ${currentCount}). Please upgrade your plan to register additional properties.`,
      }
    }

    const insertPayload = {
      tenant_id: tenantId,
      name: payload.name,
      property_type: payload.property_type || 'hotel',
      address: payload.address,
      city: payload.city,
      state: payload.state || '',
      country: payload.country || 'India',
      postal_code: payload.postal_code || '',
      phone: payload.phone || '',
      email: payload.email || '',
      website: payload.website || '',
      currency: payload.currency || 'INR',
      timezone: payload.timezone || 'Asia/Kolkata',
      check_in_time: payload.check_in_time || '14:00',
      check_out_time: payload.check_out_time || '11:00',
      description: payload.description || '',
      gstin: payload.gstin || '',
      pan_number: payload.pan_number || '',
      business_reg_no: payload.business_reg_no || '',
      star_rating: payload.star_rating || 3,
      invoice_prefix: payload.invoice_prefix || 'INV',
      receipt_prefix: payload.receipt_prefix || 'REC',
      terms_and_conditions: payload.terms_and_conditions || '',
      cancellation_policy: payload.cancellation_policy || '',
      is_active: true,
    }

    const { data: property, error } = await supabase
      .from('properties')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error

    // Also link user in property_users
    await supabase.from('property_users').insert({
      property_id: property.id,
      user_id: user.id,
      role: 'hotel_owner',
      is_active: true,
    })

    // Seed default guest service categories for this property
    await supabase.rpc('seed_default_guest_service_categories', {
      p_property_id: property.id,
    })

    revalidatePath('/properties')
    revalidatePath('/dashboard')
    return { success: true, data: property }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Update an existing property
 */
export async function updateProperty(propertyId: string, payload: Partial<PropertyItem>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('properties')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)

    if (error) throw error

    revalidatePath('/properties')
    revalidatePath(`/properties/${propertyId}`)
    revalidatePath(`/properties/${propertyId}/settings`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Toggle property active status
 */
export async function togglePropertyStatus(propertyId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('properties')
      .update({ is_active: isActive })
      .eq('id', propertyId)

    if (error) throw error

    revalidatePath('/properties')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// BUILDINGS MANAGEMENT
// ============================================================================

export async function getBuildings(propertyId?: string): Promise<BuildingItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('buildings')
    .select(`
      *,
      floors:floors(id),
      rooms:rooms(id)
    `)
    .order('created_at', { ascending: true })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((b: any) => ({
    id: b.id,
    property_id: b.property_id,
    name: b.name,
    code: b.code || '',
    description: b.description || '',
    is_active: b.is_active ?? true,
    total_floors: (b.floors || []).length,
    total_rooms: (b.rooms || []).length,
    created_at: b.created_at,
  }))
}

export async function createBuilding(payload: { property_id: string; name: string; code?: string; description?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('buildings')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/properties/buildings')
    revalidatePath('/rooms/buildings')
    revalidatePath('/rooms')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateBuilding(id: string, payload: Partial<BuildingItem>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('buildings').update(payload).eq('id', id)
    if (error) throw error
    revalidatePath('/properties/buildings')
    revalidatePath('/rooms/buildings')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteBuilding(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('buildings').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/properties/buildings')
    revalidatePath('/rooms/buildings')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// FLOORS MANAGEMENT
// ============================================================================

export async function getFloors(propertyId?: string, buildingId?: string): Promise<FloorItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('floors')
    .select(`
      *,
      building:buildings(name),
      rooms:rooms(id)
    `)
    .order('floor_number', { ascending: true })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  if (buildingId) {
    query = query.eq('building_id', buildingId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((f: any) => ({
    id: f.id,
    property_id: f.property_id,
    building_id: f.building_id,
    building_name: f.building?.name || 'Main Building',
    floor_number: f.floor_number,
    name: f.name || `Floor ${f.floor_number}`,
    is_active: f.is_active ?? true,
    total_rooms: (f.rooms || []).length,
    created_at: f.created_at,
  }))
}

export async function createFloor(payload: { property_id: string; building_id?: string; floor_number: number; name?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('floors')
      .insert({
        property_id: payload.property_id,
        building_id: payload.building_id || null,
        floor_number: payload.floor_number,
        name: payload.name || `Floor ${payload.floor_number}`,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/properties/floors')
    revalidatePath('/rooms/floors')
    revalidatePath('/rooms')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateFloor(id: string, payload: Partial<FloorItem>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('floors').update(payload).eq('id', id)
    if (error) throw error
    revalidatePath('/properties/floors')
    revalidatePath('/rooms/floors')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteFloor(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('floors').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/properties/floors')
    revalidatePath('/rooms/floors')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// FACILITIES MANAGEMENT
// ============================================================================

export async function getFacilitiesWithPropertyStatus(propertyId: string): Promise<FacilityItem[]> {
  const supabase = await createClient()

  // Default facility list
  const defaultFacilities = [
    { name: 'Free High-Speed WiFi', icon: 'Wifi', category: 'connectivity', description: 'Available in all rooms and public areas' },
    { name: 'Swimming Pool', icon: 'Waves', category: 'recreation', description: 'Outdoor heated infinity swimming pool' },
    { name: 'Fitness Center / Gym', icon: 'Dumbbell', category: 'wellness', description: 'Fully equipped 24/7 fitness facility' },
    { name: 'Multi-Cuisine Restaurant', icon: 'Utensils', category: 'dining', description: 'Buffet and à la carte dining' },
    { name: 'Free Car Parking & Valet', icon: 'Car', category: 'convenience', description: 'Secure on-site parking with EV charging' },
    { name: '24/7 Room Service', icon: 'Bell', category: 'dining', description: 'Round the clock in-room dining' },
    { name: 'Spa & Wellness Center', icon: 'Sparkles', category: 'wellness', description: 'Massage therapies and steam sauna' },
    { name: 'Conference & Banquet Hall', icon: 'Users', category: 'business', description: 'Audio-visual equipped event venue' },
    { name: 'Airport Shuttle', icon: 'Plane', category: 'transport', description: 'Scheduled and on-demand airport pick-up/drop' },
    { name: 'Laundry & Dry Cleaning', icon: 'Shirt', category: 'convenience', description: 'Same-day turnaround laundry' },
    { name: '24-Hour Front Desk', icon: 'Clock', category: 'general', description: 'Concierge, currency exchange and luggage storage' },
    { name: 'Wheelchair Accessible', icon: 'Accessibility', category: 'accessibility', description: 'Accessible elevators and ramps' },
  ]

  // Query facilities from database
  const { data: dbFacilities } = await supabase.from('facilities').select('*')

  // If table empty, return defaults
  if (!dbFacilities || dbFacilities.length === 0) {
    return defaultFacilities.map((f, idx) => ({
      id: `fac-${idx}`,
      name: f.name,
      icon: f.icon,
      category: f.category,
      description: f.description,
      is_available: true,
    }))
  }

  // Get property mapped facilities
  const { data: propFacilities } = await supabase
    .from('property_facilities')
    .select('facility_id, is_available, notes')
    .eq('property_id', propertyId)

  const mappedMap = new Map((propFacilities || []).map((pf: any) => [pf.facility_id, pf]))

  return dbFacilities.map((f: any) => ({
    id: f.id,
    name: f.name,
    icon: f.icon,
    category: f.category,
    description: f.description,
    is_available: mappedMap.has(f.id) ? mappedMap.get(f.id).is_available : false,
    notes: mappedMap.get(f.id)?.notes || '',
  }))
}

export async function togglePropertyFacility(propertyId: string, facilityId: string, isAvailable: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('property_facilities')
      .upsert({
        property_id: propertyId,
        facility_id: facilityId,
        is_available: isAvailable,
      }, { onConflict: 'property_id,facility_id' })

    if (error) throw error

    revalidatePath('/properties/facilities')
    revalidatePath(`/properties/${propertyId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
