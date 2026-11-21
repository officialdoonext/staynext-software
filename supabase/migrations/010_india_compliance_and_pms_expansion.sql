-- ====================================================================
-- MIGRATION 010: INDIA STATUTORY COMPLIANCE & COMPREHENSIVE PMS EXPANSION
-- Form III / FRRO Foreign Guest Tracking (Immigration Rules 2025)
-- DPDP Act 2023/2025 Privacy & Consent Framework
-- GST 2025 Accommodation & Dining Tax Engine (Rule 46 Compliance)
-- Night Audit, Cashier Shifts, & Extended PMS Data Architecture
-- ====================================================================

-- 1. Property Licenses & Statutory Permits Register
CREATE TABLE IF NOT EXISTS property_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  license_type VARCHAR(50) NOT NULL, -- 'Trade Licence', 'Fire NOC', 'FSSAI Licence', 'GST Registration', 'Shops & Establishments', 'Lift Licence', 'Pollution Consent', 'Tourism Registration', 'Liquor Licence'
  license_number VARCHAR(100) NOT NULL,
  issuing_authority VARCHAR(150),
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  status VARCHAR(30) DEFAULT 'Active', -- 'Active', 'Expiring Soon', 'Expired', 'Renewed'
  alert_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Foreign Guest Tracking & FRRO Form III Reports (Rule 17 Immigration & Foreigners Rules 2025)
CREATE TABLE IF NOT EXISTS foreign_guest_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  passport_number VARCHAR(100) NOT NULL,
  passport_issue_country VARCHAR(100) NOT NULL,
  passport_issue_date DATE,
  passport_expiry_date DATE,
  passport_issue_place VARCHAR(100),
  visa_number VARCHAR(100),
  visa_type VARCHAR(50),
  visa_issue_date DATE,
  visa_expiry_date DATE,
  is_oci_cardholder BOOLEAN DEFAULT false,
  arrival_date_in_india DATE,
  arrived_from VARCHAR(100),
  proceeding_to VARCHAR(100),
  purpose_of_visit VARCHAR(100) DEFAULT 'Tourism',
  permanent_overseas_address TEXT,
  address_in_india TEXT,
  form_iii_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Submitted', 'Approved', 'Rejected'
  form_iii_reference_number VARCHAR(100),
  form_iii_submitted_at TIMESTAMPTZ,
  form_iii_acknowledged_at TIMESTAMPTZ,
  acknowledgement_receipt_url TEXT,
  reported_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_iii_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  report_type VARCHAR(20) NOT NULL DEFAULT 'Arrival', -- 'Arrival' (within 24 hrs), 'Departure' (within 24 hrs)
  report_status VARCHAR(30) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Submitted', 'Failed', 'Acknowledged'
  portal_submission_id VARCHAR(100),
  reference_number VARCHAR(100),
  submitted_payload JSONB DEFAULT '{}'::jsonb,
  response_payload JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Digital Personal Data Protection (DPDP Act 2023 / 2025) Consent & Audit Logs
CREATE TABLE IF NOT EXISTS guest_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL DEFAULT 'Stay_Registration', -- 'Stay_Registration', 'Marketing', 'Identity_Verification'
  is_granted BOOLEAN NOT NULL DEFAULT true,
  consent_purpose TEXT,
  ip_address VARCHAR(45),
  privacy_policy_version VARCHAR(20) DEFAULT '2025.1',
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID,
  action_type VARCHAR(100) NOT NULL, -- 'Guest_Data_View', 'Document_Export', 'Form_III_Submission', 'Night_Audit'
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indian GST Engine & Tax Rules
CREATE TABLE IF NOT EXISTS gst_tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  service_category VARCHAR(50) NOT NULL, -- 'Accommodation', 'Restaurant_DineIn', 'Restaurant_RoomService', 'Laundry', 'Banquet'
  slab_min_price NUMERIC(10, 2) DEFAULT 0.00,
  slab_max_price NUMERIC(10, 2) DEFAULT 7500.00,
  gst_rate NUMERIC(5, 2) NOT NULL, -- 5.00, 12.00, 18.00, 28.00
  cgst_rate NUMERIC(5, 2) NOT NULL, -- 2.50, 6.00, 9.00, 14.00
  sgst_rate NUMERIC(5, 2) NOT NULL, -- 2.50, 6.00, 9.00, 14.00
  igst_rate NUMERIC(5, 2) NOT NULL, -- 5.00, 12.00, 18.00, 28.00
  itc_eligible BOOLEAN DEFAULT false,
  sac_hsn_code VARCHAR(20) DEFAULT '996311',
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT '2025-01-01',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Night Audit Records
CREATE TABLE IF NOT EXISTS night_audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  audit_date DATE NOT NULL,
  performed_by VARCHAR(100),
  status VARCHAR(30) DEFAULT 'Completed', -- 'In_Progress', 'Completed'
  total_occupied_rooms INTEGER DEFAULT 0,
  occupancy_rate NUMERIC(5, 2) DEFAULT 0.00,
  room_revenue NUMERIC(12, 2) DEFAULT 0.00,
  food_revenue NUMERIC(12, 2) DEFAULT 0.00,
  other_revenue NUMERIC(12, 2) DEFAULT 0.00,
  total_revenue NUMERIC(12, 2) DEFAULT 0.00,
  tax_collected NUMERIC(12, 2) DEFAULT 0.00,
  cash_collected NUMERIC(12, 2) DEFAULT 0.00,
  upi_collected NUMERIC(12, 2) DEFAULT 0.00,
  card_collected NUMERIC(12, 2) DEFAULT 0.00,
  pay_later_outstanding NUMERIC(12, 2) DEFAULT 0.00,
  discrepancies TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Cashier Shifts & Register
