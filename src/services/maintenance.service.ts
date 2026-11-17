'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MaintenanceItem {
  id: string
  property_id: string
  room_id?: string
  room_number?: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed'
  assigned_to?: string
  assigned_employee_name?: string
  estimated_cost?: number
  actual_cost?: number
  reported_at: string
  resolved_at?: string
  created_at: string
}

/**
 * Fetch maintenance tickets
 */
export async function getMaintenanceRequests(propertyId?: string): Promise<MaintenanceItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('maintenance_requests')
    .select(`
      *,
      room:rooms(room_number),
      employee:employees(first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((m: any) => ({
    id: m.id,
    property_id: m.property_id,
    room_id: m.room_id,
    room_number: m.room?.room_number || (m.room_id ? 'Room' : 'Public Facility'),
    title: m.title || 'Maintenance Request',
    description: m.description || '',
    category: m.category || 'General',
    priority: m.priority || 'medium',
    status: m.status || 'open',
    assigned_to: m.assigned_to,
    assigned_employee_name: m.employee
      ? `${m.employee.first_name || ''} ${m.employee.last_name || ''}`.trim()
      : 'Engineering Team',
    estimated_cost: parseFloat(m.estimated_cost) || 0,
    actual_cost: parseFloat(m.actual_cost) || 0,
    reported_at: m.created_at,
    resolved_at: m.resolved_at,
    created_at: m.created_at,
  }))
}

/**
 * Create a new maintenance work order
 */
export async function createMaintenanceWorkOrder(payload: {
  property_id: string
  room_id?: string
  title: string
  description: string
  category: string
  priority?: string
  assigned_to?: string
  estimated_cost?: number
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        property_id: payload.property_id,
        room_id: payload.room_id || null,
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category || 'general',
        priority: payload.priority || 'medium',
        assigned_to: payload.assigned_to || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    // If room issue and high/urgent priority, mark room as maintenance
    if (payload.room_id && (payload.priority === 'urgent' || payload.priority === 'high')) {
      await supabase.from('rooms').update({ status: 'maintenance' }).eq('id', payload.room_id)
    }

    revalidatePath('/maintenance')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Update ticket status and turnover room back to available/dirty
 */
export async function updateMaintenanceStatus(
  ticketId: string,
  roomId: string | undefined,
  status: MaintenanceItem['status'],
  actualCost?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('maintenance_requests')
      .update({
        status,
        actual_cost: actualCost,
        resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
      })
      .eq('id', ticketId)

    if (error) throw error

    // When resolved, return room to 'dirty' so housekeeping can inspect/clean before guest check-in
    if (roomId && (status === 'resolved' || status === 'closed')) {
      await supabase.from('rooms').update({ status: 'dirty' }).eq('id', roomId)
    }

    revalidatePath('/maintenance')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

