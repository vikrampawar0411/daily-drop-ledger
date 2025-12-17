-- Add images array column to products table for multiple images support
-- Keep image_url for backward compatibility (will store first image)

ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Migrate existing image_url data to images array
UPDATE products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '' AND images = '{}';

-- Create index for better performance on image queries
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN (images);

-- Add comment to explain the columns
COMMENT ON COLUMN products.image_url IS 'Primary product image URL (kept for backward compatibility, use images array for multiple images)';
COMMENT ON COLUMN products.images IS 'Array of product image URLs supporting multiple images';
