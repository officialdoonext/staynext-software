'use server'

import '@/lib/dns-init'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  TenantProfile,
  getYesterdayIso,
  SignUpData,
  checkTenantAccess,
} from './auth.service'

/**
 * Robust hierarchical lookup to find the tenant record for a user.
 * Bypasses RLS using the admin client.
 */
async function lookupTenantRecord(
  admin: any,
  user: { id: string; email?: string | null; user_metadata?: any },
  identifier?: string
): Promise<any | null> {
  const meta = user.user_metadata || {}

  try {
    // 1. Fetch via tenant_users mapping
    if (user.id) {
      const { data: mapping } = await admin
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (mapping?.tenant_id) {
        const { data: tenant } = await admin
          .from('tenants')
          .select('*')
          .eq('id', mapping.tenant_id)
          .maybeSingle()

        if (tenant) return tenant
      }
    }

    // 2. Fetch via user_metadata tenant_id
    if (meta.tenant_id) {
      const { data: tenant } = await admin
        .from('tenants')
        .select('*')
        .eq('id', meta.tenant_id)
        .maybeSingle()

      if (tenant) return tenant
    }

    // 3. Fallback search by email (case-insensitive)
    const emailToSearch = user.email || (identifier && identifier.includes('@') ? identifier : null)
    if (emailToSearch) {
      const { data: tenant } = await admin
        .from('tenants')
        .select('*')
        .ilike('email', emailToSearch.trim())
        .maybeSingle()

      if (tenant) return tenant
    }

    // 4. Fallback search by username (case-insensitive)
    const usernameToSearch =
      meta.username ||
      (identifier && !identifier.includes('@') ? identifier : null) ||
      (user.email ? user.email.split('@')[0] : null)
    if (usernameToSearch) {
      const { data: tenant } = await admin
        .from('tenants')
        .select('*')
        .ilike('username', usernameToSearch.trim())
        .maybeSingle()

      if (tenant) return tenant
    }

    // 5. Fallback via property_users -> properties
    if (user.id) {
      const { data: propUser } = await admin
        .from('property_users')
        .select('property_id, properties(tenant_id)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      const propTenantId = (propUser as any)?.properties?.tenant_id
      if (propTenantId) {
        const { data: tenant } = await admin
          .from('tenants')
          .select('*')
          .eq('id', propTenantId)
          .maybeSingle()

        if (tenant) return tenant
      }
    }
  } catch (err) {
    console.warn('Error during lookupTenantRecord:', err)
  }

  return null
}

/**
 * Server-side tenant profile retrieval for /onboarding and dashboard layout.
 */
export async function getServerTenantProfile(): Promise<TenantProfile | null> {
  const supabase = await createServerClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const meta = user.user_metadata || {}
  const tenantRecord = await lookupTenantRecord(admin, user)

  const propertyName =
    tenantRecord?.name || meta.property_name || 'My Hotel / Property'
  const mobileNumber = tenantRecord?.phone || meta.mobile_number || ''
  const username =
    tenantRecord?.username ||
    meta.username ||
    user.email?.split('@')[0] ||
    ''
  const email = tenantRecord?.email || user.email || ''
  const city = tenantRecord?.city || meta.city || ''
  const address = tenantRecord?.address || meta.address || ''

  const rawExpiry =
    tenantRecord?.subscription_expires_at ||
    tenantRecord?.expiry_date ||
    meta.subscription_expires_at ||
    meta.expiry_date ||
    getYesterdayIso()

  const access = checkTenantAccess({
    is_active: tenantRecord?.is_active ?? meta.is_active,
    status: tenantRecord?.status ?? meta.status,
    subscription_expires_at: tenantRecord?.subscription_expires_at ?? meta.subscription_expires_at,
    expiry_date: tenantRecord?.expiry_date ?? meta.expiry_date,
  })

  // Synchronize and self-heal tenant_users and auth user_metadata if tenant is found
  if (tenantRecord?.id && user.id) {
    try {
      await admin.from('tenant_users').upsert(
        {
          tenant_id: tenantRecord.id,
          user_id: user.id,
          role: 'hotel_owner',
          is_active: access.isActive,
        },
        { onConflict: 'tenant_id,user_id' }
      )
    } catch {}

    try {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          tenant_id: tenantRecord.id,
          status: access.status,
          is_active: access.isActive,
          subscription_expires_at: access.expiryDate || rawExpiry,
          expiry_date: access.expiryDate || rawExpiry,
        },
      })
    } catch {}
  }

  return {
    id: tenantRecord?.id,
    propertyName,
    mobileNumber,
    username,
    email,
    city,
    address,
    status: access.status,
    isActive: access.isActive,
    expiryDate: access.expiryDate || rawExpiry,
    isExpired: access.isExpired,
    subscriptionPlan: tenantRecord?.subscription_plan || 'trial',
  }
}

/**
 * Server Action: Instantly re-checks tenant activation status and returns fresh profile.
 */
export async function refreshTenantStatusAction(): Promise<{
  success: boolean
  profile: TenantProfile | null
  isActivated: boolean
  error?: string
}> {
  try {
    const profile = await getServerTenantProfile()
    if (!profile) {
      return {
        success: false,
        profile: null,
        isActivated: false,
        error: 'User session not found. Please log in again.',
      }
    }

    const isActivated = profile.isActive && !profile.isExpired
    return {
      success: true,
      profile,
      isActivated,
    }
  } catch (err: any) {
    return {
      success: false,
      profile: null,
      isActivated: false,
      error: err.message || 'Error refreshing status.',
    }
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
        .ilike('username', email)
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
    const tenantRecord = await lookupTenantRecord(admin, authData.user, identifier)

    const access = checkTenantAccess({
      is_active: tenantRecord?.is_active ?? meta.is_active,
      status: tenantRecord?.status ?? meta.status,
      subscription_expires_at: tenantRecord?.subscription_expires_at ?? meta.subscription_expires_at,
      expiry_date: tenantRecord?.expiry_date ?? meta.expiry_date,
    })

    // Synchronize tenant_users and auth user_metadata if tenant is found
    if (tenantRecord?.id && authData.user.id) {
      try {
        await admin.from('tenant_users').upsert(
          {
            tenant_id: tenantRecord.id,
            user_id: authData.user.id,
            role: 'hotel_owner',
            is_active: access.isActive,
          },
          { onConflict: 'tenant_id,user_id' }
        )
      } catch {}

      try {
        await admin.auth.admin.updateUserById(authData.user.id, {
          user_metadata: {
            ...meta,
            tenant_id: tenantRecord.id,
            status: access.status,
            is_active: access.isActive,
            subscription_expires_at: access.expiryDate,
            expiry_date: access.expiryDate,
          },
        })
      } catch {}

      if (access.isActive) {
        try {
          await admin
            .from('properties')
            .update({ is_active: true })
            .eq('tenant_id', tenantRecord.id)

          await admin
            .from('property_users')
            .update({ is_active: true })
            .eq('user_id', authData.user.id)
        } catch {}
      }
    }

    return {
      success: true,
      access,
      redirectTo: access.isAllowed ? '/dashboard' : '/onboarding',
    }
  } catch (err: any) {
    const errorMsg = err?.message || ''
    if (errorMsg.includes('fetch failed') || errorMsg.includes('timeout') || errorMsg.includes('ConnectTimeoutError')) {
      return {
        success: false,
        error: 'Network connection to Supabase timed out. Please check your internet connection and try again.',
      }
    }
    return {
      success: false,
      error: errorMsg || 'Authentication error. Please try again.',
    }
  }
}
