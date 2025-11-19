-- Fix vendor_customer_connections RLS policy to use user_id instead of email
DROP POLICY IF EXISTS "Vendors can view their connections" ON vendor_customer_connections;

CREATE POLICY "Vendors can view their connections" 
ON vendor_customer_connections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_customer_connections.vendor_id 
      AND v.user_id = auth.uid()
  )
);

-- Fix vendor_can_view_customer function to use user_id instead of email
CREATE OR REPLACE FUNCTION public.vendor_can_view_customer(
  _vendor_user_id uuid,
  _customer_id uuid
)
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

-- Optionally sync vendor emails from profiles for data quality
UPDATE vendors v
SET email = p.email
FROM profiles p
WHERE v.user_id = p.id
  AND (v.email IS NULL OR v.email = '');