-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- MIGRATION: 006_allowed_properties_count.sql
-- Description: Adds allowed_properties_count to tenants table and
-- enforces property limits per tenant via database triggers.
-- ====================================================================

-- 1. Add allowed_properties_count column to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS allowed_properties_count INT NOT NULL DEFAULT 1;

-- 2. Trigger function to enforce property limit per tenant
CREATE OR REPLACE FUNCTION public.check_tenant_property_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_allowed INT;
  v_current INT;
BEGIN
  -- Fetch allowed properties count for the tenant (defaults to 1 if not set)
  SELECT COALESCE(allowed_properties_count, 1) INTO v_allowed
  FROM public.tenants
  WHERE id = NEW.tenant_id;

  IF v_allowed IS NULL THEN
    v_allowed := 1;
  END IF;

  -- Count existing properties for this tenant
  SELECT COUNT(*) INTO v_current
  FROM public.properties
  WHERE tenant_id = NEW.tenant_id;

  -- Block insertion if tenant has reached or exceeded their limit
  IF v_current >= v_allowed THEN
    RAISE EXCEPTION 'Property limit reached. Your tenant plan allows a maximum of % property(ies). Current active count: %', v_allowed, v_current;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to properties table BEFORE INSERT
DROP TRIGGER IF EXISTS trg_check_tenant_property_limit ON public.properties;
CREATE TRIGGER trg_check_tenant_property_limit
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tenant_property_limit();

