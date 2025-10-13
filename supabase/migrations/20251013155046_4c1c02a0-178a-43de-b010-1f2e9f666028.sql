-- Transform products, areas, societies into admin-managed master tables
-- Remove vendor_id constraints and add description, status columns

-- Update products table
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;
ALTER TABLE products DROP COLUMN IF EXISTS vendor_id CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update areas table  
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_vendor_id_fkey;
ALTER TABLE areas DROP COLUMN IF EXISTS vendor_id CASCADE;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update societies table
ALTER TABLE societies DROP CONSTRAINT IF EXISTS societies_vendor_id_fkey;
ALTER TABLE societies DROP COLUMN IF EXISTS vendor_id CASCADE;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add product_id to customers and vendors tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Update RLS policies for admin-managed master tables

-- Products policies
DROP POLICY IF EXISTS "Admins and staff can create products" ON products;
DROP POLICY IF EXISTS "Admins and staff can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Public users can view active products" ON products;

CREATE POLICY "Admins can manage products" ON products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "All users can view active products" ON products FOR SELECT USING (status = 'active');

-- Areas policies  
DROP POLICY IF EXISTS "Admins and staff can create areas" ON areas;
DROP POLICY IF EXISTS "Admins and staff can update areas" ON areas;
DROP POLICY IF EXISTS "Admins can delete areas" ON areas;
DROP POLICY IF EXISTS "Public users can view areas" ON areas;

CREATE POLICY "Admins can manage areas" ON areas FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "All users can view active areas" ON areas FOR SELECT USING (status = 'active');

-- Societies policies
DROP POLICY IF EXISTS "Admins and staff can create societies" ON societies;
DROP POLICY IF EXISTS "Admins and staff can update societies" ON societies;
DROP POLICY IF EXISTS "Admins can delete societies" ON societies;
DROP POLICY IF EXISTS "Public users can view societies" ON societies;

CREATE POLICY "Admins can manage societies" ON societies FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "All users can view active societies" ON societies FOR SELECT USING (status = 'active');