-- Drop existing public access policies for customers and vendors
DROP POLICY IF EXISTS "Allow public delete access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public update access to customers" ON public.customers;

DROP POLICY IF EXISTS "Allow public delete access to vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow public insert access to vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow public read access to vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow public update access to vendors" ON public.vendors;

-- Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer', 'vendor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Secure CUSTOMERS table with role-based access
-- Only admins and staff can view customer data
CREATE POLICY "Admins and staff can view all customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Only admins and staff can create customers
CREATE POLICY "Admins and staff can create customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Only admins and staff can update customers
CREATE POLICY "Admins and staff can update customers"
  ON public.customers
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

-- Only admins can delete customers
CREATE POLICY "Admins can delete customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Secure VENDORS table with role-based access
-- Authenticated users can view vendors (for placing orders)
CREATE POLICY "Authenticated users can view active vendors"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins and staff can create vendors
CREATE POLICY "Admins and staff can create vendors"
  ON public.vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Only admins and staff can update vendors
CREATE POLICY "Admins and staff can update vendors"
  ON public.vendors
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

-- Only admins can delete vendors
CREATE POLICY "Admins can delete vendors"
  ON public.vendors
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));