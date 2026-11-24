'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface HousekeepingTaskItem {
  id: string
  room_id: string
  room_number: string
  floor_name?: string
  task_type: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'inspected'
  assigned_to?: string
  assigned_employee_name?: string
  notes?: string
  scheduled_date?: string
  completed_at?: string
  created_at: string
}

/**
 * Fetch housekeeping turnover tasks
 */
export async function getHousekeepingTasks(propertyId?: string): Promise<HousekeepingTaskItem[]> {
  const supabase = await createClient()

  const query = supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      room:rooms(id, room_number, property_id, floor:floors(name, floor_number)),
      employee:employees(id, first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error || !data) return []

  return data
    .filter((t: any) => !propertyId || t.room?.property_id === propertyId)
    .map((t: any) => ({
      id: t.id,
      room_id: t.room_id,
      room_number: t.room?.room_number || 'Room',
      floor_name: t.room?.floor?.name || (t.room?.floor?.floor_number ? `Floor ${t.room.floor.floor_number}` : 'Floor 1'),
      task_type: t.task_type || 'Room Cleaning',
      priority: t.priority || 'medium',
      status: t.status || 'pending',
      assigned_to: t.assigned_to,
      assigned_employee_name: t.employee
        ? `${t.employee.first_name || ''} ${t.employee.last_name || ''}`.trim()
        : 'Unassigned',
      notes: t.notes || '',
      scheduled_date: t.scheduled_date,
      completed_at: t.completed_at,
      created_at: t.created_at,
    }))
}

/**
 * Update a task's status and automatically update the Room status
 */
