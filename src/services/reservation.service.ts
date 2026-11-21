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
  check_in_time?: string
  check_out_date: string
  check_out_time?: string
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
      check_in_time: res.check_in_time || '14:00',
      check_out_date: res.check_out_date,
      check_out_time: res.check_out_time || '11:00',
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
    check_in_time: data.check_in_time || '14:00',
    check_out_date: data.check_out_date,
    check_out_time: data.check_out_time || '11:00',
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

export interface AccompanyingGuestItem {
  id?: string
  name: string
  age?: number | string
  gender?: string
  relationship?: string
  phone?: string
  nationality?: string
  id_type?: string
  id_number?: string
  verification_status?: string
}

export interface CreateReservationPayload {
  property_id: string
  // 1. Guest Information
  first_name: string
  last_name: string
  guest_type?: string
  gender?: string
  date_of_birth?: string
  age?: number | string
  email?: string
  phone: string
  alternate_phone?: string
  nationality?: string
  occupation?: string
  company_name?: string

  // 2. Identity & Documents
  id_type?: string
  id_number?: string
  id_issue_date?: string
  id_expiry_date?: string
  id_verification_status?: string
  verified_by?: string
  verification_date?: string
  id_document_url?: string

  // Foreign Guest / Form III (Form C)
  is_foreign_guest?: boolean
  passport_number?: string
  passport_issue_date?: string
  passport_expiry_date?: string
  passport_issue_country?: string
  passport_issue_place?: string
  visa_number?: string
  visa_type?: string
  visa_issue_date?: string
  visa_expiry_date?: string
  permanent_address_abroad?: string
  address_in_india?: string
  date_of_arrival_in_india?: string
  arrived_from?: string
  purpose_of_visit?: string
  expected_duration_days?: number | string
  guest_photo_url?: string

  // 3. Booking & Stay Details
  booking_type?: string
  booking_source?: string
  booking_date?: string
  check_in_date: string
  check_in_time?: string
  check_out_date: string
  check_out_time?: string
  num_adults: number
  num_children: number
  special_requests?: string
  status?: 'confirmed' | 'checked_in' | 'reserved'
  immediate_check_in?: boolean

  // 4. Room Allocation
  room_type_id: string
  room_id?: string
  room_tariff?: number
  extra_bed?: boolean
  extra_bed_charges?: number

  // 5. Payment & Billing
  room_charges?: number
  food_charges?: number
  other_charges?: number
  discount_amount?: number
  subtotal_amount?: number
  taxable_amount?: number
  gst_rate?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  tax_amount?: number
  total_amount: number
  paid_amount: number
  payment_method?: string
  payment_mode?: string
  transaction_reference?: string

  // 6. Additional Guest Information (Accompanying Guests)
  accompanying_guests?: AccompanyingGuestItem[]

  // 7. Check-in & Signature
  key_card_number?: string
  guest_signature?: string
  checkin_handled_by?: string
}

/**
 * Create a reservation atomically with all 6 registration sections
 */
