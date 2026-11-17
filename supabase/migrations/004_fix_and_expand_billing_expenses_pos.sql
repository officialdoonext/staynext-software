-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- MIGRATION: 004_fix_and_expand_billing_expenses_pos.sql
-- Description: Policies, flexible invoice schema, budgets, employee schedules, 
-- seasonal rates & promotions.
-- ====================================================================

-- 1. Ensure RLS Policies for previously un-policied tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Expense categories isolation'
  ) THEN
    CREATE POLICY "Expense categories isolation" ON expense_categories FOR ALL USING (user_has_property_access(property_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Departments isolation'
  ) THEN
    CREATE POLICY "Departments isolation" ON departments FOR ALL USING (user_has_property_access(property_id));
  END IF;
END $$;

-- 2. Relax expenses.created_by requirement and add defaults
ALTER TABLE expenses ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE expenses ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 3. Enhance expense_categories with budget and code
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS budget NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 4. Enhance invoices to support POS, walk-ins, and itemized json snapshots
ALTER TABLE invoices ALTER COLUMN guest_id DROP NOT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- 5. Create employee_schedules table for staff rostering
CREATE TABLE IF NOT EXISTS employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type VARCHAR(50) NOT NULL DEFAULT 'morning', -- 'morning', 'afternoon', 'night', 'general', 'off'
  start_time TIME DEFAULT '08:00:00',
  end_time TIME DEFAULT '17:00:00',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_schedules' AND policyname = 'Employee schedules isolation'
  ) THEN
    CREATE POLICY "Employee schedules isolation" ON employee_schedules FOR ALL USING (user_has_property_access(property_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employee_schedules_lookup ON employee_schedules(property_id, shift_date);

-- 6. Create rate_promotions table for discount codes & coupons
CREATE TABLE IF NOT EXISTS rate_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  discount_value NUMERIC(10, 2) NOT NULL,
  valid_from DATE,
  valid_until DATE,
  min_booking_amount NUMERIC(10, 2) DEFAULT 0.00,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rate_promotions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rate_promotions' AND policyname = 'Rate promotions isolation'
  ) THEN
    CREATE POLICY "Rate promotions isolation" ON rate_promotions FOR ALL USING (user_has_property_access(property_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_promotions_lookup ON rate_promotions(property_id, code);

-- 7. Create seasonal_rates table for date-based multipliers
CREATE TABLE IF NOT EXISTS seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE seasonal_rates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seasonal_rates' AND policyname = 'Seasonal rates isolation'
  ) THEN
    CREATE POLICY "Seasonal rates isolation" ON seasonal_rates FOR ALL USING (user_has_property_access(property_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seasonal_rates_lookup ON seasonal_rates(property_id, start_date, end_date);