export async function updateHousekeepingTaskStatus(
  taskId: string,
  roomId: string,
  newStatus: HousekeepingTaskItem['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('housekeeping_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' || newStatus === 'inspected' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) throw error

    // Update Room status
    let roomStatus = 'dirty'
    if (newStatus === 'in_progress') roomStatus = 'cleaning'
    if (newStatus === 'completed' || newStatus === 'inspected') roomStatus = 'available'

    await supabase.from('rooms').update({ status: roomStatus }).eq('id', roomId)

    revalidatePath('/housekeeping')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    revalidatePath('/front-desk')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Create a new housekeeping work task
 */
export async function createHousekeepingTask(payload: {
  property_id?: string
  room_id: string
  task_type: string
  priority?: string
  assigned_to?: string
  notes?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    let propId = payload.property_id
    if (!propId && payload.room_id) {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('property_id')
        .eq('id', payload.room_id)
        .maybeSingle()
      propId = roomData?.property_id
    }

    if (!propId) {
      const { data: prop } = await supabase.from('properties').select('id').limit(1).maybeSingle()
      propId = prop?.id
    }

    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .insert({
        property_id: propId,
        room_id: payload.room_id,
        task_type: payload.task_type,
        priority: payload.priority || 'medium',
        assigned_to: payload.assigned_to || null,
        notes: payload.notes || '',
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Mark room as dirty or cleaning
    await supabase.from('rooms').update({ status: 'dirty' }).eq('id', payload.room_id)

    revalidatePath('/housekeeping')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ====================================================================
// HOUSEKEEPING TYPES MANAGEMENT (24-Item Server Paginated)
// ====================================================================

export interface HousekeepingTypeItem {
  id: string
  property_id: string
  name: string
  description?: string
  estimated_minutes: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface HousekeepingTypesResult {
  data: HousekeepingTypeItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const SAMPLE_HOUSEKEEPING_TYPES = [
  {
    name: 'Full Room Cleaning & Sanitization',
    description: 'Complete floor vacuuming/mopping, high-touch disinfection, and surface dusting',
    estimated_minutes: 45,
    priority: 'medium' as const,
  },
  {
    name: 'Bed Linen & Duvet Change',
    description: 'Replacement with fresh sanitized 400-thread count cotton sheets, pillow covers and duvet',
    estimated_minutes: 20,
    priority: 'medium' as const,
  },
  {
    name: 'Fresh Towels & Bath Mats',
    description: 'Fresh set of plush bath towels, hand towels, face towels, and absorbent floor mat',
    estimated_minutes: 10,
    priority: 'medium' as const,
  },
  {
    name: 'Bathroom Deep Sanitization',
    description: 'Disinfection of toilet, shower enclosures, sink traps, tiles, and polished chrome mirrors',
    estimated_minutes: 30,
    priority: 'high' as const,
  },
  {
    name: 'Toiletries & Amenities Restock',
    description: 'Replenish herbal soaps, shower gel, dental kits, shaving kit, and moisturizer',
    estimated_minutes: 10,
    priority: 'low' as const,
  },
  {
    name: 'Complimentary Water & Tea Kit Refill',
    description: 'Supply 2 sealed 1L mineral water bottles, tea bags, coffee sachets, and dairy creamers',
    estimated_minutes: 10,
    priority: 'low' as const,
  },
  {
    name: 'Evening Turndown Service',
    description: 'Bed readiness, ambient night lighting, foot runner placement, and gentle aroma refresh',
    estimated_minutes: 15,
    priority: 'low' as const,
  },
  {
    name: 'Express Waste Clearance & Dusting',
    description: 'Rapid clearance of room and bathroom waste bins with biodegradable liners and quick dusting',
    estimated_minutes: 10,
    priority: 'urgent' as const,
  },
]

/**
 * Fetch paginated housekeeping types (24 items per fetch)
 */
export async function getHousekeepingTypes(params: {
  propertyId?: string
  page?: number
  pageSize?: number
  search?: string
}): Promise<HousekeepingTypesResult> {
  const page = Math.max(1, params.page || 1)
  const pageSize = params.pageSize || 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = await createClient()

    let query = supabase
      .from('housekeeping_types')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (params.propertyId) {
      query = query.eq('property_id', params.propertyId)
    }

    if (params.search && params.search.trim()) {
      query = query.ilike('name', `%${params.search.trim()}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.warn('housekeeping_types table query error, falling back to samples:', error.message)
      // Fallback in case table is not yet created in Supabase
      const filtered = SAMPLE_HOUSEKEEPING_TYPES.filter(
        (s) => !params.search || s.name.toLowerCase().includes(params.search.toLowerCase())
      )
      const total = filtered.length
      const paginated = filtered.slice(from, to + 1).map((s, idx) => ({
        id: `mock-hk-${from + idx}`,
        property_id: params.propertyId || 'default-property',
        name: s.name,
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
        description: t.description || '',
        estimated_minutes: t.estimated_minutes || 30,
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
    console.error('getHousekeepingTypes exception:', err)
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
 * Create a new housekeeping type
 */
export async function createHousekeepingType(payload: {
  property_id: string
  name: string
  description?: string
  estimated_minutes?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  is_active?: boolean
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('housekeeping_types')
      .insert({
        property_id: payload.property_id,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        estimated_minutes: payload.estimated_minutes || 30,
        priority: payload.priority || 'medium',
        is_active: payload.is_active !== false,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/housekeeping/types')
    revalidatePath('/housekeeping')
    revalidatePath('/guest')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Load 8 Sample Housekeeping Types for a property
 */
export async function loadSampleHousekeepingTypes(
  propertyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient()

    const rows = SAMPLE_HOUSEKEEPING_TYPES.map((t) => ({
      property_id: propertyId,
      name: t.name,
      description: t.description,
      estimated_minutes: t.estimated_minutes,
      priority: t.priority,
      is_active: true,
    }))

    const { data, error } = await supabase
      .from('housekeeping_types')
      .insert(rows)
      .select()

    if (error) throw error

    revalidatePath('/housekeeping/types')
    revalidatePath('/housekeeping')
    revalidatePath('/guest')
    return { success: true, count: data?.length || rows.length }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Delete a housekeeping type
 */
export async function deleteHousekeepingType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('housekeeping_types').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/housekeeping/types')
    revalidatePath('/guest')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Toggle active status of a housekeeping type
 */
export async function toggleHousekeepingTypeActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('housekeeping_types')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error

    revalidatePath('/housekeeping/types')
    revalidatePath('/guest')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

