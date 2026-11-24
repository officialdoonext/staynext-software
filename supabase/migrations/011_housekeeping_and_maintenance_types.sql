-- ====================================================================
-- MIGRATION 011: HOUSEKEEPING TYPES & MAINTENANCE TYPES
-- ====================================================================

-- 1. Housekeeping Types Table
CREATE TABLE IF NOT EXISTS housekeeping_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Maintenance Types Table
CREATE TABLE IF NOT EXISTS maintenance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  description TEXT,
  estimated_minutes INTEGER DEFAULT 45,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hk_types_prop ON housekeeping_types(property_id);
CREATE INDEX IF NOT EXISTS idx_maint_types_prop ON maintenance_types(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE housekeeping_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on housekeeping_types" ON housekeeping_types;
CREATE POLICY "Allow all on housekeeping_types" ON housekeeping_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read on housekeeping_types" ON housekeeping_types;
CREATE POLICY "Allow public read on housekeeping_types" ON housekeeping_types FOR SELECT TO anon USING (true);

ALTER TABLE maintenance_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on maintenance_types" ON maintenance_types;
CREATE POLICY "Allow all on maintenance_types" ON maintenance_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read on maintenance_types" ON maintenance_types;
CREATE POLICY "Allow public read on maintenance_types" ON maintenance_types FOR SELECT TO anon USING (true);
