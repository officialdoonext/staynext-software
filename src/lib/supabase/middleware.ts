import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const { pathname } = request.nextUrl
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p))
  const isPublicGuestPath = pathname.startsWith('/guest')
  const isOnboardingPath = pathname.startsWith('/onboarding')

  // If public guest self-service portal, allow access without staff auth
  if (isPublicGuestPath) {
    return supabaseResponse
  }

  // If Supabase credentials are not configured yet
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    // If accessing root, send to login
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1. Unauthenticated requests
    if (!user) {
      if (!isAuthPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // 2. Authenticated user: Check tenant status & expiry
    const meta = user.user_metadata || {}
    let tenantRecord: any = null

    try {
      if (meta.tenant_id) {
        const { data: t } = await supabase
          .from('tenants')
          .select('id, status, is_active, subscription_expires_at, expiry_date')
          .eq('id', meta.tenant_id)
          .maybeSingle()
        if (t) tenantRecord = t
      }

      if (!tenantRecord && user.email) {
        const { data: t } = await supabase
          .from('tenants')
          .select('id, status, is_active, subscription_expires_at, expiry_date')
          .ilike('email', user.email.trim())
          .maybeSingle()
        if (t) tenantRecord = t
      }

      if (!tenantRecord && meta.username) {
        const { data: t } = await supabase
          .from('tenants')
          .select('id, status, is_active, subscription_expires_at, expiry_date')
          .ilike('username', meta.username.trim())
          .maybeSingle()
        if (t) tenantRecord = t
      }
    } catch {
      // Use metadata if query fails
    }

    const statusStr = String(tenantRecord?.status || meta.status || '').toLowerCase().trim()
    const rawIsActive = tenantRecord?.is_active !== undefined ? tenantRecord.is_active : meta.is_active
    const isStatusActive =
      statusStr === 'active' ||
      statusStr === 'approved' ||
      statusStr === 'trial' ||
      statusStr === 'enabled' ||
      statusStr === 'valid' ||
      statusStr === 'paid'

    const isFlagActive =
      rawIsActive === true ||
      rawIsActive === 'true' ||
      rawIsActive === 1 ||
      rawIsActive === '1'

    const isExplicitlyInactive =
      rawIsActive === false ||
      rawIsActive === 'false' ||
      rawIsActive === 0 ||
      rawIsActive === '0' ||
      statusStr === 'inactive' ||
      statusStr === 'suspended' ||
      statusStr === 'blocked' ||
      statusStr === 'cancelled' ||
      statusStr === 'expired'

    const isActive = isFlagActive || isStatusActive || (!isExplicitlyInactive && Boolean(statusStr))

    const rawExpiry =
      tenantRecord?.subscription_expires_at ||
      tenantRecord?.expiry_date ||
      meta.subscription_expires_at ||
      meta.expiry_date

    let isExpired = true
    if (rawExpiry) {
      const strExpiry = String(rawExpiry).trim()
      let exp: Date
      if (/^\d{4}-\d{2}-\d{2}$/.test(strExpiry)) {
        exp = new Date(`${strExpiry}T23:59:59.999Z`)
      } else {
        exp = new Date(strExpiry)
      }
      if (!isNaN(exp.getTime())) {
        isExpired = exp.getTime() < Date.now()
      }
    }

    const isAllowed = isActive && !isExpired

    // 3. User is inactive or subscription expired -> BLOCK SOFTWARE ACCESS!
    if (!isAllowed) {
      if (!isOnboardingPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // 4. User is active and valid
    if (isAuthPath || isOnboardingPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch {
    return supabaseResponse
  }

  return supabaseResponse
}
