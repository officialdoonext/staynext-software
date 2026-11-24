-- Migration 012: Fix Maintenance Requests Constraints and Public QR RLS
-- 1. Ensure reported_by is nullable on maintenance_requests for guest QR submissions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maintenance_requests' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE maintenance_requests ALTER COLUMN reported_by DROP NOT NULL;
  END IF;
END $$;

-- 2. Allow anon inserts & reads on maintenance_requests for Room QR portals
DROP POLICY IF EXISTS "Public insert on maintenance_requests" ON maintenance_requests;
CREATE POLICY "Public insert on maintenance_requests" ON maintenance_requests FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public select on maintenance_requests" ON maintenance_requests;
CREATE POLICY "Public select on maintenance_requests" ON maintenance_requests FOR SELECT TO anon USING (true);

-- 3. Allow anon inserts & reads on housekeeping_tasks for Room QR portals
DROP POLICY IF EXISTS "Public insert on housekeeping_tasks" ON housekeeping_tasks;
CREATE POLICY "Public insert on housekeeping_tasks" ON housekeeping_tasks FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public select on housekeeping_tasks" ON housekeeping_tasks;
CREATE POLICY "Public select on housekeeping_tasks" ON housekeeping_tasks FOR SELECT TO anon USING (true);

-- 4. Allow anon updates on rooms status (e.g. marking room dirty or maintenance on QR request)
DROP POLICY IF EXISTS "Public update room status" ON rooms;
CREATE POLICY "Public update room status" ON rooms FOR UPDATE TO anon USING (true) WITH CHECK (true);
