-- ==========================================
-- SECURITY FIX: Remove Critical Vulnerabilities
-- ==========================================

-- 1. Drop plaintext password columns from vendors and customers tables
-- These passwords should never be stored in application tables
-- Supabase Auth handles password hashing securely
ALTER TABLE public.vendors DROP COLUMN IF EXISTS password;
ALTER TABLE public.customers DROP COLUMN IF EXISTS password;

-- 2. Drop dangerous anonymous access policies for orders
-- These allow unauthenticated users to create and delete orders
DROP POLICY IF EXISTS "Anonymous users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anonymous users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;

-- 3. Ensure proper authenticated-only access to orders
-- Customers can only see/manage their own orders
-- Vendors can only see orders assigned to them
-- Admins can see all orders (already have policy)

-- These policies should already exist, but verify they're the only ones allowing access
-- The existing policies are:
-- - "Customers can view their own orders"
-- - "Customers can create orders" 
-- - "Customers can update their own order status"
-- - "Customers can delete their own orders"
-- - "Vendors can view their orders"
-- - "Vendors can update their order status"
-- - "Admins can manage all orders"

-- No additional policies needed - the existing authenticated policies are secure