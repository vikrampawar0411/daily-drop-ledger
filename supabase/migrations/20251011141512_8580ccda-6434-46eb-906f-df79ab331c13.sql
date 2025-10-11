-- Allow authenticated users (customers) to view active vendors
CREATE POLICY "Authenticated users can view active vendors"
ON public.vendors
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow authenticated users (customers) to view active products  
-- (This policy already exists but ensuring consistency)
CREATE POLICY "Customers can view active vendors"
ON public.vendors
FOR SELECT
TO authenticated
USING (is_active = true AND auth.uid() IS NOT NULL);