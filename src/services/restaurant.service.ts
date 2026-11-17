'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface TableRecord {
  id: string
  propertyId: string
  tableNumber: string
  capacity: number
  section: string
  status: 'available' | 'occupied' | 'reserved' | 'billing'
  currentOrderId?: string | null
  createdAt: string
}

export interface MenuItemRecord {
  id: string
  categoryId: string
  categoryName?: string
  name: string
  price: number
  description?: string
  isVeg: boolean
  isAvailable: boolean
  imageUrl?: string
  createdAt: string
}

export interface MenuCategoryRecord {
  id: string
  propertyId: string
  name: string
  type: string
  itemCount?: number
}

export interface OrderItemRecord {
  id: string
  orderId: string
  serviceItemId?: string | null
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string | null
}

export interface RestaurantOrderRecord {
  id: string
  propertyId: string
  tableId?: string | null
  tableNumber?: string
  roomId?: string | null
  roomNumber?: string
  guestId?: string | null
  guestName?: string
  orderType: 'dine_in' | 'takeaway' | 'room_delivery'
  status: 'placed' | 'confirmed' | 'kitchen_prep' | 'served' | 'settled' | 'cancelled'
  subtotal: number
  taxAmount: number
  totalAmount: number
  paymentStatus: 'unpaid' | 'paid' | 'billed_to_room'
  notes?: string | null
  createdAt: string
  items: OrderItemRecord[]
}

/**
 * Fetch all tables for a property
 */
export async function getRestaurantTables(propertyId: string): Promise<TableRecord[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('property_id', propertyId)
      .order('table_number', { ascending: true })

    if (error || !data) return []

    return data.map((t: any) => ({
      id: t.id,
      propertyId: t.property_id,
      tableNumber: t.table_number,
      capacity: Number(t.capacity || 4),
      section: t.section || 'Main Dining',
      status: t.status || 'available',
      currentOrderId: t.current_order_id,
      createdAt: t.created_at,
    }))
  } catch (err) {
    console.error('getRestaurantTables error:', err)
    return []
  }
}

/**
 * Create a new table
 */
export async function createRestaurantTable(data: {
  propertyId: string
  tableNumber: string
  capacity: number
  section?: string
}): Promise<{ success: boolean; tableId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: table, error } = await supabase
      .from('restaurant_tables')
      .insert({
        property_id: data.propertyId,
        table_number: data.tableNumber,
        capacity: data.capacity,
        section: data.section || 'Main Dining',
        status: 'available',
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant')
    revalidatePath('/restaurant/tables')
    return { success: true, tableId: table?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create table' }
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(
  tableId: string,
  status: 'available' | 'occupied' | 'reserved' | 'billing'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('restaurant_tables')
      .update({ status })
      .eq('id', tableId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant')
    revalidatePath('/restaurant/tables')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update table status' }
  }
}

/**
 * Delete a table
 */
export async function deleteRestaurantTable(tableId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('restaurant_tables').delete().eq('id', tableId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant/tables')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete table' }
  }
}

/**
 * Fetch menu categories
 */
export async function getMenuCategories(propertyId: string): Promise<MenuCategoryRecord[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('guest_service_categories')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !data) return []

    return data.map((c: any) => ({
      id: c.id,
      propertyId: c.property_id,
      name: c.name,
      type: c.type || 'food_beverage',
    }))
  } catch (err) {
    console.error('getMenuCategories error:', err)
    return []
  }
}

/**
 * Create a new menu category
 */
export async function createMenuCategory(data: {
  propertyId: string
  name: string
  type?: string
}): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: cat, error } = await supabase
      .from('guest_service_categories')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        type: data.type || 'food_beverage',
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant/menu')
    return { success: true, categoryId: cat?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create category' }
  }
}

/**
 * Fetch menu items
 */
