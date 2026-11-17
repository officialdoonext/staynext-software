'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RoomItem {
  id: string
  property_id: string
  room_number: string
  floor_id?: string
  floor_name?: string
  building_id?: string
  building_name?: string
  room_type_id: string
  room_type_name?: string
  status: 'available' | 'occupied' | 'reserved' | 'dirty' | 'cleaning' | 'maintenance' | 'out_of_order' | 'blocked'
  is_smoking: boolean
  is_active: boolean
  notes?: string
  base_rate?: number
  max_occupancy?: number
  qr_token?: string
  created_at: string
}

export interface RoomTypeItem {
  id: string
  property_id: string
  name: string
  code?: string
  description?: string
  base_rate: number
  max_occupancy: number
  bed_type?: string
  size_sqft?: number
  total_rooms: number
  amenities: string[]
  images: string[]
  is_active: boolean
  created_at: string
}

export interface RoomBlockItem {
  id: string
  property_id: string
  room_id: string
  room_number?: string
  reason: string
  start_date: string
  end_date: string
  blocked_by?: string
  notes?: string
  status: 'active' | 'released'
  created_at: string
}

export interface RoomFilterOptions {
  search?: string
  buildingId?: string
  floorId?: string
  roomTypeId?: string
  status?: string
  page?: number
  limit?: number
}

/**
 * Fetch all rooms with rich joins (floor, building, room type, QR token)
 */
export async function getRooms(
  propertyId?: string,
  options?: RoomFilterOptions
): Promise<{ rooms: RoomItem[]; totalCount: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('rooms')
    .select(
      `
      *,
      floor:floors(id, name, floor_number),
      building:buildings(id, name),
      room_type:room_types(id, name, base_rate, max_occupancy),
      qr_code:room_qr_codes(token_hash, is_active)
    `,
      { count: 'exact' }
    )
    .order('room_number', { ascending: true })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  if (options?.search) {
    query = query.ilike('room_number', `%${options.search}%`)
  }

  if (options?.buildingId && options.buildingId !== 'all') {
    query = query.eq('building_id', options.buildingId)
  }

  if (options?.floorId && options.floorId !== 'all') {
    query = query.eq('floor_id', options.floorId)
  }

  if (options?.roomTypeId && options.roomTypeId !== 'all') {
    query = query.eq('room_type_id', options.roomTypeId)
  }

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  const page = options?.page || 1
  const limit = options?.limit || 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error || !data) {
    return { rooms: [], totalCount: 0 }
  }

  const rooms: RoomItem[] = data.map((r: any) => ({
    id: r.id,
    property_id: r.property_id,
    room_number: r.room_number,
    floor_id: r.floor_id,
    floor_name: r.floor?.name || (r.floor?.floor_number ? `Floor ${r.floor.floor_number}` : 'N/A'),
    building_id: r.building_id,
    building_name: r.building?.name || 'Main Building',
    room_type_id: r.room_type_id,
    room_type_name: r.room_type?.name || 'Standard Room',
    status: r.status,
    is_smoking: r.is_smoking ?? false,
    is_active: r.is_active ?? true,
    notes: r.notes || '',
    base_rate: r.room_type?.base_rate || 0,
    max_occupancy: r.room_type?.max_occupancy || 2,
    qr_token: r.qr_code?.token_hash,
    created_at: r.created_at,
  }))

  return { rooms, totalCount: count || rooms.length }
}

/**
 * Fetch a single room by ID
 */
export async function getRoomById(roomId: string): Promise<RoomItem | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      floor:floors(id, name, floor_number),
      building:buildings(id, name),
      room_type:room_types(id, name, base_rate, max_occupancy),
      qr_code:room_qr_codes(token_hash, is_active)
    `)
    .eq('id', roomId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    property_id: data.property_id,
    room_number: data.room_number,
    floor_id: data.floor_id,
    floor_name: data.floor?.name || (data.floor?.floor_number ? `Floor ${data.floor.floor_number}` : 'N/A'),
    building_id: data.building_id,
    building_name: data.building?.name || 'Main Building',
    room_type_id: data.room_type_id,
    room_type_name: data.room_type?.name || 'Standard Room',
    status: data.status,
    is_smoking: data.is_smoking ?? false,
    is_active: data.is_active ?? true,
    notes: data.notes || '',
    base_rate: data.room_type?.base_rate || 0,
    max_occupancy: data.room_type?.max_occupancy || 2,
    qr_token: data.qr_code?.token_hash,
    created_at: data.created_at,
  }
}

/**
 * Create a new room with uniqueness validation
 */
export async function createRoom(payload: {
  property_id: string
  room_number: string
  floor_id?: string
  building_id?: string
  room_type_id: string
  status?: string
  is_smoking?: boolean
  notes?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Check for duplicate room number in property
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('property_id', payload.property_id)
      .eq('room_number', payload.room_number.trim())
      .maybeSingle()

    if (existing) {
      return { success: false, error: `Room number ${payload.room_number} already exists in this property.` }
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        property_id: payload.property_id,
        room_number: payload.room_number.trim(),
        floor_id: payload.floor_id || null,
        building_id: payload.building_id || null,
        room_type_id: payload.room_type_id,
        status: payload.status || 'available',
        is_smoking: payload.is_smoking || false,
        notes: payload.notes || '',
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    // Increment total_rooms count on room_types
    await supabase.rpc('increment_room_type_count', { p_room_type_id: payload.room_type_id })

    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Update an existing room
 */
export async function updateRoom(
  roomId: string,
  payload: Partial<RoomItem>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('rooms')
      .update({
        room_number: payload.room_number?.trim(),
        floor_id: payload.floor_id || null,
        building_id: payload.building_id || null,
        room_type_id: payload.room_type_id,
        status: payload.status,
        is_smoking: payload.is_smoking,
        notes: payload.notes,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId)

    if (error) throw error

    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    revalidatePath(`/rooms/${roomId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Delete a room
 */
export async function deleteRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Check if room has active reservations
    const { data: activeRes } = await supabase
      .from('reservation_rooms')
      .select('id, reservation:reservations(status)')
      .eq('room_id', roomId)
      .limit(1)

    if (activeRes && activeRes.length > 0) {
      return { success: false, error: 'Cannot delete room with reservation history. Deactivate room instead.' }
    }

    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) throw error

    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Quick status update (for front desk or housekeeping)
 */