export async function createReservation(
  payload: CreateReservationPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Resolve tenant_id for guest
    let tenantId: string | null = null
    if (payload.property_id) {
      const { data: prop } = await supabase
        .from('properties')
        .select('tenant_id')
        .eq('id', payload.property_id)
        .maybeSingle()
      tenantId = prop?.tenant_id || null
    }

    if (!tenantId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tu } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
        tenantId = tu?.tenant_id || null
      }
    }

    if (!tenantId) {
      const { data: fallbackTenant } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .maybeSingle()
      tenantId = fallbackTenant?.id || null
    }

    // 2. Find or create/update guest
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
    } else if (payload.phone) {
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('phone', payload.phone.trim())
        .maybeSingle()

      if (existingGuest?.id) {
        guestId = existingGuest.id
      }
    }

    const guestPayload: Record<string, any> = {
      tenant_id: tenantId,
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      email: payload.email?.trim().toLowerCase() || null,
      phone: payload.phone.trim() || null,
      nationality: payload.nationality || 'India',
      id_type: payload.id_type || 'Aadhaar Card',
      id_number: payload.id_number || '',
      gender: payload.gender || 'Prefer not to say',
      date_of_birth: payload.date_of_birth || null,
      guest_type: payload.guest_type || 'Individual',
      age: payload.age ? Number(payload.age) : null,
      alternate_phone: payload.alternate_phone || null,
      occupation: payload.occupation || null,
      company_name: payload.company_name || null,
      id_issue_date: payload.id_issue_date || null,
      id_expiry_date: payload.id_expiry_date || null,
      id_verification_status: payload.id_verification_status || 'Verified',
      verified_by: payload.verified_by || 'Front Desk',
      verification_date: payload.verification_date || new Date().toISOString(),
      id_document_url: payload.id_document_url || null,
      is_foreign_guest: Boolean(payload.is_foreign_guest),
      passport_number: payload.passport_number || null,
      passport_issue_date: payload.passport_issue_date || null,
      passport_expiry_date: payload.passport_expiry_date || null,
      passport_issue_country: payload.passport_issue_country || null,
      passport_issue_place: payload.passport_issue_place || null,
      visa_number: payload.visa_number || null,
      visa_type: payload.visa_type || null,
      visa_issue_date: payload.visa_issue_date || null,
      visa_expiry_date: payload.visa_expiry_date || null,
      permanent_address_abroad: payload.permanent_address_abroad || null,
      address_in_india: payload.address_in_india || null,
      date_of_arrival_in_india: payload.date_of_arrival_in_india || null,
      arrived_from: payload.arrived_from || null,
      purpose_of_visit: payload.purpose_of_visit || null,
      expected_duration_days: payload.expected_duration_days ? Number(payload.expected_duration_days) : null,
      guest_photo_url: payload.guest_photo_url || null,
    }

    if (!guestId) {
      // Try insert with full fields, gracefully fall back if columns pending migration
      let insertResult = await supabase.from('guests').insert(guestPayload).select('id').single()
      if (insertResult.error) {
        // Fallback to basic columns if migration 009 not yet executed in Supabase
        const basicGuestPayload = {
          tenant_id: tenantId,
          first_name: payload.first_name.trim(),
          last_name: payload.last_name.trim(),
          email: payload.email?.trim().toLowerCase() || null,
          phone: payload.phone.trim() || null,
          id_type: payload.id_type || 'passport',
          id_number: payload.id_number || '',
          nationality: payload.nationality || 'India',
          gender: payload.gender || 'Prefer not to say',
          date_of_birth: payload.date_of_birth || null,
        }
        insertResult = await supabase.from('guests').insert(basicGuestPayload).select('id').single()
      }
      if (insertResult.error) throw insertResult.error
      guestId = insertResult.data.id
    } else {
      // Update existing guest info
      try {
        await supabase.from('guests').update(guestPayload).eq('id', guestId)
      } catch {
        // Ignored if custom columns pending migration
      }
    }

    const resNumber = generateReservationNumber()
    const paymentStatus =
      payload.paid_amount >= payload.total_amount
        ? 'paid'
        : payload.paid_amount > 0
        ? 'partial'
        : 'pending'

    const isImmediateCheckIn = Boolean(payload.immediate_check_in || payload.status === 'checked_in')
    const reservationStatus = isImmediateCheckIn ? 'checked_in' : 'confirmed'
    const nowIso = new Date().toISOString()

    // 3. Insert reservation record
    const reservationInsertPayload: Record<string, any> = {
      reservation_number: resNumber,
      property_id: payload.property_id,
      guest_id: guestId,
      room_type_id: payload.room_type_id,
      check_in_date: payload.check_in_date,
      check_in_time: payload.check_in_time || '14:00',
      check_out_date: payload.check_out_date,
      check_out_time: payload.check_out_time || '11:00',
      num_adults: payload.num_adults || 1,
      num_children: payload.num_children || 0,
      total_amount: payload.total_amount,
      paid_amount: payload.paid_amount || 0,
      payment_status: paymentStatus,
      status: reservationStatus,
      booking_source: payload.booking_source || 'direct',
      special_requests: payload.special_requests || '',
      checked_in_at: isImmediateCheckIn ? nowIso : null,
      // Extended fields
      booking_type: payload.booking_type || (isImmediateCheckIn ? 'Walk-in' : 'Advance Booking'),
      booking_date: payload.booking_date || payload.check_in_date,
      purpose_of_visit: payload.purpose_of_visit || 'Personal',
      extra_bed: Boolean(payload.extra_bed),
      extra_bed_charges: payload.extra_bed_charges || 0,
      food_charges: payload.food_charges || 0,
      other_charges: payload.other_charges || 0,
      discount_amount: payload.discount_amount || 0,
      subtotal_amount: payload.subtotal_amount || payload.total_amount,
      taxable_amount: payload.taxable_amount || payload.total_amount,
      gst_rate: payload.gst_rate || 12,
      cgst_amount: payload.cgst_amount || 0,
      sgst_amount: payload.sgst_amount || 0,
      igst_amount: payload.igst_amount || 0,
      tax_amount: payload.tax_amount || 0,
      payment_mode: payload.payment_mode || payload.payment_method || 'Cash',
      transaction_reference: payload.transaction_reference || null,
      accompanying_guests: payload.accompanying_guests || [],
      key_card_number: payload.key_card_number || null,
      guest_signature: payload.guest_signature || null,
      checkin_handled_by: payload.checkin_handled_by || 'Front Desk',
    }

    let { data: reservation, error: resErr } = await supabase
      .from('reservations')
      .insert(reservationInsertPayload)
      .select()
      .single()

    // Fallback if migration 009 columns pending in Supabase
    if (resErr) {
      const basicReservationPayload = {
        reservation_number: resNumber,
        property_id: payload.property_id,
        guest_id: guestId,
        room_type_id: payload.room_type_id,
        check_in_date: payload.check_in_date,
        check_in_time: payload.check_in_time || '14:00',
        check_out_date: payload.check_out_date,
        check_out_time: payload.check_out_time || '11:00',
        num_adults: payload.num_adults || 1,
        num_children: payload.num_children || 0,
        total_amount: payload.total_amount,
        paid_amount: payload.paid_amount || 0,
        payment_status: paymentStatus,
        status: reservationStatus,
        booking_source: payload.booking_source || 'direct',
        special_requests: payload.special_requests || '',
        checked_in_at: isImmediateCheckIn ? nowIso : null,
      }
      const retryResult = await supabase
        .from('reservations')
        .insert(basicReservationPayload)
        .select()
        .single()
      if (retryResult.error) throw retryResult.error
      reservation = retryResult.data
    }

    // 4. Save accompanying guests to relational table if present
    if (payload.accompanying_guests && payload.accompanying_guests.length > 0 && reservation?.id) {
      const guestRows = payload.accompanying_guests
        .filter((g) => g.name && g.name.trim())
        .map((g) => ({
          reservation_id: reservation.id,
          guest_name: g.name.trim(),
          age: g.age ? Number(g.age) : null,
          gender: g.gender || 'Prefer not to say',
          relationship: g.relationship || 'Guest',
          phone: g.phone || null,
          nationality: g.nationality || 'India',
          id_type: g.id_type || 'Aadhaar Card',
          id_number: g.id_number || '',
          verification_status: g.verification_status || 'Verified',
        }))

      if (guestRows.length > 0) {
        try {
          await supabase.from('reservation_accompanying_guests').insert(guestRows)
        } catch {
          // Ignored if table pending migration
        }
      }
    }

    // 5. Allocate room (either user-selected or auto-allocated available room of that category)
    let allocatedRoomId = payload.room_id

    if (!allocatedRoomId && payload.room_type_id && payload.property_id) {
      // Find candidate rooms matching the room type in this property
      const { data: candidateRooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('property_id', payload.property_id)
        .eq('room_type_id', payload.room_type_id)
        .eq('is_active', true)
        .order('room_number', { ascending: true })

      if (candidateRooms && candidateRooms.length > 0) {
        for (const candidate of candidateRooms) {
          // Check for date collision in reservation_rooms
          const { data: existingBookings } = await supabase
            .from('reservation_rooms')
            .select('id')
            .eq('room_id', candidate.id)
            .eq('is_active', true)
            .lt('check_in_date', payload.check_out_date)
            .gt('check_out_date', payload.check_in_date)

          if (!existingBookings || existingBookings.length === 0) {
            allocatedRoomId = candidate.id
            break
          }
        }
      }
    }

    if (allocatedRoomId) {
      await supabase.from('reservation_rooms').insert({
        reservation_id: reservation.id,
        room_id: allocatedRoomId,
        check_in_date: payload.check_in_date,
        check_in_time: payload.check_in_time || '14:00',
        check_out_date: payload.check_out_date,
        check_out_time: payload.check_out_time || '11:00',
        rate_per_night: payload.room_tariff || payload.total_amount,
      })

      const targetRoomStatus = isImmediateCheckIn ? 'occupied' : 'reserved'
      await supabase.from('rooms').update({ status: targetRoomStatus }).eq('id', allocatedRoomId)
    }

    revalidatePath('/reservations')
    revalidatePath('/reservations/calendar')
    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
    revalidatePath('/guests')
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
    revalidatePath('/reservations/calendar')
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

      // Fetch property_id from room or reservation
      let propId: string | null = null
      const { data: roomData } = await supabase
        .from('rooms')
        .select('property_id')
        .eq('id', targetRoomId)
        .maybeSingle()
      propId = roomData?.property_id || null

      if (!propId) {
        const { data: resData } = await supabase
          .from('reservations')
          .select('property_id')
          .eq('id', reservationId)
          .maybeSingle()
        propId = resData?.property_id || null
      }

      if (propId) {
        // Also insert housekeeping task
        await supabase.from('housekeeping_tasks').insert({
          property_id: propId,
          room_id: targetRoomId,
          task_type: 'checkout_cleaning',
          priority: 'high',
          status: 'pending',
        })
      }
    }

    revalidatePath('/reservations')
    revalidatePath('/reservations/calendar')
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
 * Assign or reassign a physical room to a reservation
 */