export async function getMenuItems(propertyId: string, categoryId?: string): Promise<MenuItemRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('guest_service_items')
      .select(`
        id,
        category_id,
        name,
        price,
        description,
        is_veg,
        is_available,
        created_at,
        guest_service_categories!inner (
          id,
          property_id,
          name
        )
      `)
      .eq('guest_service_categories.property_id', propertyId)
      .order('name', { ascending: true })

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((item: any) => ({
      id: item.id,
      categoryId: item.category_id,
      categoryName: item.guest_service_categories?.name,
      name: item.name,
      price: Number(item.price || 0),
      description: item.description,
      isVeg: Boolean(item.is_veg),
      isAvailable: Boolean(item.is_available),
      createdAt: item.created_at,
    }))
  } catch (err) {
    console.error('getMenuItems error:', err)
    return []
  }
}

/**
 * Create a menu item
 */
export async function createMenuItem(data: {
  categoryId: string
  name: string
  price: number
  description?: string
  isVeg: boolean
  isAvailable: boolean
}): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: item, error } = await supabase
      .from('guest_service_items')
      .insert({
        category_id: data.categoryId,
        name: data.name,
        price: data.price,
        description: data.description || null,
        is_veg: data.isVeg,
        is_available: data.isAvailable,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant/menu')
    return { success: true, itemId: item?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create menu item' }
  }
}

/**
 * Toggle menu item availability
 */
export async function toggleMenuItemAvailability(
  itemId: string,
  isAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('guest_service_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant/menu')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle availability' }
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('guest_service_items').delete().eq('id', itemId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant/menu')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete menu item' }
  }
}

/**
 * Fetch restaurant orders
 */
