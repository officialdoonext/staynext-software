'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { dispatchGuestRequestNotifications } from '@/services/notification-dispatcher.service'

export interface GuestRoomContext {
  isValid: boolean
  property: {
    id: string
    name: string
    logo_url?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    currency: string
  }
  room: {
    id: string
    room_number: string
    room_type_name: string
  }
  guestName?: string
  checkInDate?: string
  checkOutDate?: string
  errorMessage?: string
}

export interface GuestServiceCategoryWithItems {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  display_order: number
  items: Array<{
    id: string
    name: string
    description?: string
    price: number
    tax_rate_percentage: number
    dietary_type?: string
    is_available: boolean
    preparation_time_mins: number
    image_url?: string
  }>
}

/**
 * Validate guest access via Room QR token
 */
export async function validateGuestRoom(
  propertyId: string,
  roomId: string,
  token?: string
): Promise<GuestRoomContext> {
  const supabase = await createClient()

  // 1. Fetch Property
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name, logo_url, phone, email, address, city, currency')
    .eq('id', propertyId)
    .single()

  if (propError || !property) {
    return {
      isValid: false,
      property: { id: propertyId, name: 'StayNext Hotel', currency: 'INR' },
      room: { id: roomId, room_number: 'N/A', room_type_name: 'Room' },
      errorMessage: 'Hotel property could not be found or is inactive.',
    }
  }

  // 2. Fetch Room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      room_type:room_types(name)
    `)
    .eq('id', roomId)
    .eq('property_id', propertyId)
    .single()

  if (roomError || !room) {
    return {
      isValid: false,
      property: {
        id: property.id,
        name: property.name,
        currency: property.currency || 'INR',
      },
      room: { id: roomId, room_number: 'N/A', room_type_name: 'Room' },
      errorMessage: 'Room not found or no longer active in this hotel.',
    }
  }

  // 3. Verify QR code token
  if (token) {
    const { data: qr } = await supabase
      .from('room_qr_codes')
      .select('id, is_active, scan_count')
      .eq('room_id', roomId)
      .eq('token_hash', token)
      .maybeSingle()

    if (qr) {
      if (!qr.is_active) {
        return {
          isValid: false,
          property,
          room: {
            id: room.id,
            room_number: room.room_number,
            room_type_name: (room.room_type as any)?.name || 'Room',
          },
          errorMessage: 'This room QR code has been revoked. Please ask the front desk for an updated QR code.',
        }
      }

      // Record scan asynchronously
      await supabase
        .from('room_qr_codes')
        .update({
          scan_count: (qr.scan_count || 0) + 1,
          last_scanned_at: new Date().toISOString(),
        })
        .eq('id', qr.id)
    }
  }

  // 4. Check for active checked-in guest
  let guestName: string | undefined
  let checkInDate: string | undefined
  let checkOutDate: string | undefined

  try {
    const { data: activeRes } = await supabase
      .from('reservation_rooms')
      .select(`
        reservation:reservations(
          id,
          status,
          check_in_date,
          check_out_date,
          guest:guests(first_name, last_name)
        )
      `)
      .eq('room_id', roomId)
      .limit(1)

    if (activeRes && activeRes.length > 0) {
      const res = activeRes[0]?.reservation as any
      if (res && res.status === 'checked_in') {
        const g = res.guest
        if (g) {
          guestName = `${g.first_name || ''} ${g.last_name || ''}`.trim()
        }
        checkInDate = res.check_in_date
        checkOutDate = res.check_out_date
      }
    }
  } catch {}

  return {
    isValid: true,
    property: {
      id: property.id,
      name: property.name,
      logo_url: property.logo_url,
      phone: property.phone,
      email: property.email,
      address: property.address,
      city: property.city,
      currency: property.currency || 'INR',
    },
    room: {
      id: room.id,
      room_number: room.room_number,
      room_type_name: (room.room_type as any)?.name || 'Standard Room',
    },
    guestName,
    checkInDate,
    checkOutDate,
  }
}

/**
 * Fetch guest service categories & items (Food, Housekeeping, Maintenance)
 * Specifically configured for Room QR scanning
 */
export async function getGuestServiceCatalog(propertyId: string): Promise<GuestServiceCategoryWithItems[]> {
  const supabase = await createClient()

  // 1. Fetch live food menu items from the Restaurant section
  let dbFoodItems: any[] = []
  try {
    const { data: items } = await supabase
      .from('guest_service_items')
      .select(`
        id,
        name,
        description,
        price,
        tax_rate_percentage,
        dietary_type,
        is_veg,
        is_available,
        preparation_time_mins,
        image_url,
        display_order,
        guest_service_categories!inner (
          id,
          property_id,
          name
        )
      `)
      .eq('guest_service_categories.property_id', propertyId)
      .eq('is_available', true)
      .order('name', { ascending: true })

    if (items && items.length > 0) {
      dbFoodItems = items.map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description || (i.guest_service_categories?.name ? `From ${i.guest_service_categories.name} menu` : 'Freshly prepared specialty dish'),
        price: parseFloat(i.price) || 0,
        tax_rate_percentage: parseFloat(i.tax_rate_percentage) || 5,
        dietary_type: i.is_veg !== undefined ? (i.is_veg ? 'veg' : 'non-veg') : (i.dietary_type || 'veg'),
        is_available: true,
        preparation_time_mins: i.preparation_time_mins || 20,
        image_url: i.image_url || '',
      }))
    }
  } catch (e) {
    console.error('getGuestServiceCatalog food items error:', e)
  }

  const defaultFoodItems = [
    {
      id: 'item-fnb-1',
      name: 'Classic Club Sandwich with Golden Fries',
      description: 'Triple-decker sandwich with toasted bread, cheddar cheese, crisp lettuce, tomato and golden fries.',
      price: 280,
      tax_rate_percentage: 5,
      dietary_type: 'veg',
      is_available: true,
      preparation_time_mins: 15,
    },
    {
      id: 'item-fnb-2',
      name: 'Paneer Butter Masala with 2 Butter Naan',
      description: 'Cottage cheese simmered in a rich tomato, butter, and cashew gravy served with clay-oven naan.',
      price: 360,
      tax_rate_percentage: 5,
      dietary_type: 'veg',
      is_available: true,
      preparation_time_mins: 25,
    },
    {
      id: 'item-fnb-3',
      name: 'Hyderabadi Chicken Dum Biryani',
      description: 'Fragrant basmati rice layered with spiced chicken, mint, saffron and served with mirchi ka salan & raita.',
      price: 420,
      tax_rate_percentage: 5,
      dietary_type: 'non-veg',
      is_available: true,
      preparation_time_mins: 25,
    },
    {
      id: 'item-fnb-4',
      name: 'Margherita Pizza (10-inch)',
      description: 'Hand-stretched sourdough crust with San Marzano tomato sauce, fresh mozzarella, and aromatic basil.',
      price: 390,
      tax_rate_percentage: 5,
      dietary_type: 'veg',
      is_available: true,
      preparation_time_mins: 20,
    },
    {
      id: 'item-fnb-5',
      name: 'Fresh Cold Pressed Watermelon Juice',
      description: 'Pure 100% freshly pressed watermelon with a hint of mint and black salt.',
      price: 140,
      tax_rate_percentage: 5,
      dietary_type: 'beverage',
      is_available: true,
      preparation_time_mins: 10,
    },
    {
      id: 'item-fnb-6',
      name: 'Filter Coffee / Masala Chai Flask (Serves 2)',
      description: 'Freshly brewed aromatic South Indian filter coffee or spiced ginger-cardamom tea.',
      price: 120,
      tax_rate_percentage: 5,
      dietary_type: 'beverage',
      is_available: true,
      preparation_time_mins: 10,
    },
  ]

  const foodItems = dbFoodItems.length > 0 ? dbFoodItems : defaultFoodItems

  // 2. Fetch live Housekeeping Types created for this property
  let dbHkItems: any[] = []
  try {
    const { data: hkTypes } = await supabase
      .from('housekeeping_types')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (hkTypes && hkTypes.length > 0) {
      dbHkItems = hkTypes.map((h: any) => ({
        id: `type-hk-${h.id}`,
        name: h.name,
        description: h.description || 'Standard room turnover service and replenishment',
        price: 0,
        tax_rate_percentage: 0,
        dietary_type: 'general',
        is_available: true,
        preparation_time_mins: h.estimated_minutes || 30,
      }))
    }
  } catch (hkErr) {
    console.error('getGuestServiceCatalog hkTypes error:', hkErr)
  }

  const defaultHkItems = [
    {
      id: 'item-hk-1',
      name: 'Full Room Cleaning & Dusting',
      description: 'Complete floor vacuuming/mopping, surface sanitization, and dust-free turnover.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 30,
    },
    {
      id: 'item-hk-2',
      name: 'Fresh Bed Linen & Pillow Covers',
      description: 'Replacement with fresh, sanitized 400-thread count cotton sheets and duvet.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 15,
    },
    {
      id: 'item-hk-3',
      name: 'Fresh Bath & Hand Towels Set',
      description: 'Set of two large plush bath towels, two hand towels, and a bath mat.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 10,
    },
    {
      id: 'item-hk-4',
      name: 'Trash Removal & Room Dusting',
      description: 'Clear bins, sanitize high-touch handles, and quick room refreshment.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 10,
    },
    {
      id: 'item-hk-5',
      name: 'Complimentary Drinking Water & Tea Kit Refill',
      description: 'Two 1-liter sealed mineral water bottles with tea bags, coffee sachets, and dairy creamer.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 10,
    },
  ]

  const housekeepingItems = dbHkItems.length > 0 ? dbHkItems : defaultHkItems

  // 3. Fetch live Maintenance Types created for this property
  let dbMtItems: any[] = []
  try {
    const { data: mtTypes } = await supabase
      .from('maintenance_types')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (mtTypes && mtTypes.length > 0) {
      dbMtItems = mtTypes.map((m: any) => ({
        id: `type-mt-${m.id}`,
        name: m.name,
        description: m.description || `In-room technical inspection (${m.category || 'General'})`,
        price: 0,
        tax_rate_percentage: 0,
        dietary_type: 'general',
        is_available: true,
        preparation_time_mins: m.estimated_minutes || 30,
      }))
    }
  } catch (mtErr) {
    console.error('getGuestServiceCatalog mtTypes error:', mtErr)
  }

  const defaultMtItems = [
    {
      id: 'item-mt-1',
      name: 'Air Conditioner Temperature / Cooling Issue',
      description: 'Technician will visit your room immediately to inspect AC filters and remote thermostat.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 15,
    },
    {
      id: 'item-mt-2',
      name: 'High-Speed WiFi / Internet Connectivity Help',
      description: 'Assistance reconnecting your laptop or smartphone to hotel high-speed network.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 15,
    },
    {
      id: 'item-mt-3',
      name: 'Bathroom Plumbing or Hot Water Check',
      description: 'Inspection of shower pressure, water heater geyser, or faucet drainage.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 15,
    },
    {
      id: 'item-mt-4',
      name: 'Television / Cable / Remote Issue',
      description: 'Assistance with TV channels, HDMI connection, or remote battery replacement.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 15,
    },
    {
      id: 'item-mt-5',
      name: 'Electrical Light / Power Socket Issue',
      description: 'Electrician check for room bedside switches, power outlets, or lighting fixtures.',
      price: 0,
      tax_rate_percentage: 0,
      dietary_type: 'general',
      is_available: true,
      preparation_time_mins: 15,
    },
  ]

  const maintenanceItems = dbMtItems.length > 0 ? dbMtItems : defaultMtItems

  return [
    {
      id: 'cat-fnb',
      name: 'Food & In-Room Dining',
      slug: 'food-beverage',
      icon: 'Utensils',
      description: 'Specialty dishes, snacks, hot mains and beverages delivered directly to your room',
      display_order: 1,
      items: foodItems,
    },
    {
      id: 'cat-hk',
      name: 'Housekeeping Services',
      slug: 'housekeeping',
      icon: 'Sparkles',
      description: 'Room cleaning, fresh bed linens, bath towels and room replenishment',
      display_order: 2,
      items: housekeepingItems,
    },
    {
      id: 'cat-maint',
      name: 'Maintenance & Repairs',
      slug: 'maintenance',
      icon: 'Wrench',
      description: 'Prompt technician visit for AC cooling, geyser/hot water, TV, electrical or plumbing',
      display_order: 3,
      items: maintenanceItems,
    },
  ]
}

/**
 * Submit Guest Food & Beverage Order
 */
export async function submitGuestOrder(payload: {
  property_id: string
  room_id: string
  guest_name: string
  guest_phone?: string
  payment_method?: string
  special_instructions?: string
  items: Array<{
    item_id?: string
    item_name: string
    quantity: number
    unit_price: number
    dietary_type?: string
    special_requests?: string
  }>
}): Promise<{ success: boolean; order?: any; tracking_token?: string; error?: string }> {
  try {
    const supabase = await createClient()

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Your cart is empty. Please add items before placing order.' }
    }

    const subtotal = payload.items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0)
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100
    const totalAmount = subtotal + taxAmount

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    const trackingToken = crypto.randomBytes(16).toString('hex')

    // Insert guest order
    const { data: order, error: orderError } = await supabase
      .from('guest_orders')
      .insert({
        property_id: payload.property_id,
        room_id: payload.room_id,
        guest_name: payload.guest_name.trim() || 'Guest',
        guest_phone: payload.guest_phone || '',
        order_number: orderNumber,
        tracking_token: trackingToken,
        status: 'placed',
        payment_method: payload.payment_method || 'pay_at_checkout',
        payment_status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        special_instructions: payload.special_instructions || '',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItemsPayload = payload.items.map((it) => ({
      order_id: order.id,
      item_name: it.item_name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.unit_price * it.quantity,
      dietary_type: it.dietary_type || 'veg',
      special_requests: it.special_requests || '',
    }))

    await supabase.from('guest_order_items').insert(orderItemsPayload)

    // Automatically route order to Restaurant section (restaurant_orders) for kitchen fulfillment
    try {
      const { data: restOrder } = await supabase
        .from('restaurant_orders')
        .insert({
          property_id: payload.property_id,
          room_id: payload.room_id,
          order_number: orderNumber,
          order_type: 'room_delivery',
          guest_name: payload.guest_name.trim() || 'Guest',
          status: 'placed',
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_status: 'unpaid',
          payment_method: payload.payment_method || 'pay_at_checkout',
          notes: `In-Room Dining QR Order. Special instructions: ${payload.special_instructions || 'None'}`,
        })
        .select('id')
        .maybeSingle()

      if (restOrder?.id) {
        const restOrderItems = payload.items.map((it) => ({
          order_id: restOrder.id,
          item_name: it.item_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total_price: Number((it.unit_price * it.quantity).toFixed(2)),
          notes: it.special_requests || null,
        }))
        await supabase.from('restaurant_order_items').insert(restOrderItems)
      }
      revalidatePath('/restaurant')
      revalidatePath('/restaurant/reports')
    } catch (restErr) {
      console.error('Restaurant order dispatch error:', restErr)
    }

    return {
      success: true,
      order: {
        ...order,
        items: payload.items,
      },
      tracking_token: trackingToken,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Submit Guest Service Request (Housekeeping, Maintenance)
 * Automatically routes request to respective modules:
 * - Housekeeping -> housekeeping_tasks
 * - Maintenance  -> maintenance_requests
 */
export async function submitGuestServiceRequest(payload: {
  property_id: string
  room_id: string
  guest_name?: string
  guest_phone?: string
  category_slug: string
  request_type: string
  description: string
  priority?: string
  guest_notes?: string
  attachment_url?: string
}): Promise<{ success: boolean; tracking_token?: string; request_id?: string; error?: string }> {
  try {
    const adminClient = createAdminClient()

    const trackingToken = crypto.randomBytes(16).toString('hex')

    // 1. Insert into guest_service_requests
    let reqId = crypto.randomUUID()
    try {
      const { data: req, error } = await adminClient
        .from('guest_service_requests')
        .insert({
          id: reqId,
          property_id: payload.property_id,
          room_id: payload.room_id,
          guest_name: payload.guest_name || 'Guest',
          guest_phone: payload.guest_phone || '',
          tracking_token: trackingToken,
          category_slug: payload.category_slug,
          request_type: payload.request_type,
          status: 'pending',
          priority: payload.priority || 'medium',
          description: payload.description,
          guest_notes: payload.guest_notes || '',
          attachment_url: payload.attachment_url || null,
        })
        .select()
        .single()

      if (req?.id) reqId = req.id
      if (error) console.error('Error inserting into guest_service_requests:', error)

      // Create initial timeline entry
      await adminClient.from('guest_service_request_updates').insert({
        request_id: reqId,
        status: 'pending',
        message: 'Request submitted and queued for staff.',
        updated_by: 'Guest QR Portal',
      })
    } catch (gErr) {
      console.error('guest_service_requests insert error:', gErr)
    }

    // 2. If Housekeeping request, create a real housekeeping task in /housekeeping
    if (payload.category_slug === 'housekeeping') {
      try {
        const guestInfo = payload.guest_name ? `Guest: ${payload.guest_name}${payload.guest_phone ? ` (${payload.guest_phone})` : ''}` : 'Guest'
        const fullNotes = [
          `[Room QR Request - ${guestInfo}]`,
          payload.request_type ? `Service: ${payload.request_type}` : '',
          payload.description && payload.description !== payload.request_type ? `Details: ${payload.description}` : '',
          payload.guest_notes ? `Guest Instructions: ${payload.guest_notes}` : '',
          payload.attachment_url ? `Attachment: ${payload.attachment_url}` : '',
        ].filter(Boolean).join('\n')

        const { error: hkErr } = await adminClient.from('housekeeping_tasks').insert({
          property_id: payload.property_id,
          room_id: payload.room_id,
          task_type: payload.request_type || 'Guest Room Cleaning',
          priority: payload.priority || 'medium',
          status: 'pending',
          notes: fullNotes,
        })
        if (hkErr) console.error('housekeeping_tasks insert error:', hkErr)

        // Set room status to dirty
        await adminClient.from('rooms').update({ status: 'dirty' }).eq('id', payload.room_id)
        revalidatePath('/housekeeping')
        revalidatePath('/rooms')
        revalidatePath('/dashboard')
      } catch (hkErr) {
        console.error('Failed to route housekeeping task:', hkErr)
      }
    }

    // 3. If Maintenance request, create a real maintenance ticket in /maintenance
    if (payload.category_slug === 'maintenance') {
      try {
        const guestInfo = payload.guest_name ? `Guest: ${payload.guest_name}${payload.guest_phone ? ` (${payload.guest_phone})` : ''}` : 'Guest'
        const fullDesc = [
          `Issue: ${payload.request_type}`,
          payload.description && payload.description !== payload.request_type ? `Details: ${payload.description}` : '',
          payload.guest_notes ? `Guest Notes: ${payload.guest_notes}` : '',
          payload.attachment_url ? `Attachment: ${payload.attachment_url}` : '',
          `Reported by: ${guestInfo} via Room QR`,
        ].filter(Boolean).join('\n')

        // Find a valid user_id to satisfy reported_by if the schema has a NOT NULL constraint
        let reportedBy: string | null = null
        try {
          const { data: pUser } = await adminClient
            .from('property_users')
            .select('user_id')
            .eq('property_id', payload.property_id)
            .limit(1)
            .maybeSingle()
          if (pUser?.user_id) reportedBy = pUser.user_id
        } catch {}

        if (!reportedBy) {
          try {
            const { data: uList } = await adminClient.auth.admin.listUsers({ perPage: 1 })
            if (uList?.users?.[0]?.id) reportedBy = uList.users[0].id
          } catch {}
        }

        const mtPayload: any = {
          property_id: payload.property_id,
          room_id: payload.room_id,
          title: payload.request_type || 'Room Maintenance Issue',
          description: fullDesc,
          category: 'Guest Room',
          priority: payload.priority || 'medium',
          status: 'open',
          attachment_url: payload.attachment_url || null,
        }
        if (reportedBy) {
          mtPayload.reported_by = reportedBy
        }

        const { error: mtErr } = await adminClient.from('maintenance_requests').insert(mtPayload)
        if (mtErr) {
          console.error('Failed to insert maintenance_requests:', mtErr)
          // If error was related to reported_by, retry without it or with fallback
          if (!reportedBy) {
            await adminClient.from('maintenance_requests').insert({
              ...mtPayload,
              reported_by: null,
            })
          }
        }

        // If priority is urgent, mark room status
        if (payload.priority === 'urgent' || payload.priority === 'high') {
          await adminClient.from('rooms').update({ status: 'maintenance' }).eq('id', payload.room_id)
        }

        revalidatePath('/maintenance')
        revalidatePath('/rooms')
        revalidatePath('/dashboard')
      } catch (mtErr) {
        console.error('Failed to route maintenance ticket:', mtErr)
      }
    }

    // 4. Dispatch automated notifications (Mail, WhatsApp, SMS)
    try {
      let roomNumber = ''
      const { data: roomData } = await adminClient
        .from('rooms')
        .select('room_number')
        .eq('id', payload.room_id)
        .maybeSingle()

      if (roomData?.room_number) roomNumber = roomData.room_number

      if (payload.category_slug === 'housekeeping' || payload.category_slug === 'maintenance') {
        await dispatchGuestRequestNotifications({
          propertyId: payload.property_id,
          category: payload.category_slug as 'housekeeping' | 'maintenance',
          roomNumber,
          requestType: payload.request_type,
          guestName: payload.guest_name,
          guestPhone: payload.guest_phone,
          notes: payload.guest_notes,
          priority: payload.priority,
          attachmentUrl: payload.attachment_url,
          trackingToken,
        })
      }
    } catch (notifErr) {
      console.error('Notification dispatch error:', notifErr)
    }

    return {
      success: true,
      tracking_token: trackingToken,
      request_id: reqId,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Fetch live status of a service request by tracking token
 */
export async function getGuestRequestStatus(trackingToken: string) {
  const supabase = await createClient()

  const { data: req, error } = await supabase
    .from('guest_service_requests')
    .select(`
      *,
      room:rooms(room_number),
      property:properties(name, phone),
      updates:guest_service_request_updates(*)
    `)
    .eq('tracking_token', trackingToken)
    .single()

  if (error || !req) return null

  const updates = (req.updates || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return {
    id: req.id,
    room_number: req.room?.room_number || 'Room',
    hotel_name: req.property?.name || 'Hotel',
    hotel_phone: req.property?.phone || '',
    category: req.category_slug,
    request_type: req.request_type,
    description: req.description,
    status: req.status,
    priority: req.priority,
    created_at: req.created_at,
    completed_at: req.completed_at,
    updates: updates.map((u: any) => ({
      id: u.id,
      status: u.status,
      message: u.message,
      updated_by: u.updated_by,
      created_at: u.created_at,
    })),
  }
}

/**
 * Fetch live status of a food order by tracking token
 */
export async function getGuestOrderStatus(trackingToken: string) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('guest_orders')
    .select(`
      *,
      room:rooms(room_number),
      property:properties(name, phone, currency),
      items:guest_order_items(*)
    `)
    .eq('tracking_token', trackingToken)
    .single()

  if (error || !order) return null

  return {
    id: order.id,
    order_number: order.order_number,
    room_number: order.room?.room_number || 'Room',
    hotel_name: order.property?.name || 'Hotel',
    hotel_phone: order.property?.phone || '',
    currency: order.property?.currency || 'INR',
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    subtotal: parseFloat(order.subtotal) || 0,
    tax_amount: parseFloat(order.tax_amount) || 0,
    total_amount: parseFloat(order.total_amount) || 0,
    special_instructions: order.special_instructions,
    created_at: order.created_at,
    items: (order.items || []).map((it: any) => ({
      id: it.id,
      name: it.item_name,
      quantity: it.quantity,
      unit_price: parseFloat(it.unit_price) || 0,
      total_price: parseFloat(it.total_price) || 0,
      dietary_type: it.dietary_type,
    })),
  }
}
