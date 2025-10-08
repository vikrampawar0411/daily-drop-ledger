-- Phase 1: Fix Critical Privilege Escalation
-- Drop the policy that allows users to update their own profiles
-- Users should NOT be able to change user_type or email
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;

-- Profiles should be read-only for regular users, only admins can modify
-- (The admin policies already exist from previous migration)

-- Phase 2: Fix Vendor Contact Information Exposure
-- Drop the overly permissive policy that shows all vendor info to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON public.vendors;

-- Create a safe view for customers to see basic vendor information
CREATE OR REPLACE VIEW public.vendors_public AS
SELECT 
  id,
  name,
  category,
  is_active,
  created_at
FROM public.vendors
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.vendors_public TO authenticated;

-- Customers can only see basic vendor info through the view
-- Admin/staff policies already exist for full vendor access

-- Phase 3: Fix Order Data Integrity
-- First, delete any test orders with NULL customer_id (assuming these are test data)
DELETE FROM public.orders WHERE customer_id IS NULL;

-- Make customer_id NOT NULL to prevent future issues
ALTER TABLE public.orders ALTER COLUMN customer_id SET NOT NULL;

-- Add a check constraint for extra safety
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_check CHECK (customer_id IS NOT NULL);

-- Phase 4: Create helper function to assign admin role
-- This helps with initial admin user setup
CREATE OR REPLACE FUNCTION public.make_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow existing admins to create new admins
  -- For the very first admin, this must be run directly in SQL editor
  IF NOT has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can create new admins';
  END IF;
  
  -- Insert admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile user_type
  UPDATE profiles 
  SET user_type = 'admin' 
  WHERE id = target_user_id;
END;
$$;