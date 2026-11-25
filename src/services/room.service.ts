'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { generateRoomQRCode } from '@/services/qr.service'

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

  // Extended PMS Fields
  max_adults?: number
  max_children?: number
  weekday_price?: number
  weekend_price?: number
  is_ac?: boolean
  gst_category?: string
  bed_type?: string
  housekeeping_status?: 'clean' | 'dirty' | 'cleaning' | 'inspected'
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

  // Extended Room Type Fields
  base_occupancy?: number
  default_adult_count?: number
  default_child_count?: number
  extra_adult_rate?: number
  extra_child_rate?: number
  extra_bed_allowed?: boolean
  default_meal_plan?: string // EP, CP, MAP, AP
  gst_rate?: number
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

  // Extended Room Block Fields
  block_type?: 'Maintenance' | 'Renovation' | 'Pest Control' | 'Deep Cleaning' | 'Safety Issue'
  maintenance_ticket_number?: string
  approved_by?: string
  actual_release_date?: string
  inspection_status?: 'Pending' | 'Inspected' | 'Passed'
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

  let { data, count, error } = await query

  if (error || !data || data.length === 0) {
    try {
      const admin = createAdminClient()
      let adminQuery = admin
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
        adminQuery = adminQuery.eq('property_id', propertyId)
      }
      if (options?.search) {
        adminQuery = adminQuery.ilike('room_number', `%${options.search}%`)
      }
      if (options?.buildingId && options.buildingId !== 'all') {
        adminQuery = adminQuery.eq('building_id', options.buildingId)
      }
      if (options?.floorId && options.floorId !== 'all') {
        adminQuery = adminQuery.eq('floor_id', options.floorId)
      }
      if (options?.roomTypeId && options.roomTypeId !== 'all') {
        adminQuery = adminQuery.eq('room_type_id', options.roomTypeId)
      }
      if (options?.status && options.status !== 'all') {
        adminQuery = adminQuery.eq('status', options.status)
      }
      adminQuery = adminQuery.range(from, to)

      const adminRes = await adminQuery
      if (adminRes.data && adminRes.data.length > 0) {
        data = adminRes.data
        count = adminRes.count
        error = null
      }
    } catch (e) {
      console.error('getRooms admin fallback error:', e)
    }
  }

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
    max_adults: r.max_adults || r.room_type?.max_occupancy || 2,
    max_children: r.max_children || 1,
    weekday_price: r.weekday_price || r.room_type?.base_rate || 0,
    weekend_price: r.weekend_price || Math.round((r.room_type?.base_rate || 0) * 1.15),
    is_ac: r.is_ac ?? true,
    gst_category: r.gst_category || 'Accommodation',
    bed_type: r.bed_type || r.room_type?.bed_type || 'Double Bed',
    housekeeping_status: r.status === 'dirty' ? 'dirty' : r.status === 'cleaning' ? 'cleaning' : 'clean',
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
    base_occupancy: rt.base_occupancy || 2,
    default_adult_count: rt.default_adult_count || 2,
    default_child_count: rt.default_child_count || 1,
    bed_type: rt.bed_type || rt.default_bed_type || 'King Bed',
    size_sqft: parseFloat(rt.size_sqft) || 280,
    extra_adult_rate: parseFloat(rt.extra_adult_rate) || 500,
    extra_child_rate: parseFloat(rt.extra_child_rate) || 300,
    extra_bed_allowed: rt.extra_bed_allowed ?? true,
    default_meal_plan: rt.default_meal_plan || 'EP',
    gst_rate: parseFloat(rt.gst_rate) || 12,
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
        base_occupancy: payload.base_occupancy || 2,
        default_adult_count: payload.default_adult_count || 2,
        default_child_count: payload.default_child_count || 1,
        bed_type: payload.bed_type || 'King Bed',
        size_sqft: payload.size_sqft || 300,
        extra_adult_rate: payload.extra_adult_rate || 500,
        extra_child_rate: payload.extra_child_rate || 300,
        extra_bed_allowed: payload.extra_bed_allowed ?? true,
        default_meal_plan: payload.default_meal_plan || 'EP',
        gst_rate: payload.gst_rate || 12,
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
    block_type: b.block_type || 'Maintenance',
    maintenance_ticket_number: b.maintenance_ticket_number || '',
    approved_by: b.approved_by || '',
    actual_release_date: b.actual_release_date,
    inspection_status: b.inspection_status || 'Pending',
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
  block_type?: string
  maintenance_ticket_number?: string
  approved_by?: string
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
        block_type: payload.block_type || 'Maintenance',
        maintenance_ticket_number: payload.maintenance_ticket_number || '',
        approved_by: payload.approved_by || '',
        inspection_status: 'Pending',
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

// ============================================================================
// BULK UPLOAD ROOMS WITH AUTO-GENERATION OF TYPES, BUILDINGS & FLOORS
// ============================================================================

