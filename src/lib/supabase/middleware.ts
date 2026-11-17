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
    let isActive =
      user.user_metadata?.is_active === true ||
      user.user_metadata?.status === 'active'

    let rawExpiry =
      user.user_metadata?.subscription_expires_at ||
      user.user_metadata?.expiry_date

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
    } catch {
      // Use metadata if query fails
    }

    let isExpired = true
    if (rawExpiry) {
      const exp = new Date(rawExpiry)
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
