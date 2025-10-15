-- Fix RLS policy for customers to view only their own orders
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;

CREATE POLICY "Customers can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = orders.customer_id
    AND c.user_id = auth.uid()
  )
);

-- Fix RLS policy for customers to create orders
DROP POLICY IF EXISTS "Customers can create orders" ON orders;

CREATE POLICY "Customers can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = orders.customer_id
    AND c.user_id = auth.uid()
  )
);

-- Fix RLS policy for customers to delete their own orders
DROP POLICY IF EXISTS "Customers can delete their own orders" ON orders;

CREATE POLICY "Customers can delete their own orders"
ON orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = orders.customer_id
    AND c.user_id = auth.uid()
  )
);

-- Add RLS policy for customers to manage their vendor connections
CREATE POLICY "Customers can manage their own vendor connections"
ON vendor_customer_connections
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = vendor_customer_connections.customer_id
    AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = vendor_customer_connections.customer_id
    AND c.user_id = auth.uid()
  )
);