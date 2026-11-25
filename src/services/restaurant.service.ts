'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const supabase = createAdminClient()

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
    const admin = createAdminClient()

    let query = admin
      .from('guest_service_categories')
      .select('*')
      .order('name', { ascending: true })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('getMenuCategories error:', error)
      return []
    }
    if (!data) return []

    let cats = data
    if (cats.length === 0 && propertyId) {
      const { data: allCats } = await admin
        .from('guest_service_categories')
        .select('*')
        .order('name', { ascending: true })
      if (allCats && allCats.length > 0) {
        cats = allCats
      }
    }

    return cats.map((c: any) => ({
      id: c.id,
      propertyId: c.property_id,
      name: c.name,
      type: 'food_beverage',
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
    const admin = createAdminClient()

    const trimmedName = data.name.trim()
    // Check if category with this name already exists
    const { data: existing } = await admin
      .from('guest_service_categories')
      .select('id')
      .eq('property_id', data.propertyId)
      .ilike('name', trimmedName)
      .maybeSingle()

    if (existing?.id) {
      return { success: true, categoryId: existing.id }
    }

    const baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'menu'
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: cat, error } = await admin
      .from('guest_service_categories')
      .insert({
        property_id: data.propertyId,
        name: trimmedName,
        slug,
        icon: 'Utensils',
        is_active: true,
        display_order: 1,
      })
      .select('id')
      .single()

    if (error) {
      console.error('createMenuCategory insert error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/restaurant/menu')
    revalidatePath('/guest')
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
    const admin = createAdminClient()

    let query = admin
      .from('guest_service_items')
      .select(`
        id,
        property_id,
        category_id,
        name,
        price,
        description,
        dietary_type,
        is_available,
        created_at,
        guest_service_categories (
          id,
          property_id,
          name
        )
      `)
      .order('name', { ascending: true })

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('getMenuItems query error:', error)
      return []
    }
    if (!data) return []

    // Filter items belonging to this property (via property_id or category)
    let filtered = propertyId
      ? data.filter(
          (item: any) =>
            item.property_id === propertyId ||
            item.guest_service_categories?.property_id === propertyId
        )
      : data

    // If specific property has 0 items but database has items, fallback to all available items
    if (filtered.length === 0 && data.length > 0) {
      filtered = data
    }

    return filtered.map((item: any) => ({
      id: item.id,
      categoryId: item.category_id,
      categoryName: item.guest_service_categories?.name || 'General',
      name: item.name,
      price: Number(item.price || 0),
      description: item.description,
      isVeg:
        item.dietary_type === 'veg' ||
        item.dietary_type === 'jain' ||
        item.dietary_type === 'vegan' ||
        !item.dietary_type,
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
  categoryId?: string
  propertyId?: string
  name: string
  price: number
  description?: string
  isVeg: boolean
  isAvailable: boolean
}): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const admin = createAdminClient()

    let categoryId = data.categoryId
    let propertyId = data.propertyId

    // Retrieve property_id from category if needed
    if (categoryId) {
      const { data: cat } = await admin
        .from('guest_service_categories')
        .select('property_id')
        .eq('id', categoryId)
        .maybeSingle()
      if (cat?.property_id) {
        propertyId = cat.property_id
      }
    }

    // If no categoryId, fallback to the first existing category for this property or create one
    if (!categoryId && propertyId) {
      const { data: firstCat } = await admin
        .from('guest_service_categories')
        .select('id')
        .eq('property_id', propertyId)
        .limit(1)
        .maybeSingle()

      if (firstCat?.id) {
        categoryId = firstCat.id
      } else {
        const slug = `main-menu-${Math.floor(1000 + Math.random() * 9000)}`
        const { data: newCat } = await admin
          .from('guest_service_categories')
          .insert({
            property_id: propertyId,
            name: 'Main Menu',
            slug,
            icon: 'Utensils',
            is_active: true,
          })
          .select('id')
          .single()
        if (newCat?.id) categoryId = newCat.id
      }
    }

    if (!categoryId) {
      return { success: false, error: 'A valid menu category is required to create a menu item.' }
    }

    const payload: Record<string, any> = {
      category_id: categoryId,
      name: data.name.trim(),
      price: data.price,
      description: data.description || null,
      dietary_type: data.isVeg ? 'veg' : 'non-veg',
      is_available: data.isAvailable,
      tax_rate_percentage: 5,
      preparation_time_mins: 20,
    }

    if (propertyId) {
      payload.property_id = propertyId
    }

    const { data: item, error } = await admin
      .from('guest_service_items')
      .insert(payload)
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/restaurant/menu')
    revalidatePath('/guest')
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
    const supabase = createAdminClient()

    let query = supabase
      .from('restaurant_orders')
      .select(`
        id,
        property_id,
        table_id,
        order_number,
        order_type,
        room_id,
        guest_name,
        subtotal,
        tax_amount,
        total_amount,
        payment_status,
        payment_method,
        status,
        kot_number,
        created_at,
        restaurant_tables (
          table_number
        ),
        rooms (
          room_number
        ),
        restaurant_order_items (
          id,
          order_id,
          item_name,
          quantity,
          price,
          notes
        )
      `)
      .order('created_at', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((o: any) => {
      const tableNumber = o.restaurant_tables?.table_number
      const roomNumber = o.rooms?.room_number
      const guestName = o.guest_name || (roomNumber ? `Room ${roomNumber}` : 'Dine-in Guest')

      const items: OrderItemRecord[] = (o.restaurant_order_items || []).map((i: any) => ({
        id: i.id,
        orderId: i.order_id,
        itemName: i.item_name,
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.price || 0),
        totalPrice: Number(((i.quantity || 1) * (i.price || 0)).toFixed(2)),
        notes: i.notes,
      }))

      return {
        id: o.id,
        orderNumber: o.order_number,
        propertyId: o.property_id,
        tableId: o.table_id,
        tableNumber,
        roomId: o.room_id,
        roomNumber,
        guestName,
        orderType: o.order_type || 'dine_in',
        status: o.status,
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.tax_amount || 0),
        totalAmount: Number(o.total_amount || 0),
        paymentStatus: o.payment_status || 'unpaid',
        notes: o.kot_number ? `KOT: ${o.kot_number}` : undefined,
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
  guestName?: string
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
    const admin = createAdminClient()

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
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    const kotNumber = `KOT-${Math.floor(100 + Math.random() * 900)}`

    // 1. Insert order into restaurant_orders
    const { data: order, error: orderErr } = await admin
      .from('restaurant_orders')
      .insert({
        property_id: data.propertyId,
        table_id: data.tableId || null,
        room_id: data.roomId || null,
        order_number: orderNumber,
        order_type: data.orderType,
        guest_name: data.guestName || (data.roomId ? `Room Delivery` : 'Dine-in Guest'),
        status: 'placed',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'pending',
        kot_number: kotNumber,
      })
      .select('id')
      .single()

    if (orderErr) return { success: false, error: orderErr.message }

    // 2. Insert items into restaurant_order_items
    const orderItems = data.items.map((i) => ({
      order_id: order.id,
      item_name: i.name,
      quantity: i.quantity,
      price: i.unitPrice,
      notes: i.notes || null,
    }))

    await admin.from('restaurant_order_items').insert(orderItems)

    // 3. If table attached, update table status to occupied
    if (data.tableId) {
      await admin
        .from('restaurant_tables')
        .update({ status: 'occupied', current_order_id: order.id })
        .eq('id', data.tableId)
    }

    revalidatePath('/restaurant')
    revalidatePath('/restaurant/food-requests')
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

export interface BulkUploadMenuItemInput {
  name: string
  categoryName: string
  price: number
  description?: string
  isVeg?: boolean
  isAvailable?: boolean
}

/**
 * Bulk upload menu items with automatic creation of new categories
 */
export async function bulkUploadMenuItems(data: {
  propertyId: string
  items: BulkUploadMenuItemInput[]
}): Promise<{
  success: boolean
  importedCount?: number
  createdCategoriesCount?: number
  createdCategoryNames?: string[]
  error?: string
}> {
  try {
    if (!data.propertyId) {
      return { success: false, error: 'Property ID is required' }
    }
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'No menu items provided for bulk upload' }
    }

    const admin = createAdminClient()

    // 1. Fetch existing categories for property
    const { data: existingCategories } = await admin
      .from('guest_service_categories')
      .select('id, name')
      .eq('property_id', data.propertyId)

    const categoryMap = new Map<string, string>()
    if (existingCategories) {
      for (const cat of existingCategories) {
        if (cat.name) {
          categoryMap.set(cat.name.trim().toLowerCase(), cat.id)
        }
      }
    }

    // 2. Discover unique new categories needed
    const newCategoryNames: string[] = []
    for (const it of data.items) {
      const rawCat = (it.categoryName || 'Main Course').trim()
      const key = rawCat.toLowerCase()
      if (!categoryMap.has(key) && !newCategoryNames.some((c) => c.toLowerCase() === key)) {
        newCategoryNames.push(rawCat)
      }
    }

    // 3. Create missing categories
    for (const newCat of newCategoryNames) {
      // Check if already in db
      const { data: foundInDb } = await admin
        .from('guest_service_categories')
        .select('id')
        .eq('property_id', data.propertyId)
        .ilike('name', newCat.trim())
        .maybeSingle()

      if (foundInDb?.id) {
        categoryMap.set(newCat.trim().toLowerCase(), foundInDb.id)
        continue
      }

      const baseSlug = newCat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'menu'
      const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`

      const { data: createdCat, error: catErr } = await admin
        .from('guest_service_categories')
        .insert({
          property_id: data.propertyId,
          name: newCat.trim(),
          slug,
          icon: 'Utensils',
          is_active: true,
          display_order: 1,
        })
        .select('id')
        .single()

      if (!catErr && createdCat?.id) {
        categoryMap.set(newCat.trim().toLowerCase(), createdCat.id)
      } else {
        console.error('Error creating category during bulk upload:', catErr)
        // Fallback: check again by name
        const { data: retryCat } = await admin
          .from('guest_service_categories')
          .select('id')
          .eq('property_id', data.propertyId)
          .ilike('name', newCat.trim())
          .maybeSingle()

        if (retryCat?.id) {
          categoryMap.set(newCat.trim().toLowerCase(), retryCat.id)
        }
      }
    }

    // 4. Ensure at least one default category ID exists
    let defaultCategoryId = categoryMap.values().next().value
    if (!defaultCategoryId) {
      const { data: anyCat } = await admin
        .from('guest_service_categories')
        .select('id')
        .eq('property_id', data.propertyId)
        .limit(1)
        .maybeSingle()

      if (anyCat?.id) {
        defaultCategoryId = anyCat.id
      } else {
        const slug = `main-course-${Math.floor(1000 + Math.random() * 9000)}`
        const { data: defCat } = await admin
          .from('guest_service_categories')
          .insert({
            property_id: data.propertyId,
            name: 'Main Course',
            slug,
            icon: 'Utensils',
            is_active: true,
            display_order: 1,
          })
          .select('id')
          .single()

        if (defCat?.id) {
          defaultCategoryId = defCat.id
          categoryMap.set('main course', defCat.id)
        }
      }
    }

    // 5. Prepare items payload (guaranteeing category_id is NEVER null)
    const itemsPayload = data.items
      .filter((it) => it.name && it.name.trim().length > 0)
      .map((it) => {
        const catKey = (it.categoryName || 'Main Course').trim().toLowerCase()
        const categoryId = categoryMap.get(catKey) || defaultCategoryId

        if (!categoryId) {
          throw new Error(`Unable to determine category_id for item "${it.name}"`)
        }

        const isVeg = it.isVeg !== undefined ? Boolean(it.isVeg) : true
        return {
          property_id: data.propertyId,
          category_id: categoryId,
          name: it.name.trim(),
          description: it.description?.trim() || null,
          price: Number(it.price) || 0,
          tax_rate_percentage: 5,
          dietary_type: isVeg ? 'veg' : 'non-veg',
          is_available: it.isAvailable !== undefined ? Boolean(it.isAvailable) : true,
          preparation_time_mins: 20,
        }
      })

    if (itemsPayload.length === 0) {
      return { success: false, error: 'No valid items found to insert' }
    }

    const { error: insertErr } = await admin.from('guest_service_items').insert(itemsPayload)
    if (insertErr) {
      return { success: false, error: insertErr.message || 'Failed to insert menu items' }
    }

    revalidatePath('/restaurant/menu')
    revalidatePath('/restaurant/food-requests')
    revalidatePath('/guest')

    return {
      success: true,
      importedCount: itemsPayload.length,
      createdCategoriesCount: newCategoryNames.length,
      createdCategoryNames: newCategoryNames,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Bulk upload failed' }
  }
}

export interface FoodRequestItemRecord {
  id: string
  orderId: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  dietaryType?: string
  specialRequests?: string
}

export interface FoodRequestRecord {
  id: string
  orderNumber: string
  propertyId: string
  roomId: string
  roomNumber: string
  roomTypeName?: string
  guestName: string
  guestPhone?: string
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  totalAmount: number
  specialInstructions?: string
  createdAt: string
  deliveredAt?: string
  items: FoodRequestItemRecord[]
}

/**
 * Fetch all guest room food requests for a property
 */
export async function getFoodRequests(
  propertyId: string,
  statusFilter?: string
): Promise<FoodRequestRecord[]> {
  try {
    const admin = createAdminClient()

    let query = admin
      .from('guest_orders')
      .select(`
        id,
        property_id,
        room_id,
        order_number,
        guest_name,
        guest_phone,
        status,
        payment_method,
        payment_status,
        subtotal,
        tax_amount,
        delivery_charge,
        total_amount,
        special_instructions,
        created_at,
        delivered_at,
        rooms (
          room_number
        ),
        guest_order_items (
          id,
          order_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          dietary_type,
          special_requests
        )
      `)
      .order('created_at', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    let { data, error } = await query

    if (error) {
      console.error('getFoodRequests error:', error)
      return []
    }

    let records = data || []
    if (records.length === 0 && propertyId) {
      let fbQuery = admin
        .from('guest_orders')
        .select(`
          id,
          property_id,
          room_id,
          order_number,
          guest_name,
          guest_phone,
          status,
          payment_method,
          payment_status,
          subtotal,
          tax_amount,
          delivery_charge,
          total_amount,
          special_instructions,
          created_at,
          delivered_at,
          rooms (
            room_number
          ),
          guest_order_items (
            id,
            order_id,
            item_name,
            quantity,
            unit_price,
            total_price,
            dietary_type,
            special_requests
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        fbQuery = fbQuery.eq('status', statusFilter)
      }
      const { data: allReqs } = await fbQuery
      if (allReqs && allReqs.length > 0) {
        records = allReqs
      }
    }

    return records.map((o: any) => {
      const room = o.rooms
      const roomNumber = room?.room_number || 'Room'
      const roomTypeName = room?.room_types?.name || 'Standard Room'

      const items: FoodRequestItemRecord[] = (o.guest_order_items || []).map((i: any) => ({
        id: i.id,
        orderId: i.order_id,
        itemName: i.item_name,
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unit_price || 0),
        totalPrice: Number(i.total_price || 0),
        dietaryType: i.dietary_type || 'veg',
        specialRequests: i.special_requests || '',
      }))

      return {
        id: o.id,
        orderNumber: o.order_number,
        propertyId: o.property_id,
        roomId: o.room_id,
        roomNumber,
        roomTypeName,
        guestName: o.guest_name || 'Guest',
        guestPhone: o.guest_phone || '',
        status: o.status || 'placed',
        paymentMethod: o.payment_method || 'pay_at_checkout',
        paymentStatus: o.payment_status || 'pending',
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.tax_amount || 0),
        deliveryCharge: Number(o.delivery_charge || 0),
        totalAmount: Number(o.total_amount || 0),
        specialInstructions: o.special_instructions || '',
        createdAt: o.created_at,
        deliveredAt: o.delivered_at,
        items,
      }
    })
  } catch (err) {
    console.error('getFoodRequests error:', err)
    return []
  }
}

/**
 * Update food request status (placed -> preparing -> out_for_delivery -> delivered -> cancelled)
 */
export async function updateFoodRequestStatus(
  orderId: string,
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()

    const payload: Record<string, any> = {
      status,
    }

    if (status === 'delivered') {
      payload.delivered_at = new Date().toISOString()
      payload.payment_status = 'billed_to_room'
    }

    const { data: updated, error } = await admin
      .from('guest_orders')
      .update(payload)
      .eq('id', orderId)
      .select('order_number')
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    // Sync with restaurant_orders if present
    if (updated?.order_number) {
      const restStatusMap: Record<string, string> = {
        placed: 'placed',
        confirmed: 'confirmed',
        preparing: 'kitchen_prep',
        out_for_delivery: 'kitchen_prep',
        delivered: 'served',
        cancelled: 'cancelled',
      }
      await admin
        .from('restaurant_orders')
        .update({ status: restStatusMap[status] || status })
        .eq('order_number', updated.order_number)
    }

    revalidatePath('/restaurant/food-requests')
    revalidatePath('/restaurant')
    revalidatePath('/guest')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update food request status' }
  }
}

