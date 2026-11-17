-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- MIGRATION: 002_multi_tenant_signup_flow.sql (FIXED & BULLETPROOF)
-- ====================================================================

-- 1. Extend tenants table with username and status columns
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'inactive';

-- 2. Ensure RLS helper function allows authenticated user to read their own tenant
-- even when inactive (required so /onboarding can display tenant profile)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public, auth;

-- 3. Stored Procedure to atomically register tenant, property, and user
CREATE OR REPLACE FUNCTION public.handle_new_tenant_signup(
  p_user_id UUID,
  p_email VARCHAR,
  p_username VARCHAR,
  p_property_name VARCHAR,
  p_mobile_number VARCHAR,
  p_city VARCHAR,
  p_address TEXT,
  p_country VARCHAR DEFAULT 'India'
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_property_id UUID;
  v_yesterday TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Compute yesterday's date (expired by default)
  v_yesterday := (now() AT TIME ZONE 'UTC' - INTERVAL '1 day');

  -- 1. Check if user is already linked to a tenant
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = p_user_id
  LIMIT 1;

  -- 2. If not found, check if tenant with this email already exists
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id
    FROM public.tenants
    WHERE email = p_email
    LIMIT 1;
  END IF;

  -- 3. Insert or update tenant
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name,
      email,
      phone,
      address,
      city,
      country,
      username,
      status,
      subscription_plan,
      subscription_expires_at,
      is_active,
      settings
    )
    VALUES (
      COALESCE(NULLIF(p_property_name, ''), 'My Hotel'),
      p_email,
      COALESCE(p_mobile_number, ''),
      COALESCE(NULLIF(p_address, ''), 'Property Address'),
      COALESCE(NULLIF(p_city, ''), 'City'),
      COALESCE(NULLIF(p_country, ''), 'India'),
      COALESCE(p_username, split_part(p_email, '@', 1)),
      'inactive',
      'starter',
      v_yesterday,
      false,
      jsonb_build_object(
        'username', p_username,
        'mobile_number', p_mobile_number,
        'city', p_city,
        'address', p_address,
        'status', 'inactive',
        'is_active', false,
        'subscription_expires_at', v_yesterday
      )
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      username = EXCLUDED.username,
      status = 'inactive',
      is_active = false,
      subscription_expires_at = EXCLUDED.subscription_expires_at
    RETURNING id INTO v_tenant_id;
  END IF;

  -- Fallback if still null
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE email = p_email LIMIT 1;
  END IF;

  -- 4. Link user to tenant as hotel_owner
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.tenant_users (
      tenant_id,
      user_id,
      role,
      is_active
    )
    VALUES (
      v_tenant_id,
      p_user_id,
      'hotel_owner'::public.user_role,
      false
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING;

    -- 5. Create Default Property if none exists
    SELECT id INTO v_property_id
    FROM public.properties
    WHERE tenant_id = v_tenant_id
    LIMIT 1;

    IF v_property_id IS NULL THEN
      INSERT INTO public.properties (
        tenant_id,
        name,
        property_type,
        address,
        city,
        country,
        phone,
        email,
        currency,
        timezone,
        is_active
      )
      VALUES (
        v_tenant_id,
        COALESCE(NULLIF(p_property_name, ''), 'My Hotel'),
        'hotel'::public.property_type,
        COALESCE(NULLIF(p_address, ''), 'Property Address'),
        COALESCE(NULLIF(p_city, ''), 'City'),
        COALESCE(NULLIF(p_country, ''), 'India'),
        COALESCE(p_mobile_number, ''),
        p_email,
        'INR',
        'Asia/Kolkata',
        false
      )
      RETURNING id INTO v_property_id;
    END IF;

    -- 6. Link user to property
    IF v_property_id IS NOT NULL THEN
      INSERT INTO public.property_users (
        property_id,
        user_id,
        role,
        is_active
      )
      VALUES (
        v_property_id,
        p_user_id,
        'hotel_owner'::public.user_role,
        false
      )
      ON CONFLICT (property_id, user_id) DO NOTHING;
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'property_id', v_property_id,
    'property_name', p_property_name,
    'username', p_username,
    'email', p_email,
    'mobile_number', p_mobile_number,
    'city', p_city,
    'address', p_address,
    'is_active', false,
    'subscription_expires_at', v_yesterday
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Never throw fatal error that aborts user creation in auth.users
    RAISE WARNING 'handle_new_tenant_signup caught error: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- 4. Auth Hook / Trigger on auth.users with safe error catching
CREATE OR REPLACE FUNCTION public.handle_auth_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_meta JSONB;
BEGIN
  v_meta := NEW.raw_user_meta_data;
  IF v_meta IS NOT NULL AND v_meta ? 'property_name' THEN
    PERFORM public.handle_new_tenant_signup(
      NEW.id,
      NEW.email,
      COALESCE(v_meta->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(v_meta->>'property_name', 'My Hotel'),
      COALESCE(v_meta->>'mobile_number', ''),
      COALESCE(v_meta->>'city', ''),
      COALESCE(v_meta->>'address', ''),
      COALESCE(v_meta->>'country', 'India')
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logging error without failing the auth transaction
    RAISE WARNING 'handle_auth_user_signup trigger caught error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- 5. Re-create the trigger safely
DROP TRIGGER IF EXISTS trg_auth_user_signup ON auth.users;
CREATE TRIGGER trg_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_signup();
