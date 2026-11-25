'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string // WABA ID
  appId?: string
  webhookVerifyToken?: string
  isEnabled: boolean
  updatedAt?: string
}

export interface ImageKitConfig {
  publicKey: string
  privateKey: string
  urlEndpoint: string
  isEnabled: boolean
  updatedAt?: string
}

const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  accessToken: '',
  phoneNumberId: '',
  businessAccountId: '',
  appId: '',
  webhookVerifyToken: '',
  isEnabled: false,
}

const DEFAULT_IMAGEKIT_CONFIG: ImageKitConfig = {
  publicKey: '',
  privateKey: '',
  urlEndpoint: '',
  isEnabled: false,
}

/**
 * Fetch WhatsApp Integration Configuration
 */
export async function getWhatsAppConfig(propertyId: string): Promise<WhatsAppConfig> {
  try {
    const supabase = await createClient()

    // 1. Try dedicated table first
    const { data: row } = await supabase
      .from('property_integrations')
      .select('config, is_active')
      .eq('property_id', propertyId)
      .eq('provider', 'whatsapp')
      .maybeSingle()

    if (row && row.config) {
      return {
        ...DEFAULT_WHATSAPP_CONFIG,
        ...(row.config as any),
        isEnabled: row.is_active ?? row.config.isEnabled ?? false,
      }
    }

    // 2. Fallback to properties.settings.integrations.whatsapp
    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    const saved = prop?.settings?.integrations?.whatsapp
    if (saved) {
      return {
        ...DEFAULT_WHATSAPP_CONFIG,
        ...saved,
      }
    }

    return DEFAULT_WHATSAPP_CONFIG
  } catch (err) {
    console.error('getWhatsAppConfig error:', err)
    return DEFAULT_WHATSAPP_CONFIG
  }
}

/**
 * Save WhatsApp Integration Configuration
 */
export async function saveWhatsAppConfig(
  propertyId: string,
  config: WhatsAppConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const supabase = await createClient()
    const now = new Date().toISOString()

    const payload: WhatsAppConfig = {
      ...config,
      updatedAt: now,
    }

    // 1. Upsert in property_integrations table
    try {
      await admin.from('property_integrations').upsert(
        {
          property_id: propertyId,
          provider: 'whatsapp',
          config: payload,
          is_active: config.isEnabled,
          updated_at: now,
        },
        { onConflict: 'property_id,provider' }
      )
    } catch (tabErr) {
      console.warn('Upsert property_integrations whatsapp failed:', tabErr)
    }

    // 2. Also keep properties.settings.integrations.whatsapp synced
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('settings')
        .eq('id', propertyId)
        .single()

      const currentSettings = prop?.settings || {}
      const integrations = currentSettings.integrations || {}

      await admin
        .from('properties')
        .update({
          settings: {
            ...currentSettings,
            integrations: {
              ...integrations,
              whatsapp: payload,
            },
          },
        })
        .eq('id', propertyId)
    } catch (jsonErr) {
      console.warn('Sync properties.settings.integrations.whatsapp failed:', jsonErr)
    }

    revalidatePath('/settings/integrations')
    return { success: true }
  } catch (err: any) {
    console.error('saveWhatsAppConfig error:', err)
    return { success: false, error: err.message || 'Failed to save WhatsApp config' }
  }
}

/**
 * Fetch ImageKit Media Configuration
 */
export async function getImageKitConfig(propertyId: string): Promise<ImageKitConfig> {
  try {
    const supabase = await createClient()

    // 1. Try dedicated table first
    const { data: row } = await supabase
      .from('property_integrations')
      .select('config, is_active')
      .eq('property_id', propertyId)
      .eq('provider', 'imagekit')
      .maybeSingle()

    if (row && row.config) {
      return {
        ...DEFAULT_IMAGEKIT_CONFIG,
        ...(row.config as any),
        isEnabled: row.is_active ?? row.config.isEnabled ?? false,
      }
    }

    // 2. Fallback to properties.settings.integrations.imagekit
    const { data: prop } = await supabase
      .from('properties')
      .select('settings')
      .eq('id', propertyId)
      .single()

    const saved = prop?.settings?.integrations?.imagekit
    if (saved) {
      return {
        ...DEFAULT_IMAGEKIT_CONFIG,
        ...saved,
      }
    }

    return DEFAULT_IMAGEKIT_CONFIG
  } catch (err) {
    console.error('getImageKitConfig error:', err)
    return DEFAULT_IMAGEKIT_CONFIG
  }
}

/**
 * Save ImageKit Media Configuration
 */
