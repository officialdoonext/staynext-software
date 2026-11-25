'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface NotificationRecipientItem {
  id: string
  property_id: string
  category: 'housekeeping' | 'maintenance'
  channel: 'mail' | 'whatsapp' | 'sms'
  recipient: string
  template_id?: string
  label?: string
  is_active: boolean
  created_at: string
}

export interface AddNotificationRecipientInput {
  property_id: string
  category: 'housekeeping' | 'maintenance'
  channel: 'mail' | 'whatsapp' | 'sms'
  recipient: string
  template_id?: string
  label?: string
  is_active?: boolean
}

/**
 * Fetch all notification recipients for a property, optionally filtered by category and channel
 */
export async function getNotificationRecipients(
  propertyId: string,
  category?: 'housekeeping' | 'maintenance',
  channel?: 'mail' | 'whatsapp' | 'sms'
): Promise<NotificationRecipientItem[]> {
  try {
    const supabase = await createClient()

    // 1. Try dedicated table first
    let query = supabase
      .from('notification_recipients')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as NotificationRecipientItem[]
    }

    // 2. Fallback to properties.settings.notifications JSON store if table is empty or pending migration
    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    const jsonRecipients: NotificationRecipientItem[] =
      prop?.settings?.notifications?.recipients || []

    return jsonRecipients.filter((item) => {
      if (category && item.category !== category) return false
      if (channel && item.channel !== channel) return false
      return true
    })
  } catch (err) {
    console.error('getNotificationRecipients error:', err)
    return []
  }
}

/**
 * Add a notification recipient (Mail, WhatsApp, or SMS)
 */
export async function addNotificationRecipient(
  input: AddNotificationRecipientInput
): Promise<{ success: boolean; data?: NotificationRecipientItem; error?: string }> {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()

    const newItem: NotificationRecipientItem = {
      id: newId,
      property_id: input.property_id,
      category: input.category,
      channel: input.channel,
      recipient: input.recipient.trim(),
      template_id: input.template_id?.trim() || undefined,
      label: input.label?.trim() || undefined,
      is_active: input.is_active ?? true,
      created_at: now,
    }

    // 1. Insert into dedicated table
    try {
      await admin
        .from('notification_recipients')
        .insert({
          id: newId,
          property_id: input.property_id,
          category: input.category,
          channel: input.channel,
          recipient: newItem.recipient,
          template_id: newItem.template_id,
          label: newItem.label,
          is_active: newItem.is_active,
        })
    } catch {
      // Table may be pending migration
    }

    // 2. Also keep properties.settings.notifications updated for resilience
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('settings')
        .eq('id', input.property_id)
        .single()

      const currentSettings = prop?.settings || {}
      const notifications = currentSettings.notifications || {}
      const recipients: NotificationRecipientItem[] = notifications.recipients || []

      recipients.unshift(newItem)

      await admin
        .from('properties')
        .update({
          settings: {
            ...currentSettings,
            notifications: {
              ...notifications,
              recipients,
            },
          },
        })
        .eq('id', input.property_id)
    } catch (jsonErr) {
      console.warn('Sync to properties.settings failed:', jsonErr)
    }

    revalidatePath('/settings/notifications')
    return { success: true, data: newItem }
  } catch (err: any) {
    console.error('addNotificationRecipient error:', err)
    return { success: false, error: err.message || 'Failed to add recipient' }
  }
}

/**
 * Toggle recipient active state
 */
export async function toggleNotificationRecipient(
  id: string,
  propertyId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const supabase = await createClient()

    // 1. Update in table
    try {
      await admin
        .from('notification_recipients')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
    } catch {}

    // 2. Update in JSON
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('settings')
        .eq('id', propertyId)
        .single()

      const currentSettings = prop?.settings || {}
      const notifications = currentSettings.notifications || {}
      const recipients: NotificationRecipientItem[] = (notifications.recipients || []).map(
        (r: NotificationRecipientItem) => (r.id === id ? { ...r, is_active: isActive } : r)
      )

      await admin
        .from('properties')
        .update({
          settings: {
            ...currentSettings,
            notifications: {
              ...notifications,
              recipients,
            },
          },
        })
        .eq('id', propertyId)
    } catch {}

    revalidatePath('/settings/notifications')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update status' }
  }
}

/**
 * Delete a notification recipient
 */
export async function deleteNotificationRecipient(
  id: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const supabase = await createClient()

    // 1. Delete from table
    try {
      await admin.from('notification_recipients').delete().eq('id', id)
    } catch {}

    // 2. Delete from JSON
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('settings')
        .eq('id', propertyId)
        .single()

      const currentSettings = prop?.settings || {}
      const notifications = currentSettings.notifications || {}
      const recipients: NotificationRecipientItem[] = (notifications.recipients || []).filter(
        (r: NotificationRecipientItem) => r.id !== id
      )

      await admin
        .from('properties')
        .update({
          settings: {
            ...currentSettings,
            notifications: {
              ...notifications,
              recipients,
            },
          },
        })
        .eq('id', propertyId)
    } catch {}

    revalidatePath('/settings/notifications')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete recipient' }
  }
}
