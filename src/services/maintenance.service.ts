'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MaintenanceItem {
  id: string
  property_id: string
  room_id?: string
  room_number?: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed'
  assigned_to?: string
  assigned_employee_name?: string
  estimated_cost?: number
  actual_cost?: number
  reported_at: string
  resolved_at?: string
  created_at: string
}

/**
 * Fetch maintenance tickets
 */
export async function getMaintenanceRequests(propertyId?: string): Promise<MaintenanceItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('maintenance_requests')
    .select(`
      *,
      room:rooms(room_number),
      employee:employees(first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((m: any) => ({
    id: m.id,
    property_id: m.property_id,
    room_id: m.room_id,
    room_number: m.room?.room_number || (m.room_id ? 'Room' : 'Public Facility'),
    title: m.title || 'Maintenance Request',
    description: m.description || '',
    category: m.category || 'General',
    priority: m.priority || 'medium',
    status: m.status || 'open',
    assigned_to: m.assigned_to,
    assigned_employee_name: m.employee
      ? `${m.employee.first_name || ''} ${m.employee.last_name || ''}`.trim()
      : 'Engineering Team',
    estimated_cost: parseFloat(m.estimated_cost) || 0,
    actual_cost: parseFloat(m.actual_cost) || 0,
    reported_at: m.created_at,
    resolved_at: m.resolved_at,
    created_at: m.created_at,
  }))
}

/**
 * Create a new maintenance work order
 */
export async function createMaintenanceWorkOrder(payload: {
  property_id: string
  room_id?: string
  title: string
  description: string
  category: string
  priority?: string
  assigned_to?: string
  estimated_cost?: number
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        property_id: payload.property_id,
        room_id: payload.room_id || null,
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category || 'general',
        priority: payload.priority || 'medium',
        assigned_to: payload.assigned_to || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    // If room issue and high/urgent priority, mark room as maintenance
    if (payload.room_id && (payload.priority === 'urgent' || payload.priority === 'high')) {
      await supabase.from('rooms').update({ status: 'maintenance' }).eq('id', payload.room_id)
    }

    revalidatePath('/maintenance')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Update ticket status and turnover room back to available/dirty
 */
export async function updateMaintenanceStatus(
  ticketId: string,
  roomId: string | undefined,
  status: MaintenanceItem['status'],
  actualCost?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('maintenance_requests')
      .update({
        status,
        actual_cost: actualCost,
        resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
      })
      .eq('id', ticketId)

    if (error) throw error

    // When resolved, return room to 'dirty' so housekeeping can inspect/clean before guest check-in
    if (roomId && (status === 'resolved' || status === 'closed')) {
      await supabase.from('rooms').update({ status: 'dirty' }).eq('id', roomId)
    }

    revalidatePath('/maintenance')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ====================================================================
// MAINTENANCE TYPES MANAGEMENT (24-Item Server Paginated)
// ====================================================================

export interface MaintenanceTypeItem {
  id: string
  property_id: string
  name: string
  category: string
  description?: string
  estimated_minutes: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface MaintenanceTypesResult {
  data: MaintenanceTypeItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const SAMPLE_MAINTENANCE_TYPES = [
  {
    name: 'AC Temperature & Cooling Service',
    category: 'HVAC',
    description: 'Inspection of thermostat, airflow cooling issues, compressor coil and filter servicing',
    estimated_minutes: 30,
    priority: 'urgent' as const,
  },
  {
    name: 'Plumbing & Tap Water Leakage',
    category: 'Plumbing',
    description: 'Fix leaking faucets, washbasin drains, shower pressure issues, or flush leaks',
    estimated_minutes: 45,
    priority: 'high' as const,
  },
  {
    name: 'Geyser & Hot Water Troubleshooting',
    category: 'Plumbing',
    description: 'Check water heater thermostat, heating element, and uninterrupted hot water lines',
    estimated_minutes: 30,
    priority: 'urgent' as const,
  },
  {
    name: 'Electrical & Lighting Fixtures',
    category: 'Electrical',
    description: 'Troubleshoot flickering lights, faulty sockets, bedside panel switches, or MCB trips',
    estimated_minutes: 30,
    priority: 'high' as const,
  },
  {
    name: 'TV & Set-Top Box Connectivity',
    category: 'Electronics',
    description: 'Restore DTH cable feed, HDMI audio/video inputs, remote replacement, or smart TV setup',
    estimated_minutes: 20,
    priority: 'medium' as const,
  },
  {
    name: 'Room Wi-Fi & Internet Assistance',
    category: 'Network',
    description: 'Fix weak Wi-Fi signal in room, captive portal login issues, or in-room AP reboot',
    estimated_minutes: 20,
    priority: 'medium' as const,
  },
  {
    name: 'Electronic Door Lock & RFID Card',
    category: 'Security',
    description: 'Reprogram RFID smart card, replace lock battery, or realign door latch mechanism',
    estimated_minutes: 15,
    priority: 'urgent' as const,
  },
  {
    name: 'Furniture & Carpentry Repairs',
    category: 'Carpentry',
    description: 'Repair sticking wardrobe doors, squeaky hinges, loose handles, or bed frame adjustments',
    estimated_minutes: 45,
    priority: 'low' as const,
  },
]

/**
 * Fetch paginated maintenance types (24 items per fetch)
 */
export async function getMaintenanceTypes(params: {
  propertyId?: string
  page?: number
  pageSize?: number
  search?: string
  category?: string
}): Promise<MaintenanceTypesResult> {
  const page = Math.max(1, params.page || 1)
  const pageSize = params.pageSize || 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = await createClient()

    let query = supabase
      .from('maintenance_types')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (params.propertyId) {
      query = query.eq('property_id', params.propertyId)
    }

    if (params.search && params.search.trim()) {
      query = query.ilike('name', `%${params.search.trim()}%`)
    }

    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category)
    }

    const { data, count, error } = await query

    if (error) {
      console.warn('maintenance_types table query error, falling back to samples:', error.message)
      // Fallback in case table is not yet created in Supabase
      const filtered = SAMPLE_MAINTENANCE_TYPES.filter(
        (s) =>
          (!params.search || s.name.toLowerCase().includes(params.search.toLowerCase())) &&
          (!params.category || params.category === 'all' || s.category === params.category)
      )
      const total = filtered.length
      const paginated = filtered.slice(from, to + 1).map((s, idx) => ({
        id: `mock-mt-${from + idx}`,
        property_id: params.propertyId || 'default-property',
        name: s.name,
        category: s.category,
        description: s.description,
        estimated_minutes: s.estimated_minutes,
        priority: s.priority,
        is_active: true,
        created_at: new Date().toISOString(),
      }))
      return {
        data: paginated,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    }

    const totalCount = count || 0
    return {
      data: (data || []).map((t: any) => ({
        id: t.id,
        property_id: t.property_id,
        name: t.name,
        category: t.category || 'General',
        description: t.description || '',
        estimated_minutes: t.estimated_minutes || 45,
        priority: t.priority || 'medium',
        is_active: t.is_active !== false,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
      totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    }
  } catch (err) {
    console.error('getMaintenanceTypes exception:', err)
    return {
      data: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    }
  }
}

/**
 * Create a new maintenance type
 */
export async function createMaintenanceType(payload: {
  property_id: string
  name: string
  category?: string
  description?: string
  estimated_minutes?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  is_active?: boolean
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('maintenance_types')
      .insert({
        property_id: payload.property_id,
        name: payload.name.trim(),
        category: payload.category?.trim() || 'General',
        description: payload.description?.trim() || null,
        estimated_minutes: payload.estimated_minutes || 45,
        priority: payload.priority || 'medium',
        is_active: payload.is_active !== false,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/maintenance/types')
    revalidatePath('/maintenance')
    revalidatePath('/guest')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Load 8 Sample Maintenance Types for a property
 */
export async function loadSampleMaintenanceTypes(
  propertyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient()

    const rows = SAMPLE_MAINTENANCE_TYPES.map((t) => ({
      property_id: propertyId,
      name: t.name,
      category: t.category,
      description: t.description,
      estimated_minutes: t.estimated_minutes,
      priority: t.priority,
      is_active: true,
    }))

    const { data, error } = await supabase
      .from('maintenance_types')
      .insert(rows)
      .select()

    if (error) throw error

    revalidatePath('/maintenance/types')
    revalidatePath('/maintenance')
    revalidatePath('/guest')
    return { success: true, count: data?.length || rows.length }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Delete a maintenance type
 */
export async function deleteMaintenanceType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('maintenance_types').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/maintenance/types')
    revalidatePath('/guest')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Toggle active status of a maintenance type
 */
export async function toggleMaintenanceTypeActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('maintenance_types')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error

    revalidatePath('/maintenance/types')
    revalidatePath('/guest')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

