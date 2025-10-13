-- Allow anonymous (guest) users to insert orders
CREATE POLICY "Anonymous users can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);