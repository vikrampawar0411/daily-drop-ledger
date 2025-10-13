-- Allow authenticated users to insert their own customer record during signup
CREATE POLICY "Users can create their own customer record"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own vendor record during signup
CREATE POLICY "Users can create their own vendor record"
ON public.vendors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own customer record
CREATE POLICY "Users can view their own customer record"
ON public.customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to view their own vendor record
CREATE POLICY "Users can view their own vendor record"
ON public.vendors
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);