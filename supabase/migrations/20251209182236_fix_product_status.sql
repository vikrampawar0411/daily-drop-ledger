-- Fix existing products that have NULL status
-- This migration ensures all products have a valid status value

UPDATE products 
SET status = 'active' 
WHERE status IS NULL AND is_active = true;

UPDATE products 
SET status = 'inactive' 
WHERE status IS NULL AND is_active = false;

-- Ensure status is never NULL going forward
ALTER TABLE products ALTER COLUMN status SET NOT NULL;
