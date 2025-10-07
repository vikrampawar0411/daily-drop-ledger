-- Update RLS policies to allow public read access for demo purposes

-- Allow public read access to vendors
DROP POLICY IF EXISTS "Public can view active vendors" ON public.vendors;
CREATE POLICY "Public can view active vendors"
  ON public.vendors
  FOR SELECT
  USING (is_active = true);

-- Allow public read access to products  
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = true);

-- Allow public to create orders (for demo - in production this should be restricted to authenticated users)
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Allow public to view all orders (for demo - in production this should be restricted to own orders)
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders"
  ON public.orders
  FOR SELECT
  USING (true);

-- Allow public to delete orders (for demo - in production this should be restricted)
DROP POLICY IF EXISTS "Public can delete orders" ON public.orders;
CREATE POLICY "Public can delete orders"
  ON public.orders
  FOR DELETE
  USING (true);

-- Make customer_id nullable in orders table if not already
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;