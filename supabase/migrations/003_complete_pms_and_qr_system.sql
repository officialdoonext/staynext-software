-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- MIGRATION: 003_complete_pms_and_qr_system.sql
-- Description: Adds Room Blocks, Room QR Codes, Guest Self-Service,
--              Restaurant POS, Inventory, Corporate Accounts, Tax Rates
-- ====================================================================

-- 1. Extend properties table with tax, registration, and coordinates
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gstin VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS business_reg_no VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS star_rating INTEGER DEFAULT 3;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(20) DEFAULT 'REC';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- 2. Facilities catalog
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_facilities (
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  PRIMARY KEY (property_id, facility_id)
);

-- 3. Room Blocks (for maintenance, VIP hold, renovation, pest control)
CREATE TABLE IF NOT EXISTS room_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  blocked_by VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_blocks_property ON room_blocks(property_id);
CREATE INDEX IF NOT EXISTS idx_room_blocks_room ON room_blocks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blocks_dates ON room_blocks(start_date, end_date);

-- 4. Room QR Codes (Section 6.13 and Section 25)
CREATE TABLE IF NOT EXISTS room_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  qr_code_svg TEXT,
  qr_code_data_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  print_count INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  scan_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(room_id)
);

CREATE INDEX IF NOT EXISTS idx_room_qr_token ON room_qr_codes(token_hash);
CREATE INDEX IF NOT EXISTS idx_room_qr_property ON room_qr_codes(property_id);

-- 5. Guest Service Categories
CREATE TABLE IF NOT EXISTS guest_service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_service_cat_property ON guest_service_categories(property_id);

-- 6. Guest Service Items / Digital Menu
CREATE TABLE IF NOT EXISTS guest_service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES guest_service_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_rate_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  dietary_type VARCHAR(50) DEFAULT 'veg', -- veg, non-veg, jain, vegan, beverage, general
  is_available BOOLEAN NOT NULL DEFAULT true,
  preparation_time_mins INTEGER DEFAULT 20,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_items_property ON guest_service_items(property_id);
CREATE INDEX IF NOT EXISTS idx_service_items_cat ON guest_service_items(category_id);

-- 7. Guest Service Requests
CREATE TABLE IF NOT EXISTS guest_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_name VARCHAR(150),
  guest_phone VARCHAR(50),
  tracking_token VARCHAR(64) NOT NULL UNIQUE,
  category_slug VARCHAR(100) NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  guest_notes TEXT,
  staff_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_requests_property ON guest_service_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_guest_requests_room ON guest_service_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_guest_requests_tracking ON guest_service_requests(tracking_token);

-- 8. Guest Service Request Timeline Updates
CREATE TABLE IF NOT EXISTS guest_service_request_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES guest_service_requests(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  updated_by VARCHAR(100) DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_updates_req ON guest_service_request_updates(request_id);

-- 9. Guest Food & Beverage Orders
CREATE TABLE IF NOT EXISTS guest_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  guest_name VARCHAR(150) NOT NULL,
  guest_phone VARCHAR(50),
  tracking_token VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'placed', -- placed, confirmed, preparing, out_for_delivery, delivered, cancelled
  payment_method VARCHAR(50) NOT NULL DEFAULT 'pay_at_checkout',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_orders_property ON guest_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_room ON guest_orders(room_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_tracking ON guest_orders(tracking_token);

-- 10. Guest Order Items
CREATE TABLE IF NOT EXISTS guest_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES guest_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES guest_service_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  dietary_type VARCHAR(50),
  special_requests TEXT
);

CREATE INDEX IF NOT EXISTS idx_guest_order_items_order ON guest_order_items(order_id);

-- 11. Restaurant POS Tables & Orders
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  table_number VARCHAR(20) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  section VARCHAR(50) DEFAULT 'Main Dining',
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, table_number)
);

CREATE TABLE IF NOT EXISTS restaurant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_type VARCHAR(50) NOT NULL DEFAULT 'dine_in',
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  guest_name VARCHAR(150),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  kot_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  notes TEXT
);

