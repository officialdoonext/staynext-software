-- ====================================================================
-- STAYNEXT HOTEL MANAGEMENT SAAS
-- MIGRATION: 008_add_reservation_times.sql
-- Description: Adds check_in_time and check_out_time to reservations
-- and reservation_rooms tables, and relaxes date constraint to support
-- same-day/day-use bookings with timings.
-- ====================================================================

-- 1. Add check_in_time and check_out_time columns to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS check_in_time VARCHAR(20) DEFAULT '14:00';

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS check_out_time VARCHAR(20) DEFAULT '11:00';

-- 2. Add to reservation_rooms for room booking slots
ALTER TABLE public.reservation_rooms 
ADD COLUMN IF NOT EXISTS check_in_time VARCHAR(20) DEFAULT '14:00';

ALTER TABLE public.reservation_rooms 
ADD COLUMN IF NOT EXISTS check_out_time VARCHAR(20) DEFAULT '11:00';

-- 3. Relax check_dates constraint to allow same-day day-use stays with timings
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS check_dates;
ALTER TABLE public.reservations ADD CONSTRAINT check_dates CHECK (check_out_date >= check_in_date);

ALTER TABLE public.reservation_rooms DROP CONSTRAINT IF EXISTS check_res_room_dates;
ALTER TABLE public.reservation_rooms ADD CONSTRAINT check_res_room_dates CHECK (check_out_date >= check_in_date);

-- 4. Set defaults for any existing rows that might have NULL times
UPDATE public.reservations SET check_in_time = '14:00' WHERE check_in_time IS NULL;
UPDATE public.reservations SET check_out_time = '11:00' WHERE check_out_time IS NULL;
UPDATE public.reservation_rooms SET check_in_time = '14:00' WHERE check_in_time IS NULL;
UPDATE public.reservation_rooms SET check_out_time = '11:00' WHERE check_out_time IS NULL;

