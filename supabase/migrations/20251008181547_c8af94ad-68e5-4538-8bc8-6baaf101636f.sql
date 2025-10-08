-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('vendor', 'customer', 'admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Remove all public access policies from orders
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can delete orders" ON public.orders;

-- Remove public access from vendors
DROP POLICY IF EXISTS "Public can view active vendors" ON public.vendors;

-- Remove public access from products  
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- Add customer-only policies for orders
CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid()::text = customer_id::text);

CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid()::text = customer_id::text);

CREATE POLICY "Customers can delete their own orders"
  ON public.orders FOR DELETE
  USING (auth.uid()::text = customer_id::text);

-- Allow authenticated users to view vendors (but not contact info in queries)
CREATE POLICY "Authenticated users can view vendors"
  ON public.vendors FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Allow authenticated users to view products
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Make customer_id use auth.uid() by default (for new inserts after auth is implemented)
-- Note: We keep it nullable for now to support existing data, but new inserts should always have it
ALTER TABLE public.orders ALTER COLUMN customer_id SET DEFAULT auth.uid();

-- Add trigger to auto-update profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();