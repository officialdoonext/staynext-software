-- ====================================================================
-- MIGRATION 009: COMPREHENSIVE GUEST REGISTRATION & CHECK-IN FIELDS
-- Indian Hotel PMS Standards, FRRO Form III / Form C compliance,
-- Accompanying Guests, Detailed GST Billing, & Verification
-- ====================================================================

-- 1. Extend GUESTS table with personal, professional, document & foreign national details
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS guest_type VARCHAR(50) DEFAULT 'Individual',
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS id_issue_date DATE,
  ADD COLUMN IF NOT EXISTS id_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(50) DEFAULT 'Verified',
  ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  -- Foreign Guest / Form III (Form C) fields
  ADD COLUMN IF NOT EXISTS is_foreign_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS passport_issue_date DATE,
  ADD COLUMN IF NOT EXISTS passport_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS passport_issue_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS passport_issue_place VARCHAR(100),
  ADD COLUMN IF NOT EXISTS visa_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS visa_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS visa_issue_date DATE,
  ADD COLUMN IF NOT EXISTS visa_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS permanent_address_abroad TEXT,
  ADD COLUMN IF NOT EXISTS address_in_india TEXT,
  ADD COLUMN IF NOT EXISTS date_of_arrival_in_india DATE,
  ADD COLUMN IF NOT EXISTS arrived_from VARCHAR(100),
  ADD COLUMN IF NOT EXISTS purpose_of_visit VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expected_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS guest_photo_url TEXT;

-- 2. Extend RESERVATIONS table with booking types, room allocation, GST breakdown, and check-in details
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(50) DEFAULT 'Walk-in',
  ADD COLUMN IF NOT EXISTS booking_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS purpose_of_visit VARCHAR(100) DEFAULT 'Personal',
  ADD COLUMN IF NOT EXISTS extra_bed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extra_bed_charges NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS food_charges NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS other_charges NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 12.00,
  ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'Cash',
  ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(150),
  ADD COLUMN IF NOT EXISTS accompanying_guests JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_card_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS guest_signature TEXT,
  ADD COLUMN IF NOT EXISTS checkin_handled_by VARCHAR(100);

-- 3. Accompanying Guests Table (for robust query support alongside JSONB storage)
CREATE TABLE IF NOT EXISTS reservation_accompanying_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  guest_name VARCHAR(150) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  relationship VARCHAR(50),
  phone VARCHAR(50),
  nationality VARCHAR(100) DEFAULT 'India',
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  verification_status VARCHAR(50) DEFAULT 'Verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accompanying_res ON reservation_accompanying_guests(reservation_id);

-- RLS policies for accompanying guests
ALTER TABLE reservation_accompanying_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read for accompanying guests"
  ON reservation_accompanying_guests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert for accompanying guests"
  ON reservation_accompanying_guests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update for accompanying guests"
  ON reservation_accompanying_guests FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete for accompanying guests"
  ON reservation_accompanying_guests FOR DELETE
  TO authenticated
  USING (true);
