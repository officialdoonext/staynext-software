-- ====================================================================
-- STAYNEXT HOTEL, LODGE & RESORT MANAGEMENT SAAS
-- COMPLETE POSTGRESQL SCHEMA FOR SUPABASE
-- MIGRATION: 001_initial_schema.sql
-- ====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ====================================================================
-- 1. CUSTOM ENUMS
-- ====================================================================

CREATE TYPE property_type AS ENUM (
  'hotel',
  'lodge',
  'resort',
  'guest_house',
  'service_apartment'
);

CREATE TYPE room_status AS ENUM (
  'available',
  'occupied',
  'reserved',
  'dirty',
  'cleaning',
  'maintenance',
  'out_of_order'
);

CREATE TYPE reservation_status AS ENUM (
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'partial',
  'paid',
  'refunded',
  'failed'
);

CREATE TYPE booking_source AS ENUM (
  'direct',
  'walk_in',
  'website',
  'phone',
  'travel_agent',
  'ota',
  'other'
);

CREATE TYPE user_role AS ENUM (
  'hotel_owner',
  'property_manager',
  'general_manager',
  'receptionist',
  'accountant',
  'housekeeping_manager',
  'housekeeping_staff',
  'maintenance_staff',
  'restaurant_manager',
  'custom'
);

CREATE TYPE meal_plan AS ENUM (
  'ep', -- European Plan (Room Only)
  'cp', -- Continental Plan (Breakfast Included)
  'map', -- Modified American Plan (Half Board: Breakfast + Dinner)
  'ap', -- American Plan (Full Board: All Meals)
  'ai'  -- All Inclusive
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE housekeeping_status AS ENUM ('pending', 'in_progress', 'completed', 'awaiting_inspection', 'skipped');
CREATE TYPE maintenance_status AS ENUM ('open', 'in_progress', 'on_hold', 'resolved', 'closed');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- ====================================================================
-- 2. TRIGGER HELPER FOR updated_at
-- ====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. TENANTS (Multi-Tenant Organization Core)
-- ====================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'trial',
  subscription_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 4. TENANT USERS (User <-> Tenant Mapping & Global Role)
-- ====================================================================

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'receptionist',
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);

-- ====================================================================
-- 5. PROPERTIES
-- ====================================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  property_type property_type NOT NULL DEFAULT 'hotel',
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  check_in_time TIME NOT NULL DEFAULT '14:00',
  check_out_time TIME NOT NULL DEFAULT '11:00',
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- User access rights per individual property
CREATE TABLE property_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, user_id)
);

CREATE INDEX idx_property_users_prop_user ON property_users(property_id, user_id);

-- ====================================================================
-- 6. BUILDINGS & FLOORS
-- ====================================================================

CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_buildings_property ON buildings(property_id);

CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  floor_number INTEGER NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_floors_property ON floors(property_id);

-- ====================================================================
-- 7. ROOM TYPES & AMENITIES
-- ====================================================================

CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  base_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  bed_type VARCHAR(100),
  size_sqft NUMERIC(8, 2),
  total_rooms INTEGER NOT NULL DEFAULT 0,
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_types_property ON room_types(property_id);
CREATE TRIGGER trg_room_types_updated_at BEFORE UPDATE ON room_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE room_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  category VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_type_amenities (
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES room_amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

-- ====================================================================
-- 8. ROOMS INVENTORY
-- ====================================================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  status room_status NOT NULL DEFAULT 'available',
  is_smoking BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, room_number)
);

CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_type ON rooms(room_type_id);
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 9. GUESTS CRM
-- ====================================================================

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  nationality VARCHAR(100),
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  is_vip BOOLEAN NOT NULL DEFAULT false,
  vip_tier VARCHAR(50) DEFAULT 'Standard',
  blacklisted BOOLEAN NOT NULL DEFAULT false,
  blacklist_reason TEXT,
  preferences TEXT,
  total_stays INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guests_tenant ON guests(tenant_id);
CREATE INDEX idx_guests_name ON guests(last_name, first_name);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_email ON guests(email);
CREATE TRIGGER trg_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 10. RATE PLANS & ROOM RATES
-- ====================================================================

CREATE TABLE rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  meal_plan meal_plan NOT NULL DEFAULT 'ep',
  cancellation_policy TEXT,
  is_refundable BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_plans_property ON rate_plans(property_id);

