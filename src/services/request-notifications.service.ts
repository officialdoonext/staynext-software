'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface RequestNotification {
  id: string
  rawId: string
  category: 'housekeeping' | 'maintenance' | 'food'
  title: string
  roomNumber?: string
  description: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  createdAt: string
  targetUrl: string
  guestName?: string
  totalAmount?: number
  itemsSummary?: string
}

/**
 * Fetch the latest real-time housekeeping, maintenance, and food dining requests
 * across all operational branches.
 */
export async function getRecentRequestNotifications(
  propertyId?: string
): Promise<RequestNotification[]> {
  const admin = createAdminClient()
  const results: RequestNotification[] = []

  // 1. Fetch Housekeeping Tasks
  try {
    let hkQuery = admin
      .from('housekeeping_tasks')
      .select(`
        id,
        property_id,
        room_id,
        task_type,
        priority,
        status,
        notes,
        created_at,
        room:rooms(room_number)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (propertyId) {
      hkQuery = hkQuery.eq('property_id', propertyId)
    }

    const { data: hkData, error: hkErr } = await hkQuery
    if (!hkErr && hkData) {
      hkData.forEach((task: any) => {
        const roomNum = task.room?.room_number || (task.room_id ? 'Room' : undefined)
        results.push({
          id: `hk_${task.id}`,
          rawId: task.id,
          category: 'housekeeping',
          title: task.task_type || 'Housekeeping Cleaning',
          roomNumber: roomNum,
          description: task.notes || `Housekeeping requested for Room ${roomNum || ''}`,
          priority: task.priority || 'medium',
          status: task.status || 'pending',
          createdAt: task.created_at,
          targetUrl: '/housekeeping',
        })
      })
    }
  } catch (err) {
    console.error('Error fetching housekeeping notifications:', err)
  }

  // 2. Fetch Maintenance Requests
  try {
    let maintQuery = admin
      .from('maintenance_requests')
      .select(`
        id,
        property_id,
        room_id,
        title,
        description,
        category,
        priority,
        status,
        created_at,
        room:rooms(room_number)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (propertyId) {
      maintQuery = maintQuery.eq('property_id', propertyId)
    }

    const { data: maintData, error: maintErr } = await maintQuery
    if (!maintErr && maintData) {
      maintData.forEach((ticket: any) => {
        const roomNum = ticket.room?.room_number
        results.push({
          id: `maint_${ticket.id}`,
          rawId: ticket.id,
          category: 'maintenance',
          title: ticket.title || ticket.category || 'Maintenance Work Order',
          roomNumber: roomNum,
          description: ticket.description || `Engineering repair reported for Room ${roomNum || ''}`,
          priority: ticket.priority || 'medium',
          status: ticket.status || 'open',
          createdAt: ticket.created_at,
          targetUrl: '/maintenance',
        })
      })
    }
  } catch (err) {
    console.error('Error fetching maintenance notifications:', err)
  }

  // 3. Fetch Guest Food Requests & Orders
  try {
    let foodQuery = admin
      .from('guest_orders')
      .select(`
        id,
        property_id,
        room_id,
        order_number,
        guest_name,
        status,
        total_amount,
        created_at,
        rooms (
          room_number
        ),
        guest_order_items (
          item_name,
          quantity
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (propertyId) {
      foodQuery = foodQuery.eq('property_id', propertyId)
    }

    const { data: foodData, error: foodErr } = await foodQuery
    if (!foodErr && foodData) {
      foodData.forEach((order: any) => {
        const roomNum = order.rooms?.room_number
        const items = order.guest_order_items || []
        const itemsSummary = items.length > 0
          ? items.map((i: any) => `${i.quantity}x ${i.item_name}`).join(', ')
          : 'In-Room Dining Order'

        results.push({
          id: `food_${order.id}`,
          rawId: order.id,
          category: 'food',
          title: `Food Order #${order.order_number || order.id.slice(0, 6).toUpperCase()}`,
          roomNumber: roomNum,
          description: itemsSummary,
          status: order.status || 'placed',
          createdAt: order.created_at,
          targetUrl: '/restaurant/food-requests',
          guestName: order.guest_name,
          totalAmount: order.total_amount,
          itemsSummary,
        })
      })
    }
  } catch (err) {
    console.error('Error fetching food request notifications:', err)
  }

  // Sort by createdAt descending
  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