export async function updateRoomStatus(
  roomId: string,
  status: RoomItem['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', roomId)

    if (error) throw error

    revalidatePath('/rooms')
    revalidatePath('/front-desk')
    revalidatePath('/housekeeping')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// ROOM TYPES MANAGEMENT
// ============================================================================

export async function getRoomTypes(propertyId?: string): Promise<RoomTypeItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('room_types')
    .select(`
      *,
      rooms:rooms(id)
    `)
    .order('created_at', { ascending: true })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((rt: any) => ({
    id: rt.id,
    property_id: rt.property_id,
    name: rt.name,
    code: rt.code || '',
    description: rt.description || '',
    base_rate: parseFloat(rt.base_rate) || 0,
    max_occupancy: rt.max_occupancy || 2,
    bed_type: rt.bed_type || 'King Bed',
    size_sqft: parseFloat(rt.size_sqft) || 280,
    total_rooms: (rt.rooms || []).length,
    amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
    images: Array.isArray(rt.images) ? rt.images : [],
    is_active: rt.is_active ?? true,
    created_at: rt.created_at,
  }))
}

export async function createRoomType(payload: Partial<RoomTypeItem>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('room_types')
      .insert({
        property_id: payload.property_id,
        name: payload.name,
        code: payload.code || payload.name?.substring(0, 3).toUpperCase(),
        description: payload.description || '',
        base_rate: payload.base_rate || 0,
        max_occupancy: payload.max_occupancy || 2,
        bed_type: payload.bed_type || 'King Bed',
        size_sqft: payload.size_sqft || 300,
        amenities: payload.amenities || ['WiFi', 'Air Conditioning', 'Flat-screen TV'],
        images: payload.images || [],
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/rooms/types')
    revalidatePath('/rooms')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateRoomType(id: string, payload: Partial<RoomTypeItem>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('room_types')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/rooms/types')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteRoomType(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Prevent deletion if rooms exist under this type
    const { count } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('room_type_id', id)
    if (count && count > 0) {
      return { success: false, error: `Cannot delete room type with ${count} active assigned rooms.` }
    }

    const { error } = await supabase.from('room_types').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/rooms/types')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// ROOM BLOCKS (MAINTENANCE, VIP HOLD, RENOVATION)
// ============================================================================

export async function getRoomBlocks(propertyId?: string): Promise<RoomBlockItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('room_blocks')
    .select(`
      *,
      room:rooms(room_number)
    `)
    .order('created_at', { ascending: false })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((b: any) => ({
    id: b.id,
    property_id: b.property_id,
    room_id: b.room_id,
    room_number: b.room?.room_number || 'Room',
    reason: b.reason,
    start_date: b.start_date,
    end_date: b.end_date,
    blocked_by: b.blocked_by || 'Staff',
    notes: b.notes || '',
    status: b.status || 'active',
    created_at: b.created_at,
  }))
}

export async function createRoomBlock(payload: {
  property_id: string
  room_id: string
  reason: string
  start_date: string
  end_date: string
  blocked_by?: string
  notes?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Insert room block record
    const { data, error } = await supabase
      .from('room_blocks')
      .insert({
        property_id: payload.property_id,
        room_id: payload.room_id,
        reason: payload.reason,
        start_date: payload.start_date,
        end_date: payload.end_date,
        blocked_by: payload.blocked_by || 'Front Desk',
        notes: payload.notes || '',
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    // 2. Update room status to blocked or maintenance based on reason
    const newStatus = payload.reason.toLowerCase().includes('maintenance') ? 'maintenance' : 'blocked'
    await supabase.from('rooms').update({ status: newStatus }).eq('id', payload.room_id)

    revalidatePath('/rooms/blocking')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function releaseRoomBlock(blockId: string, roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Update block status
    const { error } = await supabase
      .from('room_blocks')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', blockId)

    if (error) throw error

    // 2. Reset room status back to available
    await supabase.from('rooms').update({ status: 'available' }).eq('id', roomId)

    revalidatePath('/rooms/blocking')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
