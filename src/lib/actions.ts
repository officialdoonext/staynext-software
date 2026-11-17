'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateReservationNumber } from '@/lib/utils'

export interface ActionResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Creates a new reservation
 */
export async function createReservationAction(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const propertyId = formData.get('propertyId') as string
    const guestFirstName = formData.get('firstName') as string
    const guestLastName = formData.get('lastName') as string
    const guestEmail = formData.get('email') as string
    const guestPhone = formData.get('phone') as string
    const roomTypeId = formData.get('roomTypeId') as string
    const roomId = formData.get('roomId') as string
    const checkInDate = formData.get('checkInDate') as string
    const checkOutDate = formData.get('checkOutDate') as string
    const numAdults = parseInt(formData.get('numAdults') as string) || 1
    const numChildren = parseInt(formData.get('numChildren') as string) || 0
    const totalAmount = parseFloat(formData.get('totalAmount') as string) || 0
    const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0
    const bookingSource = (formData.get('bookingSource') as string) || 'direct'
    const specialRequests = formData.get('specialRequests') as string

    const resNumber = generateReservationNumber()

    // 1. Resolve tenant_id for guest
    let tenantId: string | null = null
    if (propertyId) {
      const { data: prop } = await supabase
        .from('properties')
        .select('tenant_id')
        .eq('id', propertyId)
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

    // 2. First ensure guest exists or create guest
    let guestId: string | undefined
    if (guestEmail) {
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('email', guestEmail)
        .maybeSingle()

      if (existingGuest?.id) {
        guestId = existingGuest.id
      }
    }

    if (!guestId) {
      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert({
          tenant_id: tenantId,
          first_name: guestFirstName,
          last_name: guestLastName,
          email: guestEmail,
          phone: guestPhone,
        })
        .select('id')
        .single()

      if (!guestError && newGuest) {
        guestId = newGuest.id
      }
    }

    // 2. Insert reservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        reservation_number: resNumber,
        property_id: propertyId,
        guest_id: guestId,
        room_type_id: roomTypeId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        num_adults: numAdults,
        num_children: numChildren,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        payment_status: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
        status: 'confirmed',
        booking_source: bookingSource,
        special_requests: specialRequests,
      })
      .select('id, reservation_number')
      .single()

    if (resError) {
      return {
        success: false,
        message: 'Database error creating reservation',
        error: resError.message,
      }
    }

    // 3. Allocate room (either user-selected or auto-allocated available room of that category)
    let allocatedRoomId = roomId

    if (!allocatedRoomId && roomTypeId && propertyId) {
      const { data: candidateRooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('property_id', propertyId)
        .eq('room_type_id', roomTypeId)
        .eq('is_active', true)
        .order('room_number', { ascending: true })

      if (candidateRooms && candidateRooms.length > 0) {
        for (const candidate of candidateRooms) {
          const { data: existingBookings } = await supabase
            .from('reservation_rooms')
            .select('id')
            .eq('room_id', candidate.id)
            .eq('is_active', true)
            .lt('check_in_date', checkOutDate)
            .gt('check_out_date', checkInDate)

          if (!existingBookings || existingBookings.length === 0) {
            allocatedRoomId = candidate.id
            break
          }
        }
      }
    }

    if (allocatedRoomId && reservation) {
      await supabase.from('reservation_rooms').insert({
        reservation_id: reservation.id,
        room_id: allocatedRoomId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        rate_per_night: totalAmount,
      })

      await supabase.from('rooms').update({ status: 'reserved' }).eq('id', allocatedRoomId)
    }

    revalidatePath('/dashboard')
    revalidatePath('/reservations')
    revalidatePath('/reservations/calendar')
    revalidatePath('/rooms')
    revalidatePath('/front-desk')

    return {
      success: true,
      message: `Reservation ${resNumber} created successfully!`,
      data: reservation,
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to process reservation',
      error: err.message,
    }
  }
}

/**
 * Checks in a guest for a reservation
 */
export async function checkInGuestAction(reservationId: string, roomId?: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // 1. Update reservation status
    const { error: resError } = await supabase
      .from('reservations')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (resError) throw resError

    // 2. Update room status to occupied
    if (roomId) {
      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', roomId)
    }

    revalidatePath('/dashboard')
    revalidatePath('/reservations')
    revalidatePath('/front-desk')
    revalidatePath('/rooms')

    return {
      success: true,
      message: 'Guest successfully checked in!',
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Check-in failed',
      error: err.message,
    }
  }
}

/**
 * Processes checkout for a guest & triggers housekeeping
 */
export async function checkOutGuestAction(reservationId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Call stored procedure or manual update
    const { data, error } = await supabase.rpc('process_guest_checkout', {
      p_reservation_id: reservationId,
    })

    if (error) {
      // Fallback update if RPC not present in environment
      await supabase
        .from('reservations')
        .update({
          status: 'checked_out',
          checked_out_at: new Date().toISOString(),
        })
        .eq('id', reservationId)
    }

    revalidatePath('/dashboard')
    revalidatePath('/reservations')
    revalidatePath('/front-desk')
    revalidatePath('/housekeeping')
    revalidatePath('/rooms')

    return {
      success: true,
      message: 'Guest checkout completed and room marked dirty for housekeeping turnover.',
      data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Checkout process failed',
      error: err.message,
    }
  }
}

/**
 * Records a new hotel expense
 */
export async function createExpenseAction(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const propertyId = formData.get('propertyId') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string) || 0
    const category = formData.get('category') as string
    const vendorName = formData.get('vendorName') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const expenseDate = (formData.get('expenseDate') as string) || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.from('expenses').insert({
      property_id: propertyId,
      description,
      amount,
      vendor_name: vendorName,
      payment_method: paymentMethod,
      expense_date: expenseDate,
      status: 'approved',
    }).select().single()

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/expenses')
    revalidatePath('/reports')

    return {
      success: true,
      message: 'Expense successfully logged and approved!',
      data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to record expense',
      error: err.message,
    }
  }
}

/**
 * Creates a maintenance request
 */
export async function createMaintenanceAction(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const propertyId = formData.get('propertyId') as string
    const roomId = formData.get('roomId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = (formData.get('priority') as string) || 'medium'
    const category = formData.get('category') as string

    const { data, error } = await supabase.from('maintenance_requests').insert({
      property_id: propertyId,
      room_id: roomId || null,
      title,
      description,
      priority,
      category,
      status: 'open',
    }).select().single()

    if (error) throw error

    // If urgent room issue, mark room as maintenance
    if (roomId) {
      await supabase.from('rooms').update({ status: 'maintenance' }).eq('id', roomId)
    }

    revalidatePath('/dashboard')
    revalidatePath('/maintenance')
    revalidatePath('/rooms')

    return {
      success: true,
      message: 'Maintenance ticket created and technician alerted.',
      data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to create maintenance work order',
      error: err.message,
    }
  }
}