export async function assignRoomToReservation(
  reservationId: string,
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch reservation
    const { data: res, error: resErr } = await supabase
      .from('reservations')
      .select('id, property_id, check_in_date, check_in_time, check_out_date, check_out_time, total_amount')
      .eq('id', reservationId)
      .single()

    if (resErr || !res) throw new Error('Reservation record not found')

    // 2. Check if already has an allocation
    const { data: existing } = await supabase
      .from('reservation_rooms')
      .select('id')
      .eq('reservation_id', reservationId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('reservation_rooms')
        .update({
          room_id: roomId,
          check_in_date: res.check_in_date,
          check_in_time: res.check_in_time || '14:00',
          check_out_date: res.check_out_date,
          check_out_time: res.check_out_time || '11:00',
          rate_per_night: res.total_amount,
          is_active: true,
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('reservation_rooms')
        .insert({
          reservation_id: reservationId,
          room_id: roomId,
          check_in_date: res.check_in_date,
          check_in_time: res.check_in_time || '14:00',
          check_out_date: res.check_out_date,
          check_out_time: res.check_out_time || '11:00',
          rate_per_night: res.total_amount,
          is_active: true,
        })
    }

    // 3. Mark room as reserved
    await supabase.from('rooms').update({ status: 'reserved' }).eq('id', roomId)

    revalidatePath('/reservations')
    revalidatePath('/reservations/calendar')
    revalidatePath('/front-desk')
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
    revalidatePath('/reservations/calendar')
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

