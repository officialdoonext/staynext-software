import { createClient as createBrowserClient } from '@/lib/supabase/client'

export interface SignUpData {
  propertyName: string
  mobileNumber: string
  username: string
  email: string
  password: string
  city: string
  address: string
}

export interface TenantProfile {
  id?: string
  propertyName: string
  mobileNumber: string
  username: string
  email: string
  city: string
  address: string
  status: 'active' | 'inactive'
  isActive: boolean
  expiryDate: string
  isExpired: boolean
  subscriptionPlan?: string
}

export interface AccessCheckResult {
  isAllowed: boolean
  reason?: 'inactive' | 'expired' | 'both'
  isActive: boolean
  isExpired: boolean
  expiryDate?: string
  status: 'active' | 'inactive'
}

/**
 * Validates tenant active status and expiration date.
 * Rule: Access is granted ONLY IF status is active AND expiry date is in the future.
 */
export function checkTenantAccess(data: {
  is_active?: boolean | null
  status?: string | null
  subscription_expires_at?: string | null
  expiry_date?: string | null
}): AccessCheckResult {
  const isActive = data.is_active === true || data.status === 'active'

  const rawExpiry = data.subscription_expires_at || data.expiry_date
  let isExpired = true
  const expiryDate = rawExpiry || ''

  if (rawExpiry) {
    const exp = new Date(rawExpiry)
    if (!isNaN(exp.getTime())) {
      isExpired = exp.getTime() < Date.now()
    }
  }

  const isAllowed = isActive && !isExpired

  let reason: 'inactive' | 'expired' | 'both' | undefined
  if (!isActive && isExpired) {
    reason = 'both'
  } else if (!isActive) {
    reason = 'inactive'
  } else if (isExpired) {
    reason = 'expired'
  }

  return {
    isAllowed,
    reason,
    isActive,
    isExpired,
    expiryDate,
    status: isActive ? 'active' : 'inactive',
  }
}

/**
 * Calculates yesterday's date in ISO format.
 */
export function getYesterdayIso(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString()
}

/**
 * Signs up a new tenant:
 * - Property Name, Mobile Number, Username, Password, City, Address, Email
 * - Default expiry date: yesterday's date
 * - Default status: inactive
 */
export async function signUpTenant(payload: SignUpData) {
  const yesterdayIso = getYesterdayIso()
  const supabase = createBrowserClient()

  // 1. Sign up user in Supabase Auth with metadata
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
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error('Registration could not be completed. Please try again.')
  }

  // 2. Provision tenant in Supabase Database tables
  try {
    const { error: rpcError } = await supabase.rpc('handle_new_tenant_signup', {
      p_user_id: authData.user.id,
      p_email: payload.email,
      p_username: payload.username,
      p_property_name: payload.propertyName,
      p_mobile_number: payload.mobileNumber,
      p_city: payload.city,
      p_address: payload.address,
      p_country: 'India',
    })

    if (rpcError) {
      // Direct insertion fallback via client if RPC is not installed
      const { data: tenant, error: tenantError } = await supabase
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

      if (!tenantError && tenant) {
        await supabase.from('tenant_users').insert({
          tenant_id: tenant.id,
          user_id: authData.user.id,
          role: 'hotel_owner',
          is_active: false,
        })

        const { data: property } = await supabase
          .from('properties')
          .insert({
            tenant_id: tenant.id,
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

        if (property) {
          await supabase.from('property_users').insert({
            property_id: property.id,
            user_id: authData.user.id,
            role: 'hotel_owner',
            is_active: false,
          })
        }
      }
    }
  } catch (err) {
    // If DB insert fails (e.g. pending email confirmation or network), metadata is already safe
    console.warn('Tenant DB provisioning warning:', err)
  }

  // Because expiry date is yesterday and status is inactive, access to software is blocked!
  return {
    success: true,
    user: authData.user,
    session: authData.session,
    access: {
      isAllowed: false,
      reason: 'both' as const,
      isActive: false,
      isExpired: true,
      expiryDate: yesterdayIso,
      status: 'inactive' as const,
    },
    redirectTo: '/onboarding',
  }
}

/**
 * Signs in a tenant using email or username:
 * - Checks status and expiry date
 * - If active and not expired -> /dashboard
 * - Otherwise -> /onboarding
 */
export async function signInTenant(identifier: string, password: string) {
  const supabase = createBrowserClient()
  let email = identifier.trim()

  // If identifier does not contain '@', attempt to resolve username to email
  if (!email.includes('@')) {
    try {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('email')
        .eq('username', email)
        .maybeSingle()

      if (tenantData?.email) {
        email = tenantData.email
      }
    } catch {
      // Continue with entered identifier
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error('Authentication failed.')
  }

  // Check access status
  const access = await checkUserAccess(authData.user)

  return {
    success: true,
    user: authData.user,
    session: authData.session,
    access,
    redirectTo: access.isAllowed ? '/dashboard' : '/onboarding',
  }
}

/**
 * Checks access for a Supabase user by querying tenant record or metadata.
 */
export async function checkUserAccess(user: any): Promise<AccessCheckResult> {
  const meta = user.user_metadata || {}

  try {
    const supabase = createBrowserClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status, is_active, subscription_expires_at')
      .maybeSingle()

    if (tenant) {
      return checkTenantAccess({
        is_active: tenant.is_active,
        status: tenant.status,
        subscription_expires_at: tenant.subscription_expires_at,
      })
    }
  } catch {
    // Fall back to user_metadata
  }

  return checkTenantAccess({
    is_active: meta.is_active,
    status: meta.status,
    subscription_expires_at: meta.subscription_expires_at || meta.expiry_date,
    expiry_date: meta.expiry_date,
  })
}
