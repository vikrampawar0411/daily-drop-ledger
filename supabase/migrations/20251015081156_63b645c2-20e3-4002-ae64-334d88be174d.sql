-- Add RLS policy for vendors to view their orders
CREATE POLICY "Vendors can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = orders.vendor_id
    AND v.user_id = auth.uid()
  )
);

-- Add RLS policy for vendors to update their order status
CREATE POLICY "Vendors can update their order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = orders.vendor_id
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = orders.vendor_id
    AND v.user_id = auth.uid()
  )
);

-- Call link_orphaned_records to fix existing data linkage
SELECT link_orphaned_records();