export async function saveImageKitConfig(
  propertyId: string,
  config: ImageKitConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const supabase = await createClient()
    const now = new Date().toISOString()

    const payload: ImageKitConfig = {
      ...config,
      updatedAt: now,
    }

    // 1. Upsert in property_integrations table
    try {
      await admin.from('property_integrations').upsert(
        {
          property_id: propertyId,
          provider: 'imagekit',
          config: payload,
          is_active: config.isEnabled,
          updated_at: now,
        },
        { onConflict: 'property_id,provider' }
      )
    } catch (tabErr) {
      console.warn('Upsert property_integrations imagekit failed:', tabErr)
    }

    // 2. Also keep properties.settings.integrations.imagekit synced
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('settings')
        .eq('id', propertyId)
        .single()

      const currentSettings = prop?.settings || {}
      const integrations = currentSettings.integrations || {}

      await admin
        .from('properties')
        .update({
          settings: {
            ...currentSettings,
            integrations: {
              ...integrations,
              imagekit: payload,
            },
          },
        })
        .eq('id', propertyId)
    } catch (jsonErr) {
      console.warn('Sync properties.settings.integrations.imagekit failed:', jsonErr)
    }

    revalidatePath('/settings/integrations')
    return { success: true }
  } catch (err: any) {
    console.error('saveImageKitConfig error:', err)
    return { success: false, error: err.message || 'Failed to save ImageKit config' }
  }
}

/**
 * Upload an Image, Document, Audio, or Video directly to ImageKit using property credentials
 */
export async function uploadMediaToImageKit(
  propertyId: string,
  payload: {
    fileBase64: string // can be data URL or raw base64
    fileName: string
    folder?: string
    tags?: string[]
  }
): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
  try {
    const ikConfig = await getImageKitConfig(propertyId)

    if (!ikConfig.privateKey || !ikConfig.isEnabled) {
      return {
        success: false,
        error: 'ImageKit integration is not configured or disabled for this hotel property.',
      }
    }

    // Clean up base64 if it has data URL prefix (e.g. data:image/png;base64,...)
    let cleanBase64 = payload.fileBase64
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1]
    }

    // Prepare FormData for ImageKit REST API
    const formData = new FormData()
    formData.append('file', cleanBase64)
    formData.append('fileName', payload.fileName || `media_${Date.now()}`)
    formData.append('useUniqueFileName', 'true')
    formData.append('folder', payload.folder || '/staynext/guest_requests')

    if (payload.tags && payload.tags.length > 0) {
      formData.append('tags', payload.tags.join(','))
    }

    // Basic Auth with private key (ImageKit requires privateKey + ':')
    const authHeader = `Basic ${Buffer.from(`${ikConfig.privateKey}:`).toString('base64')}`

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok || !data.url) {
      const errMsg = data.message || data.error || 'Failed to upload media to ImageKit'
      console.error('ImageKit upload error response:', data)
      return { success: false, error: errMsg }
    }

    return {
      success: true,
      url: data.url,
      fileId: data.fileId,
    }
  } catch (err: any) {
    console.error('uploadMediaToImageKit error:', err)
    return { success: false, error: err.message || 'ImageKit upload network failure' }
  }
}

/**
 * Send a Live Test WhatsApp Message using configured credentials
 */
export async function testWhatsAppNotification(
  propertyId: string,
  testNumber: string,
  templateId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const waConfig = await getWhatsAppConfig(propertyId)

    if (!waConfig.accessToken || !waConfig.phoneNumberId) {
      return {
        success: false,
        error: 'WhatsApp Access Token and Phone Number ID must be configured and saved first.',
      }
    }

    // Format phone number (remove spaces, +, hyphens)
    const formattedPhone = testNumber.replace(/\D/g, '')

    let requestBody: any

    if (templateId && templateId.trim()) {
      // Send template message
      requestBody = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateId.trim(),
          language: { code: 'en' },
        },
      }
    } else {
      // Send direct text message
      requestBody = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: `🔔 *StayNext Test Alert*\n\nThis is a test notification from StayNext Hotel PMS verifying your WhatsApp Business API connection. Everything is working correctly!`,
        },
      }
    }

    const apiUrl = `https://graph.facebook.com/v21.0/${waConfig.phoneNumberId}/messages`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || 'Meta Cloud API rejected the message'
      return { success: false, error: errMsg }
    }

    const msgId = data.messages?.[0]?.id || 'WA-SENT'
    return { success: true, messageId: msgId }
  } catch (err: any) {
    return { success: false, error: err.message || 'WhatsApp API request failed' }
  }
}
