'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resolves the authenticated tenant ID for the current session.
 * Uses hierarchical lookup:
 * 1. tenant_users mapping table (via admin client to ensure reliable resolution)
 * 2. user.user_metadata.tenant_id
 * 3. email match in tenants table (with self-healing upsert into tenant_users)
 * 4. property_users -> properties(tenant_id)
 */
export async function getAuthenticatedTenantId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = createAdminClient()

    // 1. Direct check in tenant_users
    const { data: tu } = await admin
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (tu?.tenant_id) {
      return tu.tenant_id
    }

    // 2. Check user metadata
    const metaTenantId = user.user_metadata?.tenant_id
    if (metaTenantId) {
      // Self-heal: link user to tenant_users
      try {
        await admin.from('tenant_users').upsert({
          user_id: user.id,
          tenant_id: metaTenantId,
          role: 'owner',
        }, { onConflict: 'user_id,tenant_id' })
      } catch {}
      return metaTenantId
    }

    // 3. Fallback search tenants by email
    if (user.email) {
      const { data: tenant } = await admin
        .from('tenants')
        .select('id')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle()

      if (tenant?.id) {
        // Self-heal: link user to tenant_users
        try {
          await admin.from('tenant_users').upsert({
            user_id: user.id,
            tenant_id: tenant.id,
            role: 'owner',
          }, { onConflict: 'user_id,tenant_id' })
        } catch {}
        return tenant.id
      }
    }

    // 4. Fallback search property_users -> properties(tenant_id)
    const { data: pu } = await admin
      .from('property_users')
      .select('properties(tenant_id)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const propTenantId = (pu as any)?.properties?.tenant_id
    if (propTenantId) {
      try {
        await admin.from('tenant_users').upsert({
          user_id: user.id,
          tenant_id: propTenantId,
          role: 'owner',
        }, { onConflict: 'user_id,tenant_id' })
      } catch {}
      return propTenantId
    }

    return null
  } catch (err) {
    console.error('getAuthenticatedTenantId error:', err)
    return null
  }
}

/**
 * Returns all property IDs belonging strictly to the authenticated tenant.
 */
export async function getTenantPropertyIds(): Promise<string[]> {
  try {
    const tenantId = await getAuthenticatedTenantId()
    if (!tenantId) return []

    const admin = createAdminClient()
    const { data: props, error } = await admin
      .from('properties')
      .select('id')
      .eq('tenant_id', tenantId)

    if (error || !props) return []
    return props.map((p: any) => p.id)
  } catch (err) {
    console.error('getTenantPropertyIds error:', err)
    return []
  }
}

/**
 * Validates requested propertyId against the tenant's properties,
 * or returns the tenant's primary/first property.
 * Returns null if tenant has no properties registered yet.
 */
export async function getActiveTenantPropertyId(requestedPropertyId?: string): Promise<string | null> {
  const allowedIds = await getTenantPropertyIds()
  if (allowedIds.length === 0) return null

  if (requestedPropertyId && allowedIds.includes(requestedPropertyId)) {
    return requestedPropertyId
  }

  return allowedIds[0] || null
}

/**
 * Verifies if a specific property belongs strictly to the authenticated tenant.
 */
export async function verifyPropertyOwnership(propertyId: string): Promise<boolean> {
  if (!propertyId) return false
  const allowedIds = await getTenantPropertyIds()
  return allowedIds.includes(propertyId)
}
