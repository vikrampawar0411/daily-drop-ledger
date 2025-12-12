-- ============================================================================
-- FIX: Resolve RLS Recursion Error in Customers Table
-- ============================================================================
-- This fixes the "infinite recursion detected in policy for relation customers" error
-- by removing the problematic vendor policy that was causing circular dependencies

-- Step 1: Drop all problematic policies
DROP POLICY IF EXISTS "Vendors can view customers" ON customers;
DROP POLICY IF EXISTS "Vendors can view all customers" ON customers;
DROP POLICY IF EXISTS "Vendors can view their connected customers" ON customers;
DROP POLICY IF EXISTS "Vendors can view connected customers only" ON customers;

-- Step 2: Keep only the safe policies for customers
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
CREATE POLICY "Customers can view own profile"
  ON customers
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own profile" ON customers;
CREATE POLICY "Customers can update own profile"
  ON customers
  FOR UPDATE
  USING (user_id = auth.uid());

-- Step 3: Verify the fix
SELECT 'RLS policies fixed! ✅' as status;
SELECT policyname, qual FROM pg_policies WHERE tablename = 'customers' ORDER BY policyname;
