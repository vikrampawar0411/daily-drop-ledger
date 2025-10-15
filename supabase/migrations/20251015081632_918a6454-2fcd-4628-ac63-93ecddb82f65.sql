-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Vendors can view customers who ordered from them" ON public.customers;
DROP POLICY IF EXISTS "Vendors can view their connected customers" ON public.customers;

-- Create security definer function to check if vendor can view customer
CREATE OR REPLACE FUNCTION public.vendor_can_view_customer(_vendor_user_id uuid, _customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if vendor has orders from this customer
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN vendors v ON v.id = o.vendor_id
    WHERE o.customer_id = _customer_id
    AND v.user_id = _vendor_user_id
  )
  OR
  -- Check if vendor is connected to this customer
  EXISTS (
    SELECT 1 FROM vendor_customer_connections vcc
    JOIN vendors v ON v.id = vcc.vendor_id
    WHERE vcc.customer_id = _customer_id
    AND v.user_id = _vendor_user_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Vendors can view their related customers"
ON public.customers
FOR SELECT
TO authenticated
USING (public.vendor_can_view_customer(auth.uid(), customers.id));