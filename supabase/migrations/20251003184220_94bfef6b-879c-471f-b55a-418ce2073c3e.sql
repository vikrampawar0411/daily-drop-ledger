-- Fix products table - currently has open public access
DROP POLICY IF EXISTS "Allow public delete access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public update access to products" ON public.products;

-- Secure products table with role-based access
-- Only authenticated users can view products (for ordering)
CREATE POLICY "Authenticated users can view active products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins and staff can create products
CREATE POLICY "Admins and staff can create products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Only admins and staff can update products
CREATE POLICY "Admins and staff can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Only admins can delete products
CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Explicit denial for anonymous access to products
CREATE POLICY "Deny anonymous read access to products"
  ON public.products
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous insert access to products"
  ON public.products
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Deny anonymous update access to products"
  ON public.products
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anonymous delete access to products"
  ON public.products
  FOR DELETE
  TO anon
  USING (false);

-- Strengthen vendors table - restrict viewing to admins and staff only
DROP POLICY IF EXISTS "Authenticated users can view active vendors" ON public.vendors;

CREATE POLICY "Admins and staff can view all vendors"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Add explicit denial for anonymous access to vendors
CREATE POLICY "Deny anonymous read access to vendors"
  ON public.vendors
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous insert access to vendors"
  ON public.vendors
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Deny anonymous update access to vendors"
  ON public.vendors
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anonymous delete access to vendors"
  ON public.vendors
  FOR DELETE
  TO anon
  USING (false);