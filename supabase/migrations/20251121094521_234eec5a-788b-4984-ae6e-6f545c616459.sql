-- Add time columns to products table with default values
ALTER TABLE products 
ADD COLUMN subscribe_before TIME DEFAULT '23:00',
ADD COLUMN delivery_before TIME DEFAULT '07:00';

-- Set default values for existing products that might not have these values
UPDATE products 
SET subscribe_before = '23:00', 
    delivery_before = '07:00'
WHERE subscribe_before IS NULL OR delivery_before IS NULL;