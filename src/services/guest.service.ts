'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

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
 * Fetch guest service categories & items (Menu, Amenities, Services)
 */
export async function getGuestServiceCatalog(propertyId: string): Promise<GuestServiceCategoryWithItems[]> {
  const supabase = await createClient()

  // 1. Fetch categories
  const { data: categories, error } = await supabase
    .from('guest_service_categories')
    .select(`
      id,
      name,
      slug,
      icon,
      description,
      display_order,
      items:guest_service_items(
        id,
        name,
        description,
        price,
        tax_rate_percentage,
        dietary_type,
        is_available,
        preparation_time_mins,
        image_url,
        display_order
      )
    `)
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // If database has categories with items, return them
  if (!error && categories && categories.length > 0 && categories.some((c: any) => c.items?.length > 0)) {
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || 'Utensils',
      description: cat.description || '',
      display_order: cat.display_order,
      items: (cat.items || [])
        .filter((i: any) => i.is_available)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((i: any) => ({
          id: i.id,
          name: i.name,
          description: i.description || '',
          price: parseFloat(i.price) || 0,
          tax_rate_percentage: parseFloat(i.tax_rate_percentage) || 5,
          dietary_type: i.dietary_type || 'veg',
          is_available: i.is_available,
          preparation_time_mins: i.preparation_time_mins || 20,
          image_url: i.image_url || '',
        })),
    }))
  }

  // Built-in standard hotel guest service catalog
  return [
    {
      id: 'cat-fnb',
      name: 'Food & Beverage',
      slug: 'food-beverage',
      icon: 'Utensils',
      description: 'Chef specials, snacks, hot mains and refreshing beverages',
      display_order: 1,
      items: [
        {
          id: 'item-fnb-1',
          name: 'Classic Club Sandwich',
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
      ],
    },
    {
      id: 'cat-hk',
      name: 'Housekeeping Services',
      slug: 'housekeeping',
      icon: 'Sparkles',
      description: 'Quick room turnover, fresh linens, bathroom refresh and dusting',
      display_order: 2,
      items: [
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
      ],
    },
    {
      id: 'cat-amenities',
      name: 'Extra Amenities',
      slug: 'amenities',
      icon: 'Package',
      description: 'Toiletries, dental kit, shaving kit, extra pillows and slippers',
      display_order: 3,
      items: [
        {
          id: 'item-am-1',
          name: 'Dental Care & Shaving Kit',
          description: 'Bamboo toothbrush with herbal paste, and dual-blade razor with shaving cream.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 10,
        },
        {
          id: 'item-am-2',
          name: 'Complimentary Packaged Drinking Water (2 Bottles)',
          description: 'Two 1-liter sealed mineral water bottles delivered to your room.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'beverage',
          is_available: true,
          preparation_time_mins: 10,
        },
        {
          id: 'item-am-3',
          name: 'Soft Plush Bedroom Slippers',
          description: 'Disposable hygienic padded bedroom slippers.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 10,
        },
        {
          id: 'item-am-4',
          name: 'Extra Feather/Memory Foam Pillow',
          description: 'Hypoallergenic orthopedic or ultra-soft feather pillow.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 15,
        },
      ],
    },
    {
      id: 'cat-laundry',
      name: 'Laundry & Ironing',
      slug: 'laundry',
      icon: 'Shirt',
      description: 'Express ironing, dry cleaning, and wash & fold delivery',
      display_order: 4,
      items: [
        {
          id: 'item-ld-1',
          name: 'Steam Ironing (Per Garment)',
          description: 'Wrinkle-free steam pressing on shirt, trouser, saree, or suit.',
          price: 60,
          tax_rate_percentage: 18,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 45,
        },
        {
          id: 'item-ld-2',
          name: 'Wash & Fold Laundry Bag (Up to 5kg)',
          description: 'Complete detergent wash, tumble dry, and neat fold delivered within 8 hours.',
          price: 350,
          tax_rate_percentage: 18,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 240,
        },
      ],
    },
    {
      id: 'cat-maint',
      name: 'Maintenance & Repairs',
      slug: 'maintenance',
      icon: 'Wrench',
      description: 'Urgent assistance for AC, geyser/hot water, TV, electrical or plumbing',
      display_order: 5,
      items: [
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
      ],
    },
    {
      id: 'cat-transport',
      name: 'Transportation & Taxi',
      slug: 'transportation',
      icon: 'Car',
      description: 'Airport drop/pickup, city sightseeing taxi, and private chauffeur',
      display_order: 6,
      items: [
        {
          id: 'item-tr-1',
          name: 'Airport / Railway Station Transfer Booking',
          description: 'Sedan or SUV with courteous verified driver arranged at your preferred departure time.',
          price: 900,
          tax_rate_percentage: 5,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 30,
        },
      ],
    },
    {
      id: 'cat-frontdesk',
      name: 'Front Desk & Concierge',
      slug: 'concierge',
      icon: 'Bell',
      description: 'Wake-up call, luggage assistance, bill summary and express checkout',
      display_order: 7,
      items: [
        {
          id: 'item-fd-1',
          name: 'Morning Wake-Up Call Request',
          description: 'Front desk automated operator call at your requested time.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 5,
        },
        {
          id: 'item-fd-2',
          name: 'Bellboy Luggage Pickup for Checkout',
          description: 'Staff assistance to collect your bags from room and transfer to lobby.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 10,
        },
      ],
    },
    {
      id: 'cat-feedback',
      name: 'Feedback & Complaints',
      slug: 'feedback',
      icon: 'MessageSquare',
      description: 'Direct channel to Duty Manager for immediate service rectification',
      display_order: 8,
      items: [
        {
          id: 'item-fb-1',
          name: 'Direct Message to General Manager / Duty Manager',
          description: 'Share feedback or any dissatisfaction for prompt personal resolution.',
          price: 0,
          tax_rate_percentage: 0,
          dietary_type: 'general',
          is_available: true,
          preparation_time_mins: 10,
        },
      ],
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
 * Submit Guest Service Request (Housekeeping, Amenities, Maintenance, etc.)
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
}): Promise<{ success: boolean; tracking_token?: string; request_id?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const trackingToken = crypto.randomBytes(16).toString('hex')

    const { data: req, error } = await supabase
      .from('guest_service_requests')
      .insert({
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
      })
      .select()
      .single()

    if (error) throw error

    // Create initial timeline entry
    await supabase.from('guest_service_request_updates').insert({
      request_id: req.id,
      status: 'pending',
      message: 'Request submitted and queued for staff.',
      updated_by: 'System',
    })

    return {
      success: true,
      tracking_token: trackingToken,
      request_id: req.id,
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