-- 12. Inventory Management
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  gstin VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
  minimum_stock NUMERIC(10, 2) NOT NULL DEFAULT 5,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- purchase, issue, return, adjustment, waste
  quantity NUMERIC(10, 2) NOT NULL,
  unit_cost NUMERIC(10, 2),
  total_cost NUMERIC(10, 2),
  reference_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Corporate Accounts & Travel Agents
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL DEFAULT 'corporate',
  contact_person VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),
  gstin VARCHAR(50),
  address TEXT,
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Tax Rates
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rate_percentage NUMERIC(5, 2) NOT NULL,
  code VARCHAR(50),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Default Service Categories Seed Stored Procedure
CREATE OR REPLACE FUNCTION seed_default_guest_service_categories(p_property_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO guest_service_categories (property_id, name, slug, icon, description, display_order)
  VALUES 
    (p_property_id, 'Food & Beverage', 'food-beverage', 'Utensils', 'In-room dining, snacks, beverages and chef specials', 1),
    (p_property_id, 'Housekeeping', 'housekeeping', 'Sparkles', 'Fresh towels, bed linen change, room cleaning', 2),
    (p_property_id, 'Extra Amenities', 'amenities', 'Package', 'Dental kit, shaving kit, extra pillows, slippers', 3),
    (p_property_id, 'Laundry Service', 'laundry', 'Shirt', 'Wash, press, dry cleaning and express turnaround', 4),
    (p_property_id, 'Maintenance & Repairs', 'maintenance', 'Wrench', 'AC, plumbing, electrical, TV or WiFi assistance', 5),
    (p_property_id, 'Transportation & Taxi', 'transportation', 'Car', 'Airport transfers, local cab booking, sight seeing', 6),
    (p_property_id, 'Front Desk & Concierge', 'concierge', 'Bell', 'Wake-up call, luggage assistance, checkout requests', 7),
    (p_property_id, 'Feedback & Complaints', 'feedback', 'MessageSquare', 'Share your concerns or feedback directly with the GM', 8)
  ON CONFLICT (property_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Enable RLS on newly created tables
ALTER TABLE room_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_service_request_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- 17. Permissive policies for authenticated staff and public guest access
-- Authenticated staff full access to property-bound resources
CREATE POLICY "Staff all on room_blocks" ON room_blocks FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on room_qr_codes" ON room_qr_codes FOR ALL TO authenticated USING (true);
CREATE POLICY "Public read on active room_qr_codes" ON room_qr_codes FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Staff all on guest_service_categories" ON guest_service_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Public read on active guest_service_categories" ON guest_service_categories FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Staff all on guest_service_items" ON guest_service_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Public read on active guest_service_items" ON guest_service_items FOR SELECT TO anon USING (is_available = true);

CREATE POLICY "Staff all on guest_service_requests" ON guest_service_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Public insert and read on guest_service_requests" ON guest_service_requests FOR ALL TO anon USING (true);

CREATE POLICY "Staff all on guest_service_request_updates" ON guest_service_request_updates FOR ALL TO authenticated USING (true);
CREATE POLICY "Public read on guest_service_request_updates" ON guest_service_request_updates FOR SELECT TO anon USING (true);

CREATE POLICY "Staff all on guest_orders" ON guest_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Public insert and read on guest_orders" ON guest_orders FOR ALL TO anon USING (true);

CREATE POLICY "Staff all on guest_order_items" ON guest_order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Public insert and read on guest_order_items" ON guest_order_items FOR ALL TO anon USING (true);

CREATE POLICY "Staff all on restaurant_tables" ON restaurant_tables FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on restaurant_orders" ON restaurant_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on restaurant_order_items" ON restaurant_order_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Staff all on inventory_categories" ON inventory_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on inventory_items" ON inventory_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on inventory_transactions" ON inventory_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on corporate_accounts" ON corporate_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff all on tax_rates" ON tax_rates FOR ALL TO authenticated USING (true);

