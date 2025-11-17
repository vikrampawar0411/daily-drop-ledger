-- Allow customers to update their own order status
CREATE POLICY "Customers can update their own order status"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM customers c
    WHERE c.id = orders.customer_id 
    AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM customers c
    WHERE c.id = orders.customer_id 
    AND c.user_id = auth.uid()
  )
);