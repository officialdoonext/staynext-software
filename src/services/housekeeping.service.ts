'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface HousekeepingTaskItem {
  id: string
  room_id: string
  room_number: string
  floor_name?: string
  task_type: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'inspected'
  assigned_to?: string
  assigned_employee_name?: string
  notes?: string
  scheduled_date?: string
  completed_at?: string
  created_at: string
}

/**
 * Fetch housekeeping turnover tasks
 */
export async function getHousekeepingTasks(propertyId?: string): Promise<HousekeepingTaskItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      room:rooms(id, room_number, property_id, floor:floors(name, floor_number)),
      employee:employees(id, first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error || !data) return []

  return data
    .filter((t: any) => !propertyId || t.room?.property_id === propertyId)
    .map((t: any) => ({
      id: t.id,
      room_id: t.room_id,
      room_number: t.room?.room_number || 'Room',
      floor_name: t.room?.floor?.name || (t.room?.floor?.floor_number ? `Floor ${t.room.floor.floor_number}` : 'Floor 1'),
      task_type: t.task_type || 'Room Cleaning',
      priority: t.priority || 'medium',
      status: t.status || 'pending',
      assigned_to: t.assigned_to,
      assigned_employee_name: t.employee
        ? `${t.employee.first_name || ''} ${t.employee.last_name || ''}`.trim()
        : 'Unassigned',
      notes: t.notes || '',
      scheduled_date: t.scheduled_date,
      completed_at: t.completed_at,
      created_at: t.created_at,
    }))
}

/**
 * Update a task's status and automatically update the Room status
 */
export async function updateHousekeepingTaskStatus(
  taskId: string,
  roomId: string,
  newStatus: HousekeepingTaskItem['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('housekeeping_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' || newStatus === 'inspected' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) throw error

    // Update Room status
    let roomStatus = 'dirty'
    if (newStatus === 'in_progress') roomStatus = 'cleaning'
    if (newStatus === 'completed' || newStatus === 'inspected') roomStatus = 'available'

    await supabase.from('rooms').update({ status: roomStatus }).eq('id', roomId)

    revalidatePath('/housekeeping')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    revalidatePath('/front-desk')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Create a new housekeeping work task
 */
export async function createHousekeepingTask(payload: {
  room_id: string
  task_type: string
  priority?: string
  assigned_to?: string
  notes?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .insert({
        room_id: payload.room_id,
        task_type: payload.task_type,
        priority: payload.priority || 'medium',
        assigned_to: payload.assigned_to || null,
        notes: payload.notes || '',
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Mark room as dirty or cleaning
    await supabase.from('rooms').update({ status: 'dirty' }).eq('id', payload.room_id)

    revalidatePath('/housekeeping')
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

