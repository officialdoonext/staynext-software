-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- DEVELOPMENT SEED DATA (DEV ONLY)
-- File: supabase/seed.sql
-- ====================================================================

-- 1. Create Demo Tenant
INSERT INTO tenants (id, name, email, phone, address, city, country, subscription_plan, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Horizon Luxury Hospitality Group',
  'admin@horizonhospitality.com',
  '+1 (555) 019-8000',
  '1000 Brickell Avenue, Suite 400',
  'Miami',
  'United States',
  'enterprise',
  true
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Demo Properties
INSERT INTO properties (id, tenant_id, name, property_type, address, city, state, country, postal_code, phone, email, currency, timezone, check_in_time, check_out_time, is_active)
VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Grand Horizon Resort & Spa',
  'resort',
  '8400 Oceanview Blvd',
  'Palm Beach',
  'FL',
  'United States',
  '33480',
  '+1 (561) 555-0199',
  'concierge@grandhorizonresort.com',
  'USD',
  'America/New_York',
  '15:00',
  '11:00',
  true
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'City Center Business Hotel',
  'hotel',
  '120 Financial Plaza',
  'Chicago',
  'IL',
  'United States',
  '60601',
  '+1 (312) 555-0144',
  'info@citycenterhotel.com',
  'USD',
  'America/Chicago',
  '14:00',
  '12:00',
  true
) ON CONFLICT DO NOTHING;

-- 3. Room Types
INSERT INTO room_types (id, property_id, name, code, base_rate, max_occupancy, bed_type, size_sqft, total_rooms, is_active)
VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Deluxe King Room',
  'DLX-K',
  220.00,
  2,
  '1 King Bed',
  420,
  16,
  true
),
(
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'Executive Double Queen',
  'EXE-DBL',
  280.00,
  4,
  '2 Queen Beds',
  510,
  12,
  true
),
(
  'c0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000001',
  'Oceanfront Villa',
  'VILLA-OCN',
  520.00,
  4,
  '1 King + 2 Daybeds',
  980,
  8,
  true
),
(
  'c0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000001',
  'Presidential Suite',
  'PRES-STE',
  650.00,
  4,
  '1 Master King Bed',
  1450,
  2,
  true
) ON CONFLICT DO NOTHING;

-- 4. Rooms Inventory
INSERT INTO rooms (id, property_id, room_number, room_type_id, status, is_smoking, is_active)
VALUES
('d0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000001', '101', 'c0000000-0000-0000-0000-000000000001', 'available', false, true),
('d0000000-0000-0000-0000-000000000102', 'b0000000-0000-0000-0000-000000000001', '102', 'c0000000-0000-0000-0000-000000000001', 'occupied', false, true),
('d0000000-0000-0000-0000-000000000103', 'b0000000-0000-0000-0000-000000000001', '103', 'c0000000-0000-0000-0000-000000000002', 'dirty', false, true),
('d0000000-0000-0000-0000-000000000104', 'b0000000-0000-0000-0000-000000000001', '104', 'c0000000-0000-0000-0000-000000000002', 'cleaning', false, true),
('d0000000-0000-0000-0000-000000000201', 'b0000000-0000-0000-0000-000000000001', '201', 'c0000000-0000-0000-0000-000000000004', 'occupied', false, true),
('d0000000-0000-0000-0000-000000000202', 'b0000000-0000-0000-0000-000000000001', '202', 'c0000000-0000-0000-0000-000000000002', 'reserved', false, true),
('d0000000-0000-0000-0000-000000000203', 'b0000000-0000-0000-0000-000000000001', '203', 'c0000000-0000-0000-0000-000000000001', 'available', false, true),
('d0000000-0000-0000-0000-000000000204', 'b0000000-0000-0000-0000-000000000001', '204', 'c0000000-0000-0000-0000-000000000001', 'maintenance', false, true),
('d0000000-0000-0000-0000-000000000301', 'b0000000-0000-0000-0000-000000000001', '301', 'c0000000-0000-0000-0000-000000000003', 'available', false, true),
('d0000000-0000-0000-0000-000000000302', 'b0000000-0000-0000-0000-000000000001', '302', 'c0000000-0000-0000-0000-000000000003', 'out_of_order', false, true)
ON CONFLICT (property_id, room_number) DO NOTHING;

-- 5. Demo Guests
INSERT INTO guests (id, tenant_id, first_name, last_name, email, phone, nationality, is_vip, vip_tier, total_stays, total_spent)
VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Sophia',
  'Montgomery',
  'sophia.m@example.com',
  '+1 (555) 012-4932',
  'United States',
  true,
  'Diamond',
  8,
  18450.00
),
(
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Liam',
  'Gallagher',
  'liam.g@oasis.co.uk',
  '+44 7911 123456',
  'United Kingdom',
  true,
  'Platinum',
  5,
  8200.00
),
(
  'e0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Elena',
  'Rostova',
  'elena.rostova@travel.de',
  '+49 151 2345678',
  'Germany',
  false,
  'Standard',
  2,
  2800.00
) ON CONFLICT DO NOTHING;

-- 6. Reservations
INSERT INTO reservations (id, reservation_number, property_id, guest_id, room_type_id, check_in_date, check_out_date, num_adults, num_children, status, booking_source, total_amount, paid_amount, payment_status)
VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'RES-2026-9081',
  'b0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000004',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '5 days',
  2,
  0,
  'checked_in',
  'website',
  3900.00,
  3900.00,
  'paid'
),
(
  'f0000000-0000-0000-0000-000000000002',
  'RES-2026-9082',
  'b0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 days',
  1,
  0,
  'checked_in',
  'direct',
  660.00,
  660.00,
  'paid'
),
(
  'f0000000-0000-0000-0000-000000000003',
  'RES-2026-9083',
  'b0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000002',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '4 days',
  2,
  0,
  'confirmed',
  'ota',
  1120.00,
  500.00,
  'partial'
) ON CONFLICT (reservation_number) DO NOTHING;

-- 7. Reservation Room Allocations
INSERT INTO reservation_rooms (id, reservation_id, room_id, check_in_date, check_out_date, rate_per_night, is_active)
VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000201',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '5 days',
  650.00,
  true
),
(
  '10000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000102',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 days',
  220.00,
  true
) ON CONFLICT DO NOTHING;

-- 8. Payments
INSERT INTO payments (id, reservation_id, property_id, guest_id, amount, payment_method, payment_reference, status)
VALUES
(
  '20000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  3900.00,
  'card',
  'ch_stripe_9823482394',
  'completed'
),
(
  '20000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  660.00,
  'card',
  'ch_stripe_7719283719',
  'completed'
) ON CONFLICT DO NOTHING;

