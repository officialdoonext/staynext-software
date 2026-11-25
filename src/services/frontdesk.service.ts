'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { extendStayReservation, checkOutReservation } from '@/services/reservation.service'
import { getTenantPropertyIds } from '@/services/tenant.service'

export interface FrontDeskReservationInfo {
  id: string
  res_number: string
  guest_id?: string
  guest_name: string
  guest_phone: string
  guest_email?: string
  check_in_date: string
  check_in_time: string
  check_out_date: string
  check_out_time: string
  total_amount: number
  paid_amount: number
  balance_amount: number
  status: string
  is_overdue: boolean
  overdue_hours?: number
  overdue_text?: string
  num_adults?: number
  num_children?: number
}

export interface FrontDeskRoomItem {
  id: string
  property_id: string
  room_number: string
  floor_id?: string
  floor_name?: string
  building_id?: string
  building_name?: string
  room_type_id: string
  room_type_name: string
  base_rate: number
  bed_type?: string
  max_occupancy?: number
  is_smoking: boolean
  is_ac?: boolean
  notes?: string
  qr_token?: string
  db_status: string

  // Dynamic PMS live status:
  // 'available' (green) | 'occupied' (blue) | 'overdue_checkout' (orange/red alert) | 'housekeeping' (amber) | 'maintenance' (rose)
  computed_status: 'available' | 'occupied' | 'overdue_checkout' | 'housekeeping' | 'maintenance'

  // Active reservation if occupied or overdue
  current_reservation?: FrontDeskReservationInfo

  // Confirmed arrival scheduled for today (if room is available)
  today_arrival?: {
    id: string
    res_number: string
    guest_name: string
    guest_phone?: string
    check_in_date: string
    check_in_time: string
  }
}

export interface RoomTypeGroup {
  room_type_id: string
  room_type_name: string
  base_rate: number
  max_occupancy: number
  bed_type?: string
  total_rooms: number
  available_count: number
  occupied_count: number
  overdue_count: number
  housekeeping_count: number
  maintenance_count: number
  rooms: FrontDeskRoomItem[]
}

export interface FrontDeskMatrixResult {
  groups: RoomTypeGroup[]
  allRooms: FrontDeskRoomItem[]
  stats: {
    totalRooms: number
    availableCount: number
    occupiedCount: number
    overdueCount: number
    housekeepingCount: number
    maintenanceCount: number
  }
}

/**
 * Helper to parse check-out date and time safely
 */
function parseCheckOutDateTime(dateStr: string, timeStr?: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  let hour = 11
  let minute = 0
  if (timeStr && timeStr.includes(':')) {
    const parts = timeStr.split(':').map(Number)
    hour = parts[0] ?? 11
    minute = parts[1] ?? 0
  }
  return new Date(year, month - 1, day, hour, minute, 0)
}

/**
 * Fetch the complete, real-time Front Desk Room Matrix grouped by Room Types.
 * Accurately determines whether a room is occupied based on live timestamps.
 */
