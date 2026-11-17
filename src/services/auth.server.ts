'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  TenantProfile,
  getYesterdayIso,
  SignUpData,
  checkTenantAccess,
} from './auth.service'

/**
 * Server-side tenant profile retrieval for /onboarding and dashboard layout.
 */
export async function getServerTenantProfile(): Promise<TenantProfile | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const meta = user.user_metadata || {}

  let tenantRecord: any = null
  try {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .maybeSingle()

    tenantRecord = data
  } catch {
    // Database query failed
  }

  const propertyName = tenantRecord?.name || meta.property_name || 'My Hotel / Property'
  const mobileNumber = tenantRecord?.phone || meta.mobile_number || ''
  const username = tenantRecord?.username || meta.username || user.email?.split('@')[0] || ''
  const email = tenantRecord?.email || user.email || ''
  const city = tenantRecord?.city || meta.city || ''
  const address = tenantRecord?.address || meta.address || ''

  const rawExpiry =
    tenantRecord?.subscription_expires_at ||
    meta.subscription_expires_at ||
    meta.expiry_date ||
    getYesterdayIso()
  const expDate = new Date(rawExpiry)
  const isExpired = !isNaN(expDate.getTime()) ? expDate.getTime() < Date.now() : true

  const isActive = tenantRecord
    ? tenantRecord.is_active === true || tenantRecord.status === 'active'
    : meta.is_active === true || meta.status === 'active'

  return {
    id: tenantRecord?.id,
    propertyName,
    mobileNumber,
    username,
    email,
    city,
    address,
    status: isActive ? 'active' : 'inactive',
    isActive,
    expiryDate: rawExpiry,
    isExpired,
    subscriptionPlan: tenantRecord?.subscription_plan || 'trial',
  }
}

/**
 * Server Action: Registers a new tenant and sets status=inactive, expiry=yesterday.
 * Uses service role for database provisioning and sets auth cookies.
 */
export async function signUpTenantAction(payload: SignUpData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return {
      success: false,
      error: 'Supabase credentials are not configured in .env.local. Please check your configuration.',
    }
  }

  const yesterdayIso = getYesterdayIso()
  const supabase = await createServerClient()
  const admin = createAdminClient()

  try {
    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          username: payload.username,
          property_name: payload.propertyName,
          mobile_number: payload.mobileNumber,
          city: payload.city,
          address: payload.address,
          status: 'inactive',
          is_active: false,
          expiry_date: yesterdayIso,
          subscription_expires_at: yesterdayIso,
        },
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Registration failed. Please try again.' }
    }

    const userId = authData.user.id

    // 2. Auto-confirm email via admin client so user is not blocked by email verification
    try {
      await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: {
          username: payload.username,
          property_name: payload.propertyName,
          mobile_number: payload.mobileNumber,
          city: payload.city,
          address: payload.address,
          status: 'inactive',
          is_active: false,
          expiry_date: yesterdayIso,
          subscription_expires_at: yesterdayIso,
        },
      })
    } catch {
      // Continue even if admin update is not permitted
    }

    // 3. Provision tenant in Supabase Database tables using admin client (bypasses RLS)
    try {
      let tenantId: string | undefined

      // Check if tenant was already provisioned by trigger
      const { data: existingTenant } = await admin
        .from('tenants')
        .select('id')
        .eq('email', payload.email)
        .maybeSingle()

      if (existingTenant?.id) {
        tenantId = existingTenant.id
      } else {
        const { data: newTenant } = await admin
          .from('tenants')
          .insert({
            name: payload.propertyName,
            email: payload.email,
            phone: payload.mobileNumber,
            address: payload.address,
            city: payload.city,
            country: 'India',
            username: payload.username,
            status: 'inactive',
            is_active: false,
            subscription_expires_at: yesterdayIso,
          })
          .select('id')
          .maybeSingle()

        tenantId = newTenant?.id
      }

      if (tenantId) {
        await admin.from('tenant_users').upsert(
          {
            tenant_id: tenantId,
            user_id: userId,
            role: 'hotel_owner',
            is_active: false,
          },
          { onConflict: 'tenant_id,user_id' }
        )

        const { data: existingProp } = await admin
          .from('properties')
          .select('id')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        let propId = existingProp?.id

        if (!propId) {
          const { data: newProp } = await admin
            .from('properties')
            .insert({
              tenant_id: tenantId,
              name: payload.propertyName,
              address: payload.address,
              city: payload.city,
              country: 'India',
              phone: payload.mobileNumber,
              email: payload.email,
              is_active: false,
            })
            .select('id')
            .maybeSingle()

          propId = newProp?.id
        }

        if (propId) {
          await admin.from('property_users').upsert(
            {
              property_id: propId,
              user_id: userId,
              role: 'hotel_owner',
              is_active: false,
            },
            { onConflict: 'property_id,user_id' }
          )
        }
      }
    } catch (dbErr) {
      console.warn('Database provisioning warning in server action:', dbErr)
    }

    // 4. Ensure session cookie is created
    if (!authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        })
      } catch {}
    }

    return {
      success: true,
      redirectTo: '/onboarding',
      access: {
        isAllowed: false,
        reason: 'both' as const,
        isActive: false,
        isExpired: true,
        expiryDate: yesterdayIso,
        status: 'inactive' as const,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error:
        err.message ||
        'Network error connecting to Supabase. Please verify connection.',
    }
  }
}

/**
 * Server Action: Authenticates a tenant using email or username.
 * Sets session cookies and returns access check.
 */
export async function signInTenantAction(identifier: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return {
      success: false,
      error: 'Supabase credentials are not configured in .env.local. Please check your configuration.',
    }
  }

  const supabase = await createServerClient()
  const admin = createAdminClient()
  let email = identifier.trim()

  if (!email.includes('@')) {
    try {
      const { data: tenantData } = await admin
        .from('tenants')
        .select('email')
        .eq('username', email)
        .maybeSingle()

      if (tenantData?.email) {
        email = tenantData.email
      }
    } catch {}
  }

  try {
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Authentication failed.' }
    }

    const meta = authData.user.user_metadata || {}
    let isActive = meta.is_active === true || meta.status === 'active'
    let rawExpiry = meta.subscription_expires_at || meta.expiry_date

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('status, is_active, subscription_expires_at')
        .maybeSingle()

      if (tenant) {
        isActive = tenant.is_active === true || tenant.status === 'active'
        if (tenant.subscription_expires_at) {
          rawExpiry = tenant.subscription_expires_at
        }
      }
    } catch {}

    const access = checkTenantAccess({
      is_active: isActive,
      subscription_expires_at: rawExpiry,
    })

    return {
      success: true,
      access,
      redirectTo: access.isAllowed ? '/dashboard' : '/onboarding',
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Authentication error. Please try again.',
    }
  }
}