/**
 * Accept a Food Request from Room QR and move it into Restaurant Orders
 */
export async function acceptFoodRequest(foodOrderId: string): Promise<{ success: boolean; restaurantOrderId?: string; error?: string }> {
  try {
    const admin = createAdminClient()

    // 1. Fetch the food request with items and room
    const { data: foodReq, error: reqErr } = await admin
      .from('guest_orders')
      .select(`
        *,
        rooms (
          room_number
        ),
        guest_order_items (
          *
        )
      `)
      .eq('id', foodOrderId)
      .maybeSingle()

    if (reqErr || !foodReq) {
      return { success: false, error: reqErr?.message || 'Food request not found' }
    }

    // 2. Update food request status to 'preparing' (accepted / kitchen cooking)
    await admin
      .from('guest_orders')
      .update({
        status: 'preparing',
        payment_status: foodReq.payment_status || 'pending',
      })
      .eq('id', foodOrderId)

    // 3. Ensure order exists in restaurant_orders
    const orderNum = foodReq.order_number || `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    const { data: existingRestOrder } = await admin
      .from('restaurant_orders')
      .select('id')
      .eq('order_number', orderNum)
      .maybeSingle()

    let restOrderId = existingRestOrder?.id

    if (restOrderId) {
      // Update existing order status to kitchen_prep
      await admin
        .from('restaurant_orders')
        .update({
          status: 'kitchen_prep',
          order_type: 'room_delivery',
          room_id: foodReq.room_id || null,
          guest_name: foodReq.guest_name || 'Room Guest',
        })
        .eq('id', restOrderId)
    } else {
      // Create new order in restaurant_orders
      const roomNum = foodReq.rooms?.room_number || ''
      const guestDisplay = foodReq.guest_name
        ? `${foodReq.guest_name}${roomNum ? ` (Room ${roomNum})` : ''}`
        : `Room ${roomNum || 'Guest'}`

      const { data: newRestOrder, error: insErr } = await admin
        .from('restaurant_orders')
        .insert({
          property_id: foodReq.property_id,
          order_number: orderNum,
          order_type: 'room_delivery',
          room_id: foodReq.room_id || null,
          guest_name: guestDisplay,
          subtotal: Number(foodReq.subtotal) || 0,
          tax_amount: Number(foodReq.tax_amount) || 0,
          total_amount: Number(foodReq.total_amount) || 0,
          payment_status: foodReq.payment_status || 'pending',
          payment_method: foodReq.payment_method || 'room_charge',
          status: 'kitchen_prep',
          kot_number: `KOT-${Math.floor(100 + Math.random() * 900)}`,
        })
        .select('id')
        .single()

      if (insErr) {
        console.error('acceptFoodRequest insert into restaurant_orders error:', insErr)
        return { success: false, error: insErr.message }
      }

      restOrderId = newRestOrder?.id

      // Insert items into restaurant_order_items
      if (restOrderId && foodReq.guest_order_items && foodReq.guest_order_items.length > 0) {
        const restItems = foodReq.guest_order_items.map((it: any) => ({
          order_id: restOrderId,
          item_name: it.item_name,
          quantity: Number(it.quantity || 1),
          price: Number(it.unit_price || 0),
          notes: it.special_requests || null,
        }))
        await admin.from('restaurant_order_items').insert(restItems)
      }
    }

    revalidatePath('/restaurant')
    revalidatePath('/restaurant/food-requests')
    revalidatePath('/guest')

    return { success: true, restaurantOrderId: restOrderId }
  } catch (err: any) {
    console.error('acceptFoodRequest error:', err)
    return { success: false, error: err.message || 'Failed to accept order' }
  }
}


