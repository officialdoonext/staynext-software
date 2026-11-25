-- ====================================================================
-- MIGRATION 013: NOTIFICATION CHANNELS & THIRD-PARTY INTEGRATIONS
-- ====================================================================

-- 1. Notification Recipients (Housekeeping & Maintenance: Mail, WhatsApp, SMS)
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'housekeeping' or 'maintenance'
  channel VARCHAR(20) NOT NULL, -- 'mail', 'whatsapp', 'sms'
  recipient VARCHAR(255) NOT NULL, -- email or phone number
  template_id VARCHAR(100), -- template name or identifier for whatsapp/sms
  label VARCHAR(100), -- friendly name or role e.g. "Head Housekeeper"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipients_prop ON notification_recipients(property_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_cat ON notification_recipients(property_id, category);

-- 2. Property Integrations (WhatsApp Meta API, ImageKit Media CDN)
CREATE TABLE IF NOT EXISTS property_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'whatsapp', 'imagekit'
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_prop_integrations ON property_integrations(property_id, provider);

-- 3. Notification Dispatch Logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  template_id VARCHAR(100),
  payload JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'mocked'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_prop ON notification_logs(property_id);

-- 4. Add attachment_url to guest_service_requests and maintenance_requests if not exists
ALTER TABLE guest_service_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 5. Enable RLS and setup policies
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated on notification_recipients" ON notification_recipients;
CREATE POLICY "Allow all for authenticated on notification_recipients" ON notification_recipients FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon read on notification_recipients" ON notification_recipients;
CREATE POLICY "Allow anon read on notification_recipients" ON notification_recipients FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert on notification_recipients" ON notification_recipients;
CREATE POLICY "Allow anon insert on notification_recipients" ON notification_recipients FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE property_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated on property_integrations" ON property_integrations;
CREATE POLICY "Allow all for authenticated on property_integrations" ON property_integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon read on property_integrations" ON property_integrations;
CREATE POLICY "Allow anon read on property_integrations" ON property_integrations FOR SELECT TO anon USING (true);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated on notification_logs" ON notification_logs;
CREATE POLICY "Allow all for authenticated on notification_logs" ON notification_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon insert on notification_logs" ON notification_logs;
CREATE POLICY "Allow anon insert on notification_logs" ON notification_logs FOR INSERT TO anon WITH CHECK (true);
