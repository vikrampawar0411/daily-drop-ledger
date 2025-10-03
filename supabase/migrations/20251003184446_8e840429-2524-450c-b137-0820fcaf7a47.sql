-- Drop all existing policies for orders table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.orders';
    END LOOP;
END $$;

-- Drop all existing policies for daily_deliveries table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'daily_deliveries' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.daily_deliveries';
    END LOOP;
END $$;

-- Secure ORDERS table with role-based policies
-- Admins and staff can view all orders
CREATE POLICY "Admins and staff can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Admins and staff can create orders
CREATE POLICY "Admins and staff can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Admins and staff can update orders
CREATE POLICY "Admins and staff can update orders"
  ON public.orders
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

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Explicit denial for anonymous access to orders
CREATE POLICY "Deny anonymous read access to orders"
  ON public.orders
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous insert access to orders"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Deny anonymous update access to orders"
  ON public.orders
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anonymous delete access to orders"
  ON public.orders
  FOR DELETE
  TO anon
  USING (false);

-- Secure DAILY_DELIVERIES table with role-based policies
-- Admins and staff can view all deliveries
CREATE POLICY "Admins and staff can view all deliveries"
  ON public.daily_deliveries
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Admins and staff can create delivery records
CREATE POLICY "Admins and staff can create deliveries"
  ON public.daily_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Admins and staff can update delivery records
CREATE POLICY "Admins and staff can update deliveries"
  ON public.daily_deliveries
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

-- Only admins can delete delivery records
CREATE POLICY "Admins can delete deliveries"
  ON public.daily_deliveries
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Explicit denial for anonymous access to daily_deliveries
CREATE POLICY "Deny anonymous read access to daily_deliveries"
  ON public.daily_deliveries
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous insert access to daily_deliveries"
  ON public.daily_deliveries
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Deny anonymous update access to daily_deliveries"
  ON public.daily_deliveries
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anonymous delete access to daily_deliveries"
  ON public.daily_deliveries
  FOR DELETE
  TO anon
  USING (false);