CREATE TABLE IF NOT EXISTS cashier_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  cashier_name VARCHAR(100) NOT NULL,
  shift_name VARCHAR(50) DEFAULT 'Morning', -- 'Morning', 'Evening', 'Night'
  shift_start TIMESTAMPTZ DEFAULT now(),
  shift_end TIMESTAMPTZ,
  opening_cash NUMERIC(10, 2) DEFAULT 0.00,
  closing_cash NUMERIC(10, 2) DEFAULT 0.00,
  total_cash_received NUMERIC(10, 2) DEFAULT 0.00,
  total_upi_received NUMERIC(10, 2) DEFAULT 0.00,
  total_card_received NUMERIC(10, 2) DEFAULT 0.00,
  cash_difference NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'Open', -- 'Open', 'Closed'
  handover_notes TEXT
);

-- 7. Add Extended Columns across Existing Tables
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS max_adults INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS weekday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS weekend_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS is_ac BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS attached_bathroom BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS balcony BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gst_category VARCHAR(50) DEFAULT 'Accommodation';

ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS base_occupancy INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS max_occupancy INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS default_adult_count INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS default_child_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS default_bed_type VARCHAR(50) DEFAULT 'King',
  ADD COLUMN IF NOT EXISTS extra_adult_rate NUMERIC(10, 2) DEFAULT 500.00,
  ADD COLUMN IF NOT EXISTS extra_child_rate NUMERIC(10, 2) DEFAULT 300.00,
  ADD COLUMN IF NOT EXISTS extra_bed_allowed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_meal_plan VARCHAR(20) DEFAULT 'EP',
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 12.00;

ALTER TABLE room_blocks
  ADD COLUMN IF NOT EXISTS block_type VARCHAR(50) DEFAULT 'Maintenance',
  ADD COLUMN IF NOT EXISTS maintenance_ticket_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS blocked_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS actual_release_date DATE,
  ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(50) DEFAULT 'Pending';

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS guest_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS guest_category VARCHAR(50) DEFAULT 'Indian',
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_gstin VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vip_category VARCHAR(50) DEFAULT 'Regular',
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_reason TEXT,
  ADD COLUMN IF NOT EXISTS preferred_meal_plan VARCHAR(20) DEFAULT 'EP',
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) DEFAULT 'English';

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_reg_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS guest_category VARCHAR(50) DEFAULT 'Indian',
  ADD COLUMN IF NOT EXISTS arrived_from VARCHAR(100),
  ADD COLUMN IF NOT EXISTS next_destination VARCHAR(100),
  ADD COLUMN IF NOT EXISTS number_of_occupants INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(20) DEFAULT 'EP',
  ADD COLUMN IF NOT EXISTS negotiated_tariff NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(30) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS form_iii_status VARCHAR(30) DEFAULT 'Not Applicable',
  ADD COLUMN IF NOT EXISTS check_out_time VARCHAR(20) DEFAULT '11:00 AM';

-- Indexes for lightning fast operations
CREATE INDEX IF NOT EXISTS idx_licenses_prop ON property_licenses(property_id);
CREATE INDEX IF NOT EXISTS idx_foreign_guests ON foreign_guest_details(guest_id);
CREATE INDEX IF NOT EXISTS idx_form_iii ON form_iii_reports(property_id, report_status);
CREATE INDEX IF NOT EXISTS idx_night_audit ON night_audit_records(property_id, audit_date);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts ON cashier_shifts(property_id, status);

-- Enable RLS with permissive policies for tenant users
ALTER TABLE property_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on property_licenses" ON property_licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write on property_licenses" ON property_licenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE foreign_guest_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on foreign_guest_details" ON foreign_guest_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE form_iii_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on form_iii_reports" ON form_iii_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE guest_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on guest_consents" ON guest_consents FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on compliance_audit_logs" ON compliance_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE gst_tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on gst_tax_rules" ON gst_tax_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE night_audit_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on night_audit_records" ON night_audit_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE cashier_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated on cashier_shifts" ON cashier_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
