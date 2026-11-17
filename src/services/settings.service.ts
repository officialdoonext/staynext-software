'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PropertySettingsData {
  id: string
  tenantId: string
  name: string
  propertyType: string
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  currency: string
  timezone: string
  checkInTime: string
  checkOutTime: string
  logoUrl?: string
  description?: string
  isActive: boolean
  settings: Record<string, any>
  tenant?: {
    id: string
    name: string
    email: string
    phone?: string
    subscriptionPlan: string
    subscriptionExpiresAt: string
    allowedPropertiesCount: number
    isActive: boolean
    status: string
  }
}

export interface TaxRateData {
  id: string
  propertyId: string
  name: string
  ratePercentage: number
  code?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export interface IntegrationItem {
  id: string
  name: string
  category: string
  provider: string
  description: string
  isEnabled: boolean
  apiKey?: string
  webhookSecret?: string
  status: 'connected' | 'configured' | 'disabled'
}

export interface NotificationSettingsData {
  bookingConfirmation: boolean
  preArrivalWelcome: boolean
  checkoutFolioPdf: boolean
  postStayReview: boolean
  urgentMaintenanceAlert: boolean
  vipArrivalAlert: boolean
  lowInventoryAlert: boolean
}

export interface PropertyUserItem {
  id: string
  fullName: string
  email: string
  phone?: string
  role: string
  department?: string
  isActive: boolean
  createdAt: string
}

/**
 * Fetch Property & Tenant Settings
 */
export async function getPropertySettings(propId?: string): Promise<PropertySettingsData | null> {
  try {
    const supabase = await createClient()

    let query = supabase.from('properties').select('*, tenants(*)')
    if (propId) {
      query = query.eq('id', propId)
    }
    const { data: properties, error } = await query.limit(1)

    if (error || !properties || properties.length === 0) {
      return null
    }

    const p = properties[0] as any
    const t = p.tenants

    return {
      id: p.id,
      tenantId: p.tenant_id,
      name: p.name,
      propertyType: p.property_type || 'hotel',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      country: p.country || 'India',
      postalCode: p.postal_code || '',
      phone: p.phone || '',
      email: p.email || '',
      website: p.website || '',
      currency: p.currency || 'INR',
      timezone: p.timezone || 'Asia/Kolkata',
      checkInTime: p.check_in_time || '14:00',
      checkOutTime: p.check_out_time || '11:00',
      logoUrl: p.logo_url,
      description: p.description || '',
      isActive: Boolean(p.is_active),
      settings: p.settings || {},
      tenant: t
        ? {
            id: t.id,
            name: t.name,
            email: t.email,
            phone: t.phone,
            subscriptionPlan: t.subscription_plan || 'starter',
            subscriptionExpiresAt: t.subscription_expires_at || '',
            allowedPropertiesCount: Number(t.allowed_properties_count || 1),
            isActive: Boolean(t.is_active),
            status: t.status || 'inactive',
          }
        : undefined,
    }
  } catch (err) {
    console.error('getPropertySettings error:', err)
    return null
  }
}

/**
 * Update Property Settings
 */
export async function updatePropertySettings(
  propertyId: string,
  updates: {
    name: string
    propertyType?: string
    address: string
    city: string
    state?: string
    country: string
    postalCode?: string
    phone?: string
    email?: string
    website?: string
    currency?: string
    timezone?: string
    checkInTime?: string
    checkOutTime?: string
    description?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('properties')
      .update({
        name: updates.name,
        property_type: updates.propertyType || 'hotel',
        address: updates.address,
        city: updates.city,
        state: updates.state,
        country: updates.country,
        postal_code: updates.postalCode,
        phone: updates.phone,
        email: updates.email,
        website: updates.website,
        currency: updates.currency || 'INR',
        timezone: updates.timezone || 'Asia/Kolkata',
        check_in_time: updates.checkInTime || '14:00',
        check_out_time: updates.checkOutTime || '11:00',
        description: updates.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)

    if (error) throw error

    revalidatePath('/settings')
    revalidatePath('/properties')
    return { success: true }
  } catch (err: any) {
    console.error('updatePropertySettings error:', err)
    return { success: false, error: err.message || 'Failed to update property settings' }
  }
}

/**
 * Fetch Statutory Tax Rates (Auto seeds standard statutory rates if empty)
 */
export async function getTaxRates(propertyId: string): Promise<TaxRateData[]> {
  try {
    const supabase = await createClient()

    const { data: taxes, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('property_id', propertyId)
      .order('rate_percentage', { ascending: true })

    if (error) throw error

    if (!taxes || taxes.length === 0) {
      // Auto seed standard hospitality tax rates
      const seeds = [
        {
          property_id: propertyId,
          name: 'GST Room Accommodation (SAC 9963)',
          rate_percentage: 12.0,
          code: 'GST-ROOM-12',
          is_default: true,
          is_active: true,
        },
        {
          property_id: propertyId,
          name: 'GST Restaurant & In-Room Dining',
          rate_percentage: 5.0,
          code: 'GST-FB-5',
          is_default: false,
          is_active: true,
        },
        {
          property_id: propertyId,
          name: 'GST Banquet & Event Services',
          rate_percentage: 18.0,
          code: 'GST-EVENT-18',
          is_default: false,
          is_active: true,
        },
      ]

      const { data: inserted } = await supabase.from('tax_rates').insert(seeds).select()
      if (inserted) {
        return inserted.map((t: any) => ({
          id: t.id,
          propertyId: t.property_id,
          name: t.name,
          ratePercentage: Number(t.rate_percentage || 0),
          code: t.code,
          isDefault: Boolean(t.is_default),
          isActive: Boolean(t.is_active),
          createdAt: t.created_at,
        }))
      }
    }

    return (taxes || []).map((t: any) => ({
      id: t.id,
      propertyId: t.property_id,
      name: t.name,
      ratePercentage: Number(t.rate_percentage || 0),
      code: t.code,
      isDefault: Boolean(t.is_default),
      isActive: Boolean(t.is_active),
      createdAt: t.created_at,
    }))
  } catch (err) {
    console.error('getTaxRates error:', err)
    return []
  }
}

/**
 * Create Tax Rate
 */
export async function createTaxRate(
  propertyId: string,
  data: {
    name: string
    ratePercentage: number
    code?: string
    isDefault?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('tax_rates').insert({
      property_id: propertyId,
      name: data.name,
      rate_percentage: data.ratePercentage,
      code: data.code || `TAX-${Math.round(data.ratePercentage)}`,
      is_default: Boolean(data.isDefault),
      is_active: true,
    })

    if (error) throw error

    revalidatePath('/settings/billing')
    return { success: true }
  } catch (err: any) {
    console.error('createTaxRate error:', err)
    return { success: false, error: err.message || 'Failed to create tax rate' }
  }
}

/**
 * Delete Tax Rate
 */
export async function deleteTaxRate(taxRateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('tax_rates').delete().eq('id', taxRateId)
    if (error) throw error

    revalidatePath('/settings/billing')
    return { success: true }
  } catch (err: any) {
    console.error('deleteTaxRate error:', err)
    return { success: false, error: err.message || 'Failed to delete tax rate' }
  }
}

/**
 * Get Third-Party Integrations
 */
export async function getIntegrations(propertyId: string): Promise<IntegrationItem[]> {
  try {
    const supabase = await createClient()

    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    const saved = prop?.settings?.integrations || {}

    const defaultIntegrations: IntegrationItem[] = [
      {
        id: 'razorpay',
        name: 'Razorpay Payment Gateway & UPI',
        category: 'Payment Processing',
        provider: 'Razorpay Software',
        description: 'Instant UPI, QR codes, Credit/Debit cards, Netbanking and automated payment links for guest folios.',
        isEnabled: saved.razorpay?.isEnabled ?? true,
        apiKey: saved.razorpay?.apiKey ? 'rzp_live_••••••••••••' : '',
        status: saved.razorpay?.isEnabled ? 'connected' : 'disabled',
      },
      {
        id: 'stripe',
        name: 'Stripe International Payments',
        category: 'Card Terminal & FX',
        provider: 'Stripe, Inc.',
        description: 'Global credit card pre-authorizations, security deposits, and multi-currency international bookings.',
        isEnabled: saved.stripe?.isEnabled ?? false,
        apiKey: saved.stripe?.apiKey ? 'pk_live_••••••••••••' : '',
        status: saved.stripe?.isEnabled ? 'connected' : 'disabled',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp Business API & Concierge',
        category: 'Guest Messaging',
        provider: 'Meta Cloud API',
        description: 'Direct interactive WhatsApp room service menu, Wi-Fi passwords, and digital invoice dispatch on checkout.',
        isEnabled: saved.whatsapp?.isEnabled ?? true,
        apiKey: saved.whatsapp?.apiKey ? 'waba_auth_••••••••' : '',
        status: saved.whatsapp?.isEnabled ? 'connected' : 'disabled',
      },
      {
        id: 'sendgrid',
        name: 'SendGrid Transactional Email',
        category: 'Email Delivery',
        provider: 'Twilio SendGrid',
        description: 'High deliverability reservation confirmation emails, payment receipts, and guest registration passes.',
        isEnabled: saved.sendgrid?.isEnabled ?? true,
        apiKey: saved.sendgrid?.apiKey ? 'SG.••••••••••••' : '',
        status: saved.sendgrid?.isEnabled ? 'connected' : 'disabled',
      },
      {
        id: 'rfid_locks',
        name: 'RFID Keycard Door Lock System',
        category: 'Hardware & Access Control',
        provider: 'Assa Abloy / VingCard',
        description: 'Hardware encoder sync to issue RFID physical keycards or mobile BLE Bluetooth room door keys.',
        isEnabled: saved.rfid_locks?.isEnabled ?? false,
        apiKey: saved.rfid_locks?.apiKey || '',
        status: saved.rfid_locks?.isEnabled ? 'connected' : 'disabled',
      },
    ]

    return defaultIntegrations
  } catch (err) {
    console.error('getIntegrations error:', err)
    return []
  }
}

/**
 * Toggle or Save Integration
 */
export async function saveIntegrationConfig(
  propertyId: string,
  integrationId: string,
  config: { isEnabled: boolean; apiKey?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    const currentSettings = prop?.settings || {}
    const integrations = currentSettings.integrations || {}

    integrations[integrationId] = {
      ...(integrations[integrationId] || {}),
      isEnabled: config.isEnabled,
      apiKey: config.apiKey || integrations[integrationId]?.apiKey || '',
      updatedAt: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('properties')
      .update({
        settings: {
          ...currentSettings,
          integrations,
        },
      })
      .eq('id', propertyId)

    if (error) throw error

    revalidatePath('/settings/integrations')
    return { success: true }
  } catch (err: any) {
    console.error('saveIntegrationConfig error:', err)
    return { success: false, error: err.message || 'Failed to update integration' }
  }
}

/**
 * Get Notification Preferences
 */
export async function getNotificationPreferences(propertyId: string): Promise<NotificationSettingsData> {
  const defaults: NotificationSettingsData = {
    bookingConfirmation: true,
    preArrivalWelcome: true,
    checkoutFolioPdf: true,
    postStayReview: true,
    urgentMaintenanceAlert: true,
    vipArrivalAlert: true,
    lowInventoryAlert: true,
  }

  try {
    const supabase = await createClient()

    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    if (prop?.settings?.notifications) {
      return { ...defaults, ...prop.settings.notifications }
    }
    return defaults
  } catch (err) {
    console.error('getNotificationPreferences error:', err)
    return defaults
  }
}

/**
 * Save Notification Preferences
 */
export async function saveNotificationPreferences(
  propertyId: string,
  prefs: NotificationSettingsData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    const currentSettings = prop?.settings || {}

    const { error } = await supabase
      .from('properties')
      .update({
        settings: {
          ...currentSettings,
          notifications: prefs,
        },
      })
      .eq('id', propertyId)

    if (error) throw error

    revalidatePath('/settings/notifications')
    return { success: true }
  } catch (err: any) {
    console.error('saveNotificationPreferences error:', err)
    return { success: false, error: err.message || 'Failed to update notifications' }
  }
}

/**
 * Get Staff & Team Users
 */
export async function getPropertyUsers(propertyId: string): Promise<PropertyUserItem[]> {
  try {
    const supabase = await createClient()

    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, phone, role, is_active, created_at, departments(name)')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (employees || []).map((e: any) => ({
      id: e.id,
      fullName: `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Staff Member',
      email: e.email || '',
      phone: e.phone,
      role: e.role || 'receptionist',
      department: e.departments?.name || 'General Operations',
      isActive: Boolean(e.is_active),
      createdAt: e.created_at,
    }))
  } catch (err) {
    console.error('getPropertyUsers error:', err)
    return []
  }
}

/**
 * Invite Staff Member
 */
export async function inviteStaffMember(
  propertyId: string,
  data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    role: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('employees').insert({
      property_id: propertyId,
      first_name: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      is_active: true,
      hire_date: new Date().toISOString().slice(0, 10),
    })

    if (error) throw error

    revalidatePath('/settings/users')
    revalidatePath('/employees')
    return { success: true }
  } catch (err: any) {
    console.error('inviteStaffMember error:', err)
    return { success: false, error: err.message || 'Failed to add staff member' }
  }
}