CREATE TABLE room_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  rate_plan_id UUID NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  rate_date DATE NOT NULL,
  rate_amount NUMERIC(10, 2) NOT NULL,
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_type_id, rate_plan_id, rate_date)
);

CREATE INDEX idx_room_rates_lookup ON room_rates(room_type_id, rate_date);

-- ====================================================================
-- 11. RESERVATIONS
-- ====================================================================

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number VARCHAR(50) UNIQUE NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  rate_plan_id UUID REFERENCES rate_plans(id) ON DELETE SET NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_adults INTEGER NOT NULL DEFAULT 1,
  num_children INTEGER NOT NULL DEFAULT 0,
  status reservation_status NOT NULL DEFAULT 'pending',
  booking_source booking_source NOT NULL DEFAULT 'direct',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX idx_reservations_prop ON reservations(property_id);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE TRIGGER trg_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 12. RESERVATION ROOMS ALLOCATION & CONFLICT EXCLUSION
-- Business logic: Room cannot be allocated to two active reservations with overlapping dates.
-- Using PostgreSQL daterange with check-in inclusive [ and check-out exclusive )
-- ====================================================================

CREATE TABLE reservation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  rate_per_night NUMERIC(10, 2) NOT NULL,
  stay_range DATERANGE GENERATED ALWAYS AS (daterange(check_in_date, check_out_date, '[)')) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_res_room_dates CHECK (check_out_date > check_in_date),
  -- Database engine level conflict prevention:
  EXCLUDE USING gist (
    room_id WITH =,
    stay_range WITH &&
  ) WHERE (is_active = true)
);

CREATE INDEX idx_res_rooms_room ON reservation_rooms(room_id);
CREATE INDEX idx_res_rooms_res ON reservation_rooms(reservation_id);

CREATE TABLE reservation_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reservation_id, guest_id)
);

-- ====================================================================
-- 13. GUEST FOLIOS, CHARGES & PAYMENTS
-- ====================================================================

CREATE TABLE guest_folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  folio_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'settled'
  total_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_payments NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  balance NUMERIC(10, 2) GENERATED ALWAYS AS (total_charges - total_payments) STORED,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_folios_res ON guest_folios(reservation_id);
