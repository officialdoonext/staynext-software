'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  guest_name?: string
  guest_phone?: string
  source?: 'room_qr' | 'staff'
  scheduled_date?: string
  completed_at?: string
  created_at: string
}

/**
 * Fetch housekeeping turnover tasks and guest QR requests
 */
export async function getHousekeepingTasks(propertyId?: string): Promise<HousekeepingTaskItem[]> {
  const supabase = createAdminClient()

  // 1. Fetch from housekeeping_tasks (DO NOT join employees because foreign key doesn't exist)
  const query = supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      room:rooms(id, room_number, property_id, floor:floors(name, floor_number))
    `)
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) {
    console.error('getHousekeepingTasks error:', error)
  }

  let hkData = data
  if (!hkData && error) {
    // Graceful fallback without complex join
    let fb = supabase
      .from('housekeeping_tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (propertyId) fb = fb.eq('property_id', propertyId)
    const { data: fbData } = await fb
    if (fbData) hkData = fbData
  }

  // Pre-fetch room mapping
  const roomIds = (hkData || []).map((t: any) => t.room_id).filter(Boolean)
  const roomsMap: Record<string, { room_number: string; floor_name: string; property_id: string }> = {}
  if (roomIds.length > 0) {
    try {
      const { data: rData } = await supabase
        .from('rooms')
        .select('id, room_number, property_id, floor:floors(name, floor_number)')
        .in('id', roomIds)
      if (rData) {
        for (const r of rData) {
          const fName = (r.floor as any)?.name || ((r.floor as any)?.floor_number ? `Floor ${(r.floor as any).floor_number}` : 'Floor 1')
          roomsMap[r.id] = { room_number: r.room_number, floor_name: fName, property_id: r.property_id }
        }
      }
    } catch {}
  }

  const tasks: HousekeepingTaskItem[] = []

  if (hkData) {
    const filtered = hkData.filter((t: any) => {
      if (!propertyId) return true
      const propId = t.room?.property_id || roomsMap[t.room_id]?.property_id || t.property_id
      return propId === propertyId
    })

    for (const t of filtered) {
      const isQr = t.notes?.includes('[Room QR Request') || false
      let guestName: string | undefined
      let guestPhone: string | undefined

      if (isQr && t.notes) {
        const guestMatch = t.notes.match(/Guest:\s*([^(\n]+)(?:\s*\(([^)]+)\))?/)
        if (guestMatch) {
          guestName = guestMatch[1]?.trim()
          guestPhone = guestMatch[2]?.trim()
        }
      }

      tasks.push({
        id: t.id,
        room_id: t.room_id,
        room_number: t.room?.room_number || roomsMap[t.room_id]?.room_number || 'Room',
        floor_name: t.room?.floor?.name || roomsMap[t.room_id]?.floor_name || 'Floor 1',
        task_type: t.task_type || 'Room Cleaning',
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        assigned_to: t.assigned_to,
        assigned_employee_name: 'Unassigned',
        notes: t.notes || '',
        guest_name: guestName,
        guest_phone: guestPhone,
        source: isQr ? 'room_qr' : 'staff',
        scheduled_date: t.scheduled_date,
        completed_at: t.completed_at,
        created_at: t.created_at,
      })
    }
  }

  // 2. Also query guest_service_requests where category_slug = 'housekeeping'
  try {
    let gQuery = supabase
      .from('guest_service_requests')
      .select('*')
      .eq('category_slug', 'housekeeping')
      .order('created_at', { ascending: false })

    if (propertyId) {
      gQuery = gQuery.eq('property_id', propertyId)
    }

    const { data: gData, error: gError } = await gQuery
    if (gError) {
      console.error('Error fetching guest_service_requests for housekeeping:', gError)
    }

    if (gData && gData.length > 0) {
      const gRoomIds = gData.map((gr: any) => gr.room_id).filter(Boolean)
      const gRoomsMap: Record<string, { room_number: string; floor_name: string }> = {}
      if (gRoomIds.length > 0) {
        try {
          const { data: grRooms } = await supabase
            .from('rooms')
            .select('id, room_number, floor:floors(name, floor_number)')
            .in('id', gRoomIds)
          if (grRooms) {
            for (const r of grRooms) {
              const fName = (r.floor as any)?.name || ((r.floor as any)?.floor_number ? `Floor ${(r.floor as any).floor_number}` : 'Floor 1')
              gRoomsMap[r.id] = { room_number: r.room_number, floor_name: fName }
            }
          }
        } catch {}
      }

      for (const gr of gData) {
        const grTime = new Date(gr.created_at).getTime()
        const match = tasks.find(
          (t) => t.room_id === gr.room_id && Math.abs(new Date(t.created_at).getTime() - grTime) < 30000
        )

        if (match) {
          if (gr.guest_name && (!match.guest_name || match.guest_name === 'Guest')) {
            match.guest_name = gr.guest_name
          }
          if (gr.guest_phone && !match.guest_phone) {
            match.guest_phone = gr.guest_phone
          }
          match.source = 'room_qr'
        } else {
          const fullNotes = [
            `[Room QR Request - Guest: ${gr.guest_name || 'Guest'}${gr.guest_phone ? ` (${gr.guest_phone})` : ''}]`,
            gr.request_type ? `Service: ${gr.request_type}` : '',
            gr.description && gr.description !== gr.request_type ? `Details: ${gr.description}` : '',
            gr.guest_notes ? `Guest Instructions: ${gr.guest_notes}` : '',
          ].filter(Boolean).join('\n')

          tasks.push({
            id: gr.id,
            room_id: gr.room_id,
            room_number: gRoomsMap[gr.room_id]?.room_number || 'Room',
            floor_name: gRoomsMap[gr.room_id]?.floor_name || 'Floor 1',
            task_type: gr.request_type || 'Room Cleaning',
            priority: gr.priority || 'medium',
            status: gr.status === 'completed' || gr.status === 'resolved' ? 'completed' : gr.status === 'in_progress' ? 'in_progress' : 'pending',
            assigned_employee_name: 'Unassigned',
            notes: fullNotes,
            guest_name: gr.guest_name,
            guest_phone: gr.guest_phone,
            source: 'room_qr',
            created_at: gr.created_at,
          })
        }
      }
    }
  } catch (gErr) {
    console.error('Error fetching guest service requests for housekeeping:', gErr)
  }

  // Sort by created_at descending
  tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return tasks
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

    // Update housekeeping_tasks table
    await supabase
      .from('housekeeping_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' || newStatus === 'inspected' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    // Also update guest_service_requests if this was a guest QR request
    await supabase
      .from('guest_service_requests')
      .update({
        status: newStatus === 'completed' || newStatus === 'inspected' ? 'completed' : newStatus,
        completed_at: newStatus === 'completed' || newStatus === 'inspected' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

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

