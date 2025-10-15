-- Allow vendors to view customers who have placed orders with them
CREATE POLICY "Vendors can view customers who ordered from them"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN vendors v ON v.id = o.vendor_id
    WHERE o.customer_id = customers.id
    AND v.user_id = auth.uid()
  )
);

-- Allow vendors to view customers they are connected to
CREATE POLICY "Vendors can view their connected customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_customer_connections vcc
    JOIN vendors v ON v.id = vcc.vendor_id
    WHERE vcc.customer_id = customers.id
    AND v.user_id = auth.uid()
  )
);