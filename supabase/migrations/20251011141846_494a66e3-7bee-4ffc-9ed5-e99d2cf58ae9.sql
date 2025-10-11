-- Allow public (unauthenticated) users to view active vendors
CREATE POLICY "Public users can view active vendors"
ON public.vendors
FOR SELECT
TO anon
USING (is_active = true);

-- Allow public (unauthenticated) users to view active products
CREATE POLICY "Public users can view active products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);