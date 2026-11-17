'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateReservationNumber } from '@/lib/utils'

export interface ReservationDetail {
  id: string
  reservation_number: string
  property_id: string
  guest_id?: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guest_id_type?: string
  guest_id_number?: string
  room_type_id: string
  room_type_name: string
  room_id?: string
  room_number?: string
  check_in_date: string
  check_out_date: string
  nights: number
  num_adults: number
  num_children: number
  base_rate_per_night: number
  room_charges: number
  extra_bed_charges: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  payment_status: 'paid' | 'partial' | 'pending' | 'refunded'
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
  booking_source: string
  special_requests?: string
  internal_notes?: string
  checked_in_at?: string
  checked_out_at?: string
  created_at: string
}

export interface ReservationFilterOptions {
  search?: string
  status?: string
  roomTypeId?: string
  bookingSource?: string
  checkInDate?: string
  checkOutDate?: string
  page?: number
  limit?: number
}

/**
 * Fetch reservations with full guest, room type, and allocated room joins
 */
export async function getReservations(
  propertyId?: string,
  options?: ReservationFilterOptions
): Promise<{ reservations: ReservationDetail[]; totalCount: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select(
      `
      *,
      guest:guests(first_name, last_name, email, phone, id_type, id_number),
      room_type:room_types(id, name, base_rate),
      rooms:reservation_rooms(
        room:rooms(id, room_number)
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  if (options?.roomTypeId && options.roomTypeId !== 'all') {
    query = query.eq('room_type_id', options.roomTypeId)
  }

  if (options?.bookingSource && options.bookingSource !== 'all') {
    query = query.eq('booking_source', options.bookingSource)
  }

  if (options?.checkInDate) {
    query = query.gte('check_in_date', options.checkInDate)
  }

  if (options?.checkOutDate) {
    query = query.lte('check_out_date', options.checkOutDate)
  }

  if (options?.search) {
    query = query.or(
      `reservation_number.ilike.%${options.search}%,special_requests.ilike.%${options.search}%`
    )
  }

  const page = options?.page || 1
  const limit = options?.limit || 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error || !data) {
    return { reservations: [], totalCount: 0 }
  }

  const list: ReservationDetail[] = data.map((res: any) => {
    const allocatedRoom = res.rooms?.[0]?.room

    const checkIn = new Date(res.check_in_date)
    const checkOut = new Date(res.check_out_date)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    const total = parseFloat(res.total_amount) || 0
    const paid = parseFloat(res.paid_amount) || 0
    const balance = Math.max(0, total - paid)

    const guestObj = res.guest
    const guestName = guestObj
      ? `${guestObj.first_name || ''} ${guestObj.last_name || ''}`.trim()
      : 'Guest'

    return {
      id: res.id,
      reservation_number: res.reservation_number,
      property_id: res.property_id,
      guest_id: res.guest_id,
      guest_name: guestName || 'Walk-in Guest',
      guest_email: guestObj?.email || '',
      guest_phone: guestObj?.phone || '',
      guest_id_type: guestObj?.id_type || '',
      guest_id_number: guestObj?.id_number || '',
      room_type_id: res.room_type_id,
      room_type_name: res.room_type?.name || 'Standard Room',
      room_id: allocatedRoom?.id,
      room_number: allocatedRoom?.room_number,
      check_in_date: res.check_in_date,
      check_out_date: res.check_out_date,
      nights,
      num_adults: res.num_adults || 1,
      num_children: res.num_children || 0,
      base_rate_per_night: parseFloat(res.room_type?.base_rate) || 0,
      room_charges: total,
      extra_bed_charges: 0,
      tax_amount: Math.round(total * 0.12 * 100) / 100,
      discount_amount: 0,
      total_amount: total,
      paid_amount: paid,
      balance_amount: balance,
      payment_status: res.payment_status || (paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'),
      status: res.status || 'confirmed',
      booking_source: res.booking_source || 'direct',
      special_requests: res.special_requests || '',
      internal_notes: res.internal_notes || '',
      checked_in_at: res.checked_in_at,
      checked_out_at: res.checked_out_at,
      created_at: res.created_at,
    }
  })

  return { reservations: list, totalCount: count || list.length }
}

/**
 * Fetch single reservation details
 */
export async function getReservationById(reservationId: string): Promise<ReservationDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(first_name, last_name, email, phone, id_type, id_number),
      room_type:room_types(id, name, base_rate),
      rooms:reservation_rooms(
        room:rooms(id, room_number)
      )
    `)
    .eq('id', reservationId)
    .single()

  if (error || !data) return null

  const allocatedRoom = data.rooms?.[0]?.room
  const total = parseFloat(data.total_amount) || 0
  const paid = parseFloat(data.paid_amount) || 0

  const checkIn = new Date(data.check_in_date)
  const checkOut = new Date(data.check_out_date)
  const nights = Math.max(1, Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    id: data.id,
    reservation_number: data.reservation_number,
    property_id: data.property_id,
    guest_id: data.guest_id,
    guest_name: `${data.guest?.first_name || ''} ${data.guest?.last_name || ''}`.trim() || 'Guest',
    guest_email: data.guest?.email || '',
    guest_phone: data.guest?.phone || '',
    guest_id_type: data.guest?.id_type,
    guest_id_number: data.guest?.id_number,
    room_type_id: data.room_type_id,
    room_type_name: data.room_type?.name || 'Standard Room',
    room_id: allocatedRoom?.id,
    room_number: allocatedRoom?.room_number,
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    nights,
    num_adults: data.num_adults || 1,
    num_children: data.num_children || 0,
    base_rate_per_night: parseFloat(data.room_type?.base_rate) || 0,
    room_charges: total,
    extra_bed_charges: 0,
    tax_amount: Math.round(total * 0.12 * 100) / 100,
    discount_amount: 0,
    total_amount: total,
    paid_amount: paid,
    balance_amount: Math.max(0, total - paid),
    payment_status: data.payment_status || (paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'),
    status: data.status,
    booking_source: data.booking_source || 'direct',
    special_requests: data.special_requests || '',
    internal_notes: data.internal_notes || '',
    checked_in_at: data.checked_in_at,
    checked_out_at: data.checked_out_at,
    created_at: data.created_at,
  }
}

/**
 * Create a reservation atomically
 */
export async function createReservation(payload: {
  property_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  id_type?: string
  id_number?: string
  room_type_id: string
  room_id?: string
  check_in_date: string
  check_out_date: string
  num_adults: number
  num_children: number
  total_amount: number
  paid_amount: number
  payment_method?: string
  booking_source?: string
  special_requests?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Find or create guest
    let guestId: string | undefined
    if (payload.email) {
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('email', payload.email.trim().toLowerCase())
        .maybeSingle()

      if (existingGuest?.id) {
        guestId = existingGuest.id
      }
    }

    if (!guestId) {
      const { data: newGuest, error: guestErr } = await supabase
        .from('guests')
        .insert({
          first_name: payload.first_name.trim(),
          last_name: payload.last_name.trim(),
          email: payload.email.trim().toLowerCase() || null,
          phone: payload.phone.trim() || null,
          id_type: payload.id_type || 'passport',
          id_number: payload.id_number || '',
        })
        .select('id')
        .single()

      if (guestErr) throw guestErr
      guestId = newGuest.id
    }

    const resNumber = generateReservationNumber()
    const paymentStatus =
      payload.paid_amount >= payload.total_amount
        ? 'paid'
        : payload.paid_amount > 0
        ? 'partial'
        : 'pending'

    // 2. Insert reservation
    const { data: reservation, error: resErr } = await supabase
      .from('reservations')
      .insert({
        reservation_number: resNumber,
        property_id: payload.property_id,
        guest_id: guestId,
        room_type_id: payload.room_type_id,
        check_in_date: payload.check_in_date,
        check_out_date: payload.check_out_date,
        num_adults: payload.num_adults || 1,
        num_children: payload.num_children || 0,
        total_amount: payload.total_amount,
        paid_amount: payload.paid_amount || 0,
        payment_status: paymentStatus,
        status: 'confirmed',
        booking_source: payload.booking_source || 'direct',
        special_requests: payload.special_requests || '',
      })
      .select()
      .single()

    if (resErr) throw resErr

    // 3. Allocate room if selected
    if (payload.room_id) {
      await supabase.from('reservation_rooms').insert({
        reservation_id: reservation.id,
        room_id: payload.room_id,
        check_in_date: payload.check_in_date,
        check_out_date: payload.check_out_date,
        rate_per_night: payload.total_amount,
      })

      await supabase.from('rooms').update({ status: 'reserved' }).eq('id', payload.room_id)
    }

    revalidatePath('/reservations')
    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
    return { success: true, data: reservation }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Check-in guest
 */
export async function checkInReservation(
  reservationId: string,
  roomId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Update reservation status
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (error) throw error

    // 2. If room specified, allocate or update room status to occupied
    if (roomId) {
      // Check if already mapped in reservation_rooms
      const { data: existingMap } = await supabase
        .from('reservation_rooms')
        .select('id')
        .eq('reservation_id', reservationId)
        .maybeSingle()

      if (!existingMap) {
        await supabase.from('reservation_rooms').insert({
          reservation_id: reservationId,
          room_id: roomId,
          check_in_date: new Date().toISOString().split('T')[0],
          check_out_date: new Date().toISOString().split('T')[0],
        })
      }

      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', roomId)
    }

    revalidatePath('/reservations')
    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Check-out guest & turnover room to housekeeping dirty
 */
export async function checkOutReservation(
  reservationId: string,
  roomId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Update reservation
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (error) throw error

    // 2. Find allocated room if not supplied
    let targetRoomId = roomId
    if (!targetRoomId) {
      const { data: resRoom } = await supabase
        .from('reservation_rooms')
        .select('room_id')
        .eq('reservation_id', reservationId)
        .maybeSingle()

      targetRoomId = resRoom?.room_id
    }

    // 3. Mark room as dirty for housekeeping turnover
    if (targetRoomId) {
      await supabase.from('rooms').update({ status: 'dirty' }).eq('id', targetRoomId)

      // Also insert housekeeping task
      await supabase.from('housekeeping_tasks').insert({
        room_id: targetRoomId,
        task_type: 'checkout_cleaning',
        priority: 'high',
        status: 'pending',
      })
    }

    revalidatePath('/reservations')
    revalidatePath('/front-desk')
    revalidatePath('/housekeeping')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Find room to release
    const { data: resRoom } = await supabase
      .from('reservation_rooms')
      .select('room_id')
      .eq('reservation_id', reservationId)
      .maybeSingle()

    // 2. Update reservation
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        special_requests: reason ? `[Cancelled: ${reason}]` : undefined,
      })
      .eq('id', reservationId)

    if (error) throw error

    // 3. Release room
    if (resRoom?.room_id) {
      await supabase.from('rooms').update({ status: 'available' }).eq('id', resRoom.room_id)
    }

    revalidatePath('/reservations')
    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Front desk today's operational views
 */
export async function getFrontDeskOperations(propertyId?: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // 1. Arrivals today
  let arrQuery = supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(first_name, last_name, phone, email),
      room_type:room_types(name),
      rooms:reservation_rooms(
        room:rooms(id, room_number)
      )
    `)
    .eq('check_in_date', today)
    .in('status', ['confirmed', 'checked_in'])

  // 2. Departures today
  let depQuery = supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(first_name, last_name, phone, email),
      room_type:room_types(name),
      rooms:reservation_rooms(
        room:rooms(id, room_number)
      )
    `)
    .eq('check_out_date', today)
    .in('status', ['checked_in', 'checked_out'])

  // 3. In-house guests
  let inHouseQuery = supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(first_name, last_name, phone, email),
      room_type:room_types(name),
      rooms:reservation_rooms(
        room:rooms(id, room_number)
      )
    `)
    .eq('status', 'checked_in')

  if (propertyId) {
    arrQuery = arrQuery.eq('property_id', propertyId)
    depQuery = depQuery.eq('property_id', propertyId)
    inHouseQuery = inHouseQuery.eq('property_id', propertyId)
  }

  const [arrRes, depRes, inHouseRes] = await Promise.all([arrQuery, depQuery, inHouseQuery])

  const mapRes = (data: any[]) =>
    (data || []).map((r) => {
      const allocatedRoom = r.rooms?.[0]?.room
      const total = parseFloat(r.total_amount) || 0
      const paid = parseFloat(r.paid_amount) || 0
      return {
        id: r.id,
        resNumber: r.reservation_number,
        guestName: `${r.guest?.first_name || ''} ${r.guest?.last_name || ''}`.trim() || 'Guest',
        phone: r.guest?.phone || '',
        roomType: r.room_type?.name || 'Standard',
        roomId: allocatedRoom?.id,
        roomNumber: allocatedRoom?.room_number || 'Unallocated',
        checkInDate: r.check_in_date,
        checkOutDate: r.check_out_date,
        total,
        paid,
        balance: Math.max(0, total - paid),
        status: r.status,
      }
    })

  return {
    todayArrivals: mapRes(arrRes.data || []),
    todayDepartures: mapRes(depRes.data || []),
    inHouseGuests: mapRes(inHouseRes.data || []),
  }
}

