-- Migration 014: Ensure dietary_type, is_veg and category type compatibility
ALTER TABLE guest_service_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT true;

-- Backfill is_veg based on dietary_type if present
UPDATE guest_service_items
SET is_veg = (dietary_type = 'veg' OR dietary_type = 'jain' OR dietary_type = 'vegan' OR dietary_type IS NULL)
WHERE is_veg IS NULL;

-- Ensure type exists on guest_service_categories if queried
ALTER TABLE guest_service_categories ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'food_beverage';