export async function getFrontDeskRoomMatrix(propertyId: string): Promise<FrontDeskMatrixResult> {
  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) {
    return {
      groups: [],
      allRooms: [],
      stats: {
        totalRooms: 0,
        availableCount: 0,
        occupiedCount: 0,
        overdueCount: 0,
        housekeepingCount: 0,
        maintenanceCount: 0,
      },
    }
  }

  const targetPropertyId = propertyId && allowedPropertyIds.includes(propertyId)
    ? propertyId
    : allowedPropertyIds[0]

  const supabase = await createClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // 1. Fetch Room Types
  const { data: roomTypesData } = await supabase
    .from('room_types')
    .select('id, name, base_rate, max_occupancy, bed_type')
    .eq('property_id', targetPropertyId)
    .order('name', { ascending: true })

  // 2. Fetch Rooms with relations
  const { data: roomsData } = await supabase
    .from('rooms')
    .select(`
      id,
      property_id,
      room_number,
      floor_id,
      building_id,
      room_type_id,
      status,
      is_smoking,
      is_active,
      notes,
      floor:floors(id, name, floor_number),
      building:buildings(id, name),
      room_type:room_types(id, name, base_rate, max_occupancy, bed_type),
      qr_code:room_qr_codes(token_hash)
    `)
    .eq('property_id', targetPropertyId)
    .order('room_number', { ascending: true })

  // 3. Fetch all active reservations (checked_in or confirmed)
  const { data: reservationsData } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_number,
      status,
      check_in_date,
      check_in_time,
      check_out_date,
      check_out_time,
      total_amount,
      paid_amount,
      num_adults,
      num_children,
      guest:guests(id, first_name, last_name, phone, email),
      rooms:reservation_rooms(room_id, is_active)
    `)
    .eq('property_id', targetPropertyId)
    .in('status', ['checked_in', 'confirmed'])

  // Map reservations by room_id
  const checkedInByRoom = new Map<string, any>()
  const confirmedTodayByRoom = new Map<string, any>()

  if (reservationsData) {
    for (const res of reservationsData) {
      const roomLinks = res.rooms || []
      for (const link of roomLinks) {
        if (!link.room_id) continue

        if (res.status === 'checked_in') {
          // In case multiple, prioritize the latest check_out_date
          const existing = checkedInByRoom.get(link.room_id)
          if (!existing || new Date(res.check_out_date) > new Date(existing.check_out_date)) {
            checkedInByRoom.set(link.room_id, res)
          }
        } else if (res.status === 'confirmed' && res.check_in_date === today) {
          confirmedTodayByRoom.set(link.room_id, res)
        }
      }
    }
  }

  const allRooms: FrontDeskRoomItem[] = []
  const staleRoomsToReset: string[] = []

  // 4. Compute dynamic live status for each room
  for (const r of roomsData || []) {
    const rawStatus = (r.status || 'available').toLowerCase()
    let computedStatus: FrontDeskRoomItem['computed_status'] = 'available'
    let currentReservation: FrontDeskReservationInfo | undefined = undefined
    let todayArrival: FrontDeskRoomItem['today_arrival'] | undefined = undefined

    // 4.1 Check Maintenance
    if (rawStatus === 'maintenance' || rawStatus === 'out_of_order' || rawStatus === 'blocked') {
      computedStatus = 'maintenance'
    } else {
      // 4.2 Check Checked-in Reservation
      const checkedInRes = checkedInByRoom.get(r.id)

      if (checkedInRes) {
        const checkOutDateTime = parseCheckOutDateTime(
          checkedInRes.check_out_date,
          checkedInRes.check_out_time
        )
        const isOverdue = now.getTime() > checkOutDateTime.getTime()

        let overdueHours = 0
        let overdueText: string | undefined = undefined

        if (isOverdue) {
          const diffMs = now.getTime() - checkOutDateTime.getTime()
          overdueHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(overdueHours / 24)
          if (diffDays > 0) {
            overdueText = `${diffDays}d ${overdueHours % 24}h overdue`
          } else {
            overdueText = `${Math.max(1, overdueHours)}h overdue`
          }
          computedStatus = 'overdue_checkout'
        } else {
          computedStatus = 'occupied'
        }

        const total = parseFloat(checkedInRes.total_amount) || 0
        const paid = parseFloat(checkedInRes.paid_amount) || 0

        currentReservation = {
          id: checkedInRes.id,
          res_number: checkedInRes.reservation_number,
          guest_id: checkedInRes.guest?.id,
          guest_name: `${checkedInRes.guest?.first_name || ''} ${checkedInRes.guest?.last_name || ''}`.trim() || 'Guest',
          guest_phone: checkedInRes.guest?.phone || '',
          guest_email: checkedInRes.guest?.email || '',
          check_in_date: checkedInRes.check_in_date,
          check_in_time: checkedInRes.check_in_time || '14:00',
          check_out_date: checkedInRes.check_out_date,
          check_out_time: checkedInRes.check_out_time || '11:00',
          total_amount: total,
          paid_amount: paid,
          balance_amount: Math.max(0, total - paid),
          status: checkedInRes.status,
          is_overdue: isOverdue,
          overdue_hours: overdueHours,
          overdue_text: overdueText,
          num_adults: checkedInRes.num_adults || 1,
          num_children: checkedInRes.num_children || 0,
        }
      } else {
        // No active checked-in guest
        if (rawStatus === 'dirty' || rawStatus === 'cleaning') {
          computedStatus = 'housekeeping'
        } else if (rawStatus === 'occupied' || rawStatus === 'reserved') {
          // If DB had status 'occupied' or 'reserved' but no guest is currently in-house:
          // Check if there is an arrival confirmed for today
          const confirmedRes = confirmedTodayByRoom.get(r.id)
          if (confirmedRes) {
            computedStatus = 'available'
            todayArrival = {
              id: confirmedRes.id,
              res_number: confirmedRes.reservation_number,
              guest_name: `${confirmedRes.guest?.first_name || ''} ${confirmedRes.guest?.last_name || ''}`.trim() || 'Guest',
              guest_phone: confirmedRes.guest?.phone || '',
              check_in_date: confirmedRes.check_in_date,
              check_in_time: confirmedRes.check_in_time || '14:00',
            }
          } else {
            // Stale occupied status in DB with no reservation - auto heal to available
            computedStatus = 'available'
            staleRoomsToReset.push(r.id)
          }
        } else {
          computedStatus = 'available'
          // Check if arrival scheduled for today
          const confirmedRes = confirmedTodayByRoom.get(r.id)
          if (confirmedRes) {
            todayArrival = {
              id: confirmedRes.id,
              res_number: confirmedRes.reservation_number,
              guest_name: `${confirmedRes.guest?.first_name || ''} ${confirmedRes.guest?.last_name || ''}`.trim() || 'Guest',
              guest_phone: confirmedRes.guest?.phone || '',
              check_in_date: confirmedRes.check_in_date,
              check_in_time: confirmedRes.check_in_time || '14:00',
            }
          }
        }
      }
    }

    const roomTypeObj: any = (Array.isArray(r.room_type) ? r.room_type[0] : r.room_type) || {}
    const floorObj: any = (Array.isArray(r.floor) ? r.floor[0] : r.floor) || {}
    const buildingObj: any = (Array.isArray(r.building) ? r.building[0] : r.building) || {}
    const qrObj: any = (Array.isArray(r.qr_code) ? r.qr_code[0] : r.qr_code) || {}

    allRooms.push({
      id: r.id,
      property_id: r.property_id,
      room_number: r.room_number,
      floor_id: r.floor_id,
      floor_name: floorObj.name || (floorObj.floor_number ? `Floor ${floorObj.floor_number}` : 'Floor 1'),
      building_id: r.building_id,
      building_name: buildingObj.name || 'Main Building',
      room_type_id: r.room_type_id,
      room_type_name: roomTypeObj.name || 'Standard Room',
      base_rate: roomTypeObj.base_rate || 0,
      bed_type: roomTypeObj.bed_type || 'King Bed',
      max_occupancy: roomTypeObj.max_occupancy || 2,
      is_smoking: r.is_smoking ?? false,
      is_ac: true,
      notes: r.notes || '',
      qr_token: qrObj.token_hash,
      db_status: rawStatus,
      computed_status: computedStatus,
      current_reservation: currentReservation,
      today_arrival: todayArrival,
    })
  }

  // 5. Asynchronously heal stale rooms in DB (without blocking execution)
  if (staleRoomsToReset.length > 0) {
    try {
      await supabase
        .from('rooms')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .in('id', staleRoomsToReset)
    } catch {
      // Non-blocking sync error
    }
  }

  // 6. Group rooms by Room Types
  const typeMap = new Map<string, RoomTypeGroup>()

  // Initialize with known room types
  for (const rt of roomTypesData || []) {
    typeMap.set(rt.id, {
      room_type_id: rt.id,
      room_type_name: rt.name,
      base_rate: rt.base_rate || 0,
      max_occupancy: rt.max_occupancy || 2,
      bed_type: rt.bed_type || 'King Bed',
      total_rooms: 0,
      available_count: 0,
      occupied_count: 0,
      overdue_count: 0,
      housekeeping_count: 0,
      maintenance_count: 0,
      rooms: [],
    })
  }

  // Put rooms into their groups
  for (const room of allRooms) {
    let group = typeMap.get(room.room_type_id)
    if (!group) {
      group = {
        room_type_id: room.room_type_id,
        room_type_name: room.room_type_name,
        base_rate: room.base_rate,
        max_occupancy: room.max_occupancy || 2,
        bed_type: room.bed_type || 'Standard Bed',
        total_rooms: 0,
        available_count: 0,
        occupied_count: 0,
        overdue_count: 0,
        housekeeping_count: 0,
        maintenance_count: 0,
        rooms: [],
      }
      typeMap.set(room.room_type_id, group)
    }

    group.total_rooms += 1
    group.rooms.push(room)

    switch (room.computed_status) {
      case 'available':
        group.available_count += 1
        break
      case 'occupied':
        group.occupied_count += 1
        break
      case 'overdue_checkout':
        group.overdue_count += 1
        break
      case 'housekeeping':
        group.housekeeping_count += 1
        break
      case 'maintenance':
        group.maintenance_count += 1
        break
    }
  }

  const groups = Array.from(typeMap.values())

  // Overall Stats
  const stats = {
    totalRooms: allRooms.length,
    availableCount: allRooms.filter((r) => r.computed_status === 'available').length,
    occupiedCount: allRooms.filter((r) => r.computed_status === 'occupied').length,
    overdueCount: allRooms.filter((r) => r.computed_status === 'overdue_checkout').length,
    housekeepingCount: allRooms.filter((r) => r.computed_status === 'housekeeping').length,
    maintenanceCount: allRooms.filter((r) => r.computed_status === 'maintenance').length,
  }

  return {
    groups,
    allRooms,
    stats,
  }
}

/**
 * Instant Server Actions for Front Desk
 */
export async function updateFrontDeskRoomStatus(
  roomId: string,
  newStatus: 'available' | 'dirty' | 'cleaning' | 'maintenance'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('rooms')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', roomId)

    if (error) throw error

    revalidatePath('/front-desk')
    revalidatePath('/rooms')
    revalidatePath('/housekeeping')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function extendStayFrontDeskAction(
  reservationId: string,
  newCheckOutDate: string,
  extraCharge: number = 0,
  newCheckOutTime?: string
): Promise<{ success: boolean; error?: string }> {
  return extendStayReservation(reservationId, newCheckOutDate, extraCharge, newCheckOutTime)
}

export async function checkOutFrontDeskAction(
  reservationId: string,
  roomId?: string
): Promise<{ success: boolean; error?: string }> {
  return checkOutReservation(reservationId, roomId)
}