export interface BulkUploadRoomInput {
  room_number: string
  room_type: string
  building?: string
  floor?: string | number
  base_rate?: number
  max_occupancy?: number
  bed_type?: string
  status?: string
  is_smoking?: boolean
  notes?: string
}

export interface BulkUploadResult {
  success: boolean
  totalProcessed: number
  createdRoomsCount: number
  createdRoomTypesCount: number
  createdBuildingsCount: number
  createdFloorsCount: number
  createdRoomTypes: string[]
  createdBuildings: string[]
  createdFloors: string[]
  skippedDuplicates: string[]
  errors: { room_number: string; message: string }[]
  error?: string
}

export async function bulkUploadRooms(
  propertyId: string,
  rows: BulkUploadRoomInput[]
): Promise<BulkUploadResult> {
  try {
    const supabase = await createClient()

    if (!propertyId) {
      return {
        success: false,
        totalProcessed: 0,
        createdRoomsCount: 0,
        createdRoomTypesCount: 0,
        createdBuildingsCount: 0,
        createdFloorsCount: 0,
        createdRoomTypes: [],
        createdBuildings: [],
        createdFloors: [],
        skippedDuplicates: [],
        errors: [],
        error: 'Property ID is required.',
      }
    }

    if (!rows || rows.length === 0) {
      return {
        success: false,
        totalProcessed: 0,
        createdRoomsCount: 0,
        createdRoomTypesCount: 0,
        createdBuildingsCount: 0,
        createdFloorsCount: 0,
        createdRoomTypes: [],
        createdBuildings: [],
        createdFloors: [],
        skippedDuplicates: [],
        errors: [],
        error: 'No room rows provided for bulk upload.',
      }
    }

    const createdRoomTypes: string[] = []
    const createdBuildings: string[] = []
    const createdFloors: string[] = []
    const skippedDuplicates: string[] = []
    const errors: { room_number: string; message: string }[] = []

    // 1. Fetch existing rooms to prevent duplicate room numbers in this property
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('room_number')
      .eq('property_id', propertyId)

    const existingRoomNumbers = new Set(
      (existingRooms || []).map((r: any) => String(r.room_number).trim().toLowerCase())
    )

    // 2. Fetch existing buildings
    const { data: existingBuildings } = await supabase
      .from('buildings')
      .select('id, name')
      .eq('property_id', propertyId)

    const buildingMap = new Map<string, string>() // lowerName -> id
    for (const b of existingBuildings || []) {
      buildingMap.set(b.name.trim().toLowerCase(), b.id)
    }

    // 3. Fetch existing floors
    const { data: existingFloors } = await supabase
      .from('floors')
      .select('id, floor_number, building_id')
      .eq('property_id', propertyId)

    const floorMap = new Map<string, string>() // `${building_id || 'nobldg'}_${floor_number}` -> id
    for (const f of existingFloors || []) {
      floorMap.set(`${f.building_id || 'nobldg'}_${f.floor_number}`, f.id)
    }

    // 4. Fetch existing room types
    const { data: existingRoomTypes } = await supabase
      .from('room_types')
      .select('id, name')
      .eq('property_id', propertyId)

    const roomTypeMap = new Map<string, string>() // lowerName -> id
    for (const rt of existingRoomTypes || []) {
      roomTypeMap.set(rt.name.trim().toLowerCase(), rt.id)
    }

    // 5. AUTO-CREATE MISSING BUILDINGS
    for (const row of rows) {
      const bName = (row.building || '').trim()
      if (bName && !buildingMap.has(bName.toLowerCase())) {
        const { data: newB, error: bErr } = await supabase
          .from('buildings')
          .insert({
            property_id: propertyId,
            name: bName,
            code: bName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'BLD',
            is_active: true,
          })
          .select('id, name')
          .single()

        if (!bErr && newB) {
          buildingMap.set(newB.name.trim().toLowerCase(), newB.id)
          createdBuildings.push(newB.name)
        }
      }
    }

    // 6. AUTO-CREATE MISSING FLOORS
    for (const row of rows) {
      const bName = (row.building || '').trim()
      const bId = bName ? buildingMap.get(bName.toLowerCase()) : null

      let floorNum = 1
      if (row.floor !== undefined && row.floor !== null && row.floor !== '') {
        const parsed = parseInt(String(row.floor).replace(/[^\d-]/g, ''), 10)
        floorNum = isNaN(parsed) ? 1 : parsed
      }

      const floorKey = `${bId || 'nobldg'}_${floorNum}`
      if (!floorMap.has(floorKey)) {
        const floorName = floorNum === 0 ? 'Ground Floor' : `Floor ${floorNum}`
        const { data: newF, error: fErr } = await supabase
          .from('floors')
          .insert({
            property_id: propertyId,
            building_id: bId || null,
            floor_number: floorNum,
            name: floorName,
            is_active: true,
          })
          .select('id, floor_number, building_id')
          .single()

        if (!fErr && newF) {
          floorMap.set(`${newF.building_id || 'nobldg'}_${newF.floor_number}`, newF.id)
          createdFloors.push(`${floorName}${bName ? ` (${bName})` : ''}`)
        }
      }
    }

    // 7. AUTO-CREATE MISSING ROOM TYPES
    for (const row of rows) {
      const rtName = (row.room_type || '').trim()
      if (rtName && !roomTypeMap.has(rtName.toLowerCase())) {
        const code = rtName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'STD'
        const baseRate = typeof row.base_rate === 'number' && row.base_rate > 0 ? row.base_rate : 2500
        const maxOcc = typeof row.max_occupancy === 'number' && row.max_occupancy > 0 ? row.max_occupancy : 2
        const bedType = row.bed_type?.trim() || 'King Bed'

        const { data: newRT, error: rtErr } = await supabase
          .from('room_types')
          .insert({
            property_id: propertyId,
            name: rtName,
            code,
            description: `${rtName} accommodation`,
            base_rate: baseRate,
            max_occupancy: maxOcc,
            bed_type: bedType,
            size_sqft: 320,
            amenities: ['High-speed WiFi', 'Air Conditioning', 'Flat-screen TV', 'Room Service', 'Ensuite Bathroom'],
            images: [],
            is_active: true,
          })
          .select('id, name')
          .single()

        if (!rtErr && newRT) {
          roomTypeMap.set(newRT.name.trim().toLowerCase(), newRT.id)
          createdRoomTypes.push(newRT.name)
        }
      }
    }

    // 8. PREPARE ROOMS TO INSERT
    const roomsToInsert: any[] = []
    const validStatuses = ['available', 'occupied', 'reserved', 'dirty', 'cleaning', 'maintenance', 'out_of_order', 'blocked']

    for (const row of rows) {
      const roomNum = String(row.room_number || '').trim()
      if (!roomNum) {
        errors.push({ room_number: 'N/A', message: 'Missing room number.' })
        continue
      }

      if (existingRoomNumbers.has(roomNum.toLowerCase())) {
        skippedDuplicates.push(roomNum)
        continue
      }

      const rtName = (row.room_type || '').trim()
      const rtId = roomTypeMap.get(rtName.toLowerCase())
      if (!rtId) {
        errors.push({ room_number: roomNum, message: `Could not assign room category "${rtName}".` })
        continue
      }

      const bName = (row.building || '').trim()
      const bId = bName ? buildingMap.get(bName.toLowerCase()) || null : null

      let floorNum = 1
      if (row.floor !== undefined && row.floor !== null && row.floor !== '') {
        const parsed = parseInt(String(row.floor).replace(/[^\d-]/g, ''), 10)
        floorNum = isNaN(parsed) ? 1 : parsed
      }
      const floorId = floorMap.get(`${bId || 'nobldg'}_${floorNum}`) || null

      const status = row.status && validStatuses.includes(row.status.toLowerCase())
        ? row.status.toLowerCase()
        : 'available'

      roomsToInsert.push({
        property_id: propertyId,
        room_number: roomNum,
        building_id: bId,
        floor_id: floorId,
        room_type_id: rtId,
        status,
        is_smoking: Boolean(row.is_smoking),
        notes: row.notes || 'Bulk imported room',
        is_active: true,
      })

      // Add to set to prevent duplicates within the same batch
      existingRoomNumbers.add(roomNum.toLowerCase())
    }

    // 9. BATCH INSERT ROOMS
    let createdRoomsCount = 0
    if (roomsToInsert.length > 0) {
      const { data: insertedRooms, error: insertError } = await supabase
        .from('rooms')
        .insert(roomsToInsert)
        .select('id, room_number')

      if (insertError) {
        throw insertError
      }

      createdRoomsCount = insertedRooms?.length || 0

      // 10. AUTO-GENERATE QR CODES FOR ALL CREATED ROOMS
      if (insertedRooms && insertedRooms.length > 0) {
        await Promise.allSettled(
          insertedRooms.map((r: any) => generateRoomQRCode(propertyId, r.id))
        )
      }
    }

    // 11. REVALIDATE PATHS
    revalidatePath('/rooms')
    revalidatePath('/rooms/types')
    revalidatePath('/rooms/floors')
    revalidatePath('/rooms/buildings')
    revalidatePath('/rooms/qr-codes')
    revalidatePath('/dashboard')

    return {
      success: true,
      totalProcessed: rows.length,
      createdRoomsCount,
      createdRoomTypesCount: createdRoomTypes.length,
      createdBuildingsCount: createdBuildings.length,
      createdFloorsCount: createdFloors.length,
      createdRoomTypes,
      createdBuildings,
      createdFloors,
      skippedDuplicates,
      errors,
    }
  } catch (err: any) {
    return {
      success: false,
      totalProcessed: rows.length,
      createdRoomsCount: 0,
      createdRoomTypesCount: 0,
      createdBuildingsCount: 0,
      createdFloorsCount: 0,
      createdRoomTypes: [],
      createdBuildings: [],
      createdFloors: [],
      skippedDuplicates: [],
      errors: [],
      error: err.message,
    }
  }
}