CREATE INDEX idx_folios_prop ON guest_folios(property_id);
CREATE TRIGGER trg_folios_updated_at BEFORE UPDATE ON guest_folios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE folio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID NOT NULL REFERENCES guest_folios(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'room_charge', 'f_and_b', 'tax', 'service', 'discount'
  quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  item_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_void BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_folio_items_folio ON folio_items(folio_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID REFERENCES guest_folios(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'card', 'cash', 'bank_transfer', 'stripe', 'pos'
  payment_reference VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_res ON payments(reservation_id);
CREATE INDEX idx_payments_prop ON payments(property_id);
CREATE INDEX idx_payments_folio ON payments(folio_id);
CREATE INDEX idx_payments_date ON payments(created_at);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  folio_id UUID REFERENCES guest_folios(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'issued', -- 'draft', 'issued', 'paid', 'void'
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_prop ON invoices(property_id);
CREATE INDEX idx_invoices_guest ON invoices(guest_id);

-- ====================================================================
-- 14. HOUSEKEEPING TASKS & WORKFLOWS
-- ====================================================================

CREATE TABLE housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- 'checkout_clean', 'stayover_service', 'deep_clean', 'inspection', 'turndown'
  status housekeeping_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  inspected_by UUID REFERENCES auth.users(id),
  inspected_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hk_tasks_prop ON housekeeping_tasks(property_id);
CREATE INDEX idx_hk_tasks_room ON housekeeping_tasks(room_id);
CREATE INDEX idx_hk_tasks_status ON housekeeping_tasks(status);
CREATE TRIGGER trg_hk_tasks_updated_at BEFORE UPDATE ON housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 15. MAINTENANCE REQUESTS
-- ====================================================================

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  status maintenance_status NOT NULL DEFAULT 'open',
  category VARCHAR(100),
  assigned_to UUID REFERENCES auth.users(id),
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  estimated_cost NUMERIC(10, 2),
  actual_cost NUMERIC(10, 2),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_prop ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE TRIGGER trg_maintenance_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 16. DEPARTMENTS & EMPLOYEES
-- ====================================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role user_role NOT NULL DEFAULT 'receptionist',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  hire_date DATE,
  salary NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 17. EXPENSES & CATEGORIES
-- ====================================================================

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50),
  vendor_name VARCHAR(255),
  receipt_url TEXT,
  status expense_status NOT NULL DEFAULT 'approved',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_prop ON expenses(property_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- 18. NOTIFICATIONS & AUDIT LOGS
-- ====================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  related_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);

-- ====================================================================
-- 19. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_type_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_property_access(p_property_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_users 
    WHERE user_id = auth.uid() AND property_id = p_property_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM tenant_users tu
    JOIN properties p ON p.tenant_id = tu.tenant_id
    WHERE tu.user_id = auth.uid() AND p.id = p_property_id 
    AND tu.is_active = true AND tu.role IN ('hotel_owner', 'property_manager', 'general_manager')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- RLS policies
CREATE POLICY "Tenants isolation" ON tenants FOR ALL USING (id = get_user_tenant_id());
CREATE POLICY "Tenant users isolation" ON tenant_users FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Properties isolation" ON properties FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Property users isolation" ON property_users FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Rooms isolation" ON rooms FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Room types isolation" ON room_types FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Guests isolation" ON guests FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Reservations isolation" ON reservations FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Reservation rooms isolation" ON reservation_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM reservations r WHERE r.id = reservation_id AND user_has_property_access(r.property_id))
);
CREATE POLICY "Guest folios isolation" ON guest_folios FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Folio items isolation" ON folio_items FOR ALL USING (
  EXISTS (SELECT 1 FROM guest_folios gf WHERE gf.id = folio_id AND user_has_property_access(gf.property_id))
);
CREATE POLICY "Payments isolation" ON payments FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Invoices isolation" ON invoices FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Housekeeping isolation" ON housekeeping_tasks FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Maintenance isolation" ON maintenance_requests FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Employees isolation" ON employees FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Expenses isolation" ON expenses FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Notifications isolation" ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Audit logs isolation" ON audit_logs FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Room amenities public" ON room_amenities FOR SELECT USING (true);
CREATE POLICY "Buildings isolation" ON buildings FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Floors isolation" ON floors FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Rate plans isolation" ON rate_plans FOR ALL USING (user_has_property_access(property_id));
CREATE POLICY "Room rates isolation" ON room_rates FOR ALL USING (user_has_property_access(property_id));

-- ====================================================================
-- 20. ATOMIC STORED FUNCTION: GUEST CHECKOUT & FOLIO SETTLEMENT
-- ====================================================================

CREATE OR REPLACE FUNCTION process_guest_checkout(p_reservation_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_res RECORD;
  v_folio RECORD;
  v_unpaid_balance NUMERIC(10,2);
BEGIN
  -- 1. Fetch reservation
  SELECT * INTO v_res FROM reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  -- 2. Fetch active guest folio
  SELECT * INTO v_folio FROM guest_folios WHERE reservation_id = p_reservation_id AND status = 'open' LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    v_unpaid_balance := v_folio.balance;
  ELSE
    v_unpaid_balance := 0.00;
  END IF;

  -- 3. Check-out reservation
  UPDATE reservations
  SET status = 'checked_out', checked_out_at = now(), updated_at = now()
  WHERE id = p_reservation_id;

  -- 4. Mark allocated room as dirty and schedule housekeeping deep clean
  UPDATE rooms
  SET status = 'dirty', updated_at = now()
  WHERE id IN (SELECT room_id FROM reservation_rooms WHERE reservation_id = p_reservation_id);

  -- 5. Auto-schedule housekeeping task
  INSERT INTO housekeeping_tasks (property_id, room_id, task_type, status, priority, notes)
  SELECT v_res.property_id, room_id, 'checkout_clean', 'pending', 'high', 'Immediate turnaround requested for incoming guest'
  FROM reservation_rooms WHERE reservation_id = p_reservation_id;

  -- 6. Deactivate active reservation_rooms to free room inventory
  UPDATE reservation_rooms
  SET is_active = false
  WHERE reservation_id = p_reservation_id;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'unpaid_balance', v_unpaid_balance,
    'status', 'checked_out'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