export async function getRestaurantOrders(
  propertyId: string,
  status?: string
): Promise<RestaurantOrderRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('restaurant_orders')
      .select(`
        id,
        property_id,
        table_id,
        room_id,
        guest_id,
        order_type,
        status,
        subtotal,
        tax_amount,
        total_amount,
        payment_status,
        notes,
        created_at,
        restaurant_tables (
          table_number
        ),
        rooms (
          room_number
        ),
        guests (
          first_name,
          last_name
        ),
        restaurant_order_items (
          id,
          order_id,
          service_item_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          notes
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((o: any) => {
      const g = o.guests
      const guestName = g ? `${g.first_name} ${g.last_name}`.trim() : 'Dine-in Guest'
      const tableNumber = o.restaurant_tables?.table_number
      const roomNumber = o.rooms?.room_number

      const items: OrderItemRecord[] = (o.restaurant_order_items || []).map((i: any) => ({
        id: i.id,
        orderId: i.order_id,
        serviceItemId: i.service_item_id,
        itemName: i.item_name,
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unit_price || 0),
        totalPrice: Number(i.total_price || 0),
        notes: i.notes,
      }))

      return {
        id: o.id,
        propertyId: o.property_id,
        tableId: o.table_id,
        tableNumber,
        roomId: o.room_id,
        roomNumber,
        guestId: o.guest_id,
        guestName,
        orderType: o.order_type,
        status: o.status,
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.tax_amount || 0),
        totalAmount: Number(o.total_amount || 0),
        paymentStatus: o.payment_status,
        notes: o.notes,
        createdAt: o.created_at,
        items,
      }
    })
  } catch (err) {
    console.error('getRestaurantOrders error:', err)
    return []
  }
}

/**
 * Create a new restaurant POS order with items
 */
export async function createRestaurantOrder(data: {
  propertyId: string
  tableId?: string
  roomId?: string
  guestId?: string
  orderType: 'dine_in' | 'takeaway' | 'room_delivery'
  items: Array<{
    itemId?: string
    name: string
    quantity: number
    unitPrice: number
    notes?: string
  }>
  notes?: string
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    if (data.items.length === 0) {
      return { success: false, error: 'At least one item is required' }
    }

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    // 5% GST on Restaurant F&B
    const taxAmount = Number((subtotal * 0.05).toFixed(2))
    const totalAmount = Number((subtotal + taxAmount).toFixed(2))

    // 1. Insert order
    const { data: order, error: orderErr } = await supabase
      .from('restaurant_orders')
      .insert({
        property_id: data.propertyId,
        table_id: data.tableId || null,
        room_id: data.roomId || null,
        guest_id: data.guestId || null,
        order_type: data.orderType,
        status: 'placed',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'unpaid',
        notes: data.notes || null,
      })
      .select('id')
      .single()

    if (orderErr) return { success: false, error: orderErr.message }

    // 2. Insert items
    const orderItems = data.items.map((i) => ({
      order_id: order.id,
      service_item_id: i.itemId || null,
      item_name: i.name,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: Number((i.quantity * i.unitPrice).toFixed(2)),
      notes: i.notes || null,
    }))

    await supabase.from('restaurant_order_items').insert(orderItems)

    // 3. If table attached, update table status to occupied
    if (data.tableId) {
      await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied', current_order_id: order.id })
        .eq('id', data.tableId)
    }

    revalidatePath('/restaurant')
    return { success: true, orderId: order.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create POS order' }
  }
}

/**
 * Update order status (placed -> kitchen_prep -> served -> settled)
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'placed' | 'confirmed' | 'kitchen_prep' | 'served' | 'settled' | 'cancelled'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('restaurant_orders')
      .update({ status })
      .eq('id', orderId)
      .select('table_id')
      .single()

    if (error) return { success: false, error: error.message }

    // If settled or cancelled, free table
    if (status === 'settled' || status === 'cancelled') {
      if (order?.table_id) {
        await supabase
          .from('restaurant_tables')
          .update({ status: 'available', current_order_id: null })
          .eq('id', order.table_id)
      }
    }

    revalidatePath('/restaurant')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update order status' }
  }
}

/**
 * Settle restaurant order (Cash/Card or transfer to room folio)
 */
export async function settleRestaurantOrder(
  orderId: string,
  paymentMethod: string,
  transferToRoomFolio?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('restaurant_orders')
      .select('*, restaurant_tables(table_number)')
      .eq('id', orderId)
      .single()

    if (error || !order) return { success: false, error: 'Order not found' }

    if (transferToRoomFolio && order.room_id) {
      // Find open folio for room
      const { data: resRoom } = await supabase
        .from('reservation_rooms')
        .select('reservation_id')
        .eq('room_id', order.room_id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (resRoom?.reservation_id) {
        const { data: folio } = await supabase
          .from('guest_folios')
          .select('id, total_charges')
          .eq('reservation_id', resRoom.reservation_id)
          .eq('status', 'open')
          .limit(1)
          .single()

        if (folio) {
          // Post item to folio
          await supabase.from('folio_items').insert({
            folio_id: folio.id,
            description: `Restaurant Order #${order.id.slice(0, 6).toUpperCase()} (${order.restaurant_tables?.table_number || 'Room Service'})`,
            item_type: 'f_and_b',
            quantity: 1,
            unit_price: order.total_amount,
            total_price: order.total_amount,
            item_date: new Date().toISOString().split('T')[0],
          })

          const newTotal = Number(folio.total_charges || 0) + Number(order.total_amount)
          await supabase
            .from('guest_folios')
            .update({ total_charges: newTotal, updated_at: new Date().toISOString() })
            .eq('id', folio.id)
        }
      }

      await supabase
        .from('restaurant_orders')
        .update({ status: 'settled', payment_status: 'billed_to_room' })
        .eq('id', orderId)
    } else {
      await supabase
        .from('restaurant_orders')
        .update({ status: 'settled', payment_status: 'paid' })
        .eq('id', orderId)
    }

    // Free table
    if (order.table_id) {
      await supabase
        .from('restaurant_tables')
        .update({ status: 'available', current_order_id: null })
        .eq('id', order.table_id)
    }

    revalidatePath('/restaurant')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to settle order' }
  }
}
