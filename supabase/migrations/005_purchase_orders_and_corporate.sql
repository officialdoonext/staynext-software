-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- MIGRATION: 005_purchase_orders_and_corporate.sql
-- Description: Purchase orders, travel agents, and corporate contracts
-- ====================================================================

-- 1. Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ordered', -- 'draft', 'ordered', 'shipped', 'delivered', 'cancelled'
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  expected_delivery DATE,
  delivered_at TIMESTAMPTZ,
  items_summary TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Purchase orders isolation'
  ) THEN
    CREATE POLICY "Purchase orders isolation" ON purchase_orders FOR ALL USING (user_has_property_access(property_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_prop ON purchase_orders(property_id);

-- 2. Create travel_agents table
CREATE TABLE IF NOT EXISTS travel_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  agency_name VARCHAR(255),
  iata_number VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  commission_percentage NUMERIC(5, 2) DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE travel_agents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'travel_agents' AND policyname = 'Travel agents isolation'
  ) THEN
    CREATE POLICY "Travel agents isolation" ON travel_agents FOR ALL USING (user_has_property_access(property_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_travel_agents_prop ON travel_agents(property_id);

-- 3. Create corporate_contracts table
CREATE TABLE IF NOT EXISTS corporate_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  contract_number VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  room_rate_discount_percent NUMERIC(5, 2) DEFAULT 15.00,
  complimentary_breakfast BOOLEAN DEFAULT true,
  payment_terms VARCHAR(50) DEFAULT 'Net 30',
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE corporate_contracts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'corporate_contracts' AND policyname = 'Corporate contracts isolation'
  ) THEN
    CREATE POLICY "Corporate contracts isolation" ON corporate_contracts FOR ALL USING (
      EXISTS (
        SELECT 1 FROM corporate_accounts ca
        WHERE ca.id = corporate_account_id AND user_has_property_access(ca.property_id)
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_corporate_contracts_account ON corporate_contracts(corporate_account_id);
