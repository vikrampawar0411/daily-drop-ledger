-- Make customer_id nullable for guest orders
ALTER TABLE public.orders 
ALTER COLUMN customer_id DROP NOT NULL,
ALTER COLUMN customer_id DROP DEFAULT;

-- Allow anonymous users to insert orders
CREATE POLICY "Anonymous users can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to view all orders (for their order confirmation)
CREATE POLICY "Anonymous users can view orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to delete orders
CREATE POLICY "Anonymous users can delete orders"
ON public.orders
FOR DELETE
TO anon
USING (